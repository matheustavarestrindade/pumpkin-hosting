use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use crate::db;
use crate::docker;
use crate::routes;
use crate::state::AppState;

/// Brings docker state in line with the database.
/// - container without a DB row -> orphan -> remove
/// - DB says running but container missing/stopped -> (re)create and start
/// - DB says stopped but container running -> stop
pub async fn run(state: &Arc<AppState>) {
    if let Err(e) = run_inner(state).await {
        tracing::error!(%e, "reconcile failed");
    }
    db::heartbeat(&state.db, state.cfg.node_id).await;
}

async fn run_inner(state: &Arc<AppState>) -> Result<(), String> {
    // Fail-safe: if the DB is unreachable, abort. Never remove containers
    // when we cannot know the truth.
    let rows = db::servers_on_node(&state.db, state.cfg.node_id)
        .await
        .map_err(|e| format!("db query failed: {e}"))?;
    let containers = docker::list_managed(&state.docker).await;

    let rows_by_id: HashMap<_, _> = rows.iter().map(|r| (r.id, r)).collect();
    let container_ids: HashSet<_> = containers.iter().map(|c| c.server_id).collect();

    // Remove orphans: container exists but no DB row.
    for c in &containers {
        if !rows_by_id.contains_key(&c.server_id) {
            tracing::warn!(%c.server_id, %c.subdomain, "removing orphan container");
            let _ = docker::remove(&state.docker, c.server_id).await;
        }
    }

    // Grace period ended: remove container, volume and DB row.
    let expired = db::expired_deletions(&state.db, state.cfg.node_id)
        .await
        .map_err(|e| format!("db query failed: {e}"))?;
    for row in &expired {
        tracing::info!(%row.id, %row.subdomain, "grace period ended, deleting server");
        let _ = docker::remove(&state.docker, row.id).await;
        let _ = docker::remove_volume(&state.docker, &row.volume_name).await;
        db::delete_server_row(&state.db, row.id).await;
    }

    for row in &rows {
        match row.status.as_str() {
            "running" | "starting" => {
                if !container_ids.contains(&row.id) {
                    tracing::info!(%row.id, "container missing, recreating from volume");
                    if let Err(e) = routes::recreate_from_row(state, row).await {
                        tracing::error!(%row.id, err = %e.1, "recreate failed");
                    }
                } else {
                    match docker::is_running(&state.docker, row.id).await {
                        Some(false) => {
                            tracing::info!(%row.id, "container stopped but should run, starting");
                            let _ = docker::start(&state.docker, row.id).await;
                        }
                        None => {
                            if let Err(e) = routes::recreate_from_row(state, row).await {
                                tracing::error!(%row.id, err = %e.1, "recreate failed");
                            }
                        }
                        _ => {}
                    }
                }
            }
            "stopped" | "suspended" | "error" => {
                if container_ids.contains(&row.id)
                    && docker::is_running(&state.docker, row.id).await == Some(true)
                {
                    tracing::info!(%row.id, "container running but should be stopped");
                    let _ = docker::stop(&state.docker, row.id).await;
                }
            }
            _ => {}
        }
    }

    Ok(())
}
