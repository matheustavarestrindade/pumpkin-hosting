mod auth;
mod config;
mod db;
mod docker;
mod mcquery;
mod reconcile;
mod router;
mod routes;
mod state;

use std::sync::Arc;
use tokio::time::{Duration, interval};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let cfg = state::AgentConfig::from_env();
    let pool = db::connect(&cfg.database_url).await;
    let docker = docker::connect();

    docker::ensure_network(&docker, &cfg.network).await;

    let state = Arc::new(state::AppState {
        cfg,
        db: pool,
        docker,
        http: reqwest::Client::new(),
    });

    reconcile::run(&state).await;

    let reconcile_state = state.clone();
    tokio::spawn(async move {
        let mut tick = interval(Duration::from_secs(60));
        loop {
            tick.tick().await;
            reconcile::run(&reconcile_state).await;
        }
    });

    // Unpaid server sweep: every 5 minutes, drop provisioning rows older than 30min.
    let sweep_state = state.clone();
    tokio::spawn(async move {
        let mut tick = interval(Duration::from_secs(300));
        loop {
            tick.tick().await;
            match db::sweep_unpaid(&sweep_state.db, sweep_state.cfg.node_id).await {
                Ok(0) => {}
                Ok(n) => tracing::info!(%n, "swept unpaid provisioning servers"),
                Err(e) => tracing::error!(%e, "unpaid sweep failed"),
            }
        }
    });

    let app = routes::router(state);
    let addr = std::env::var("AGENT_BIND").unwrap_or_else(|_| "0.0.0.0:3001".to_string());
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    tracing::info!(%addr, "agent listening");
    axum::serve(listener, app).await.expect("serve");
}
