use axum::{
    Json, Router,
    extract::{Path, State},
    http::{StatusCode, header},
    middleware,
    response::IntoResponse,
    routing::{delete, get, post, put},
};
use serde::Deserialize;
use std::sync::Arc;

use crate::config::ServerSettings;
use crate::docker::{self, CreateSpec};
use crate::state::AppState;

pub fn router(state: Arc<AppState>) -> Router {
    let api = Router::new()
        .route("/servers", post(create_server))
        .route("/servers/{id}/start", post(start_server))
        .route("/servers/{id}/stop", post(stop_server))
        .route("/servers/{id}", delete(delete_server))
        .route("/servers/{id}/settings", put(apply_settings))
        .route("/servers/{id}/status", get(server_status))
        .route("/servers/{id}/world.zip", get(download_world))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            crate::auth::require_token,
        ));

    Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest("/api", api)
        .with_state(state)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateRequest {
    server_id: uuid::Uuid,
    subdomain: String,
    image: String,
    volume_name: String,
    mem_mb: i64,
    cpu_millicores: i64,
    settings: ServerSettings,
}

async fn create_server(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let spec = CreateSpec {
        server_id: req.server_id,
        subdomain: req.subdomain.clone(),
        image: req.image,
        volume_name: req.volume_name,
        mem_mb: req.mem_mb,
        cpu_millicores: req.cpu_millicores,
        network: state.cfg.network.clone(),
        base_domain: state.cfg.base_domain.clone(),
        pumpkin_toml: req.settings.to_pumpkin_toml(),
        whitelist_json: req.settings.to_whitelist_json(&state.http).await,
    };

    let container_id = docker::create_and_start(&state.docker, &spec)
        .await
        .map_err(internal)?;

    Ok(Json(serde_json::json!({ "containerId": container_id })))
}

async fn start_server(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // If the container is gone (pruned, crash), recreate it from the DB row.
    if docker::is_running(&state.docker, id).await.is_none() {
        let row = crate::db::get_server(&state.db, id).await.map_err(internal)?;
        recreate_from_row(&state, &row).await?;
    } else {
        docker::start(&state.docker, id).await.map_err(internal)?;
    }

    // Re-add the route explicitly in case it was removed when the user stopped
    // the server (discovery would also re-add it on the start event).
    if let Ok(row) = crate::db::get_server(&state.db, id).await {
        crate::router::route_add(
            &state.http,
            &state.cfg.router_api,
            &format!("{}.{}", row.subdomain, state.cfg.base_domain),
            &format!("{}:25565", docker::container_name(id)),
        )
        .await;
    }
    Ok(StatusCode::OK)
}

async fn stop_server(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Delete the route first so no join can wake the server while it stops.
    if let Ok(row) = crate::db::get_server(&state.db, id).await {
        crate::router::route_delete(
            &state.http,
            &state.cfg.router_api,
            &format!("{}.{}", row.subdomain, state.cfg.base_domain),
        )
        .await;
    }
    docker::stop(&state.docker, id).await.map_err(internal)?;
    Ok(StatusCode::OK)
}

async fn delete_server(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    if let Ok(row) = crate::db::get_server(&state.db, id).await {
        crate::router::route_delete(
            &state.http,
            &state.cfg.router_api,
            &format!("{}.{}", row.subdomain, state.cfg.base_domain),
        )
        .await;
    }
    let _ = docker::remove(&state.docker, id).await;
    Ok(StatusCode::OK)
}

async fn apply_settings(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
    Json(settings): Json<ServerSettings>,
) -> Result<StatusCode, (StatusCode, String)> {
    let row = crate::db::get_server(&state.db, id).await.map_err(internal)?;
    let container_id = row
        .container_id
        .clone()
        .unwrap_or_else(|| docker::container_name(id));

    let toml = settings.to_pumpkin_toml();
    let whitelist = settings.to_whitelist_json(&state.http).await;

    upload_to_container(&state, &container_id, &toml, &whitelist).await?;

    // Config is read at boot, so restart if the server is running.
    if docker::is_running(&state.docker, id).await == Some(true) {
        docker::stop(&state.docker, id).await.map_err(internal)?;
        docker::start(&state.docker, id).await.map_err(internal)?;
    }
    Ok(StatusCode::OK)
}

async fn server_status(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let running = docker::is_running(&state.docker, id).await;
    let status = match running {
        Some(true) => "running",
        Some(false) => "stopped",
        None => "missing",
    };
    // When running, also do a real Minecraft status ping for player counts.
    let players = if running == Some(true) {
        match crate::mcquery::ping(&docker::container_name(id), 25565).await {
            Ok(p) => serde_json::json!({ "online": p.players_online, "max": p.players_max }),
            Err(_) => serde_json::Value::Null,
        }
    } else {
        serde_json::Value::Null
    };
    Json(serde_json::json!({ "status": status, "players": players }))
}

async fn download_world(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let row = crate::db::get_server(&state.db, id).await.map_err(internal)?;
    let zip = docker::download_world_zip(&state.docker, id)
        .await
        .map_err(internal)?;

    let filename = format!("{}-world.zip", row.subdomain);
    Ok((
        [
            (header::CONTENT_TYPE, "application/zip".to_string()),
            (
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
        ],
        zip,
    ))
}

// ---------- helpers ----------

async fn upload_to_container(
    state: &AppState,
    container_id: &str,
    pumpkin_toml: &str,
    whitelist_json: &str,
) -> Result<(), (StatusCode, String)> {
    docker::upload_configs(&state.docker, container_id, pumpkin_toml, whitelist_json)
        .await
        .map_err(internal)
}

pub async fn recreate_from_row(
    state: &AppState,
    row: &crate::db::ServerRow,
) -> Result<(), (StatusCode, String)> {
    let spec = CreateSpec {
        server_id: row.id,
        subdomain: row.subdomain.clone(),
        image: row.image.clone(),
        volume_name: row.volume_name.clone(),
        mem_mb: 1024,
        cpu_millicores: 2000,
        network: state.cfg.network.clone(),
        base_domain: state.cfg.base_domain.clone(),
        pumpkin_toml: row.settings.to_pumpkin_toml(),
        whitelist_json: row.settings.to_whitelist_json(&state.http).await,
    };
    docker::create_and_start(&state.docker, &spec)
        .await
        .map_err(internal)?;
    Ok(())
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    let msg = e.to_string();
    tracing::error!(%msg, "request failed");
    (StatusCode::INTERNAL_SERVER_ERROR, msg)
}
