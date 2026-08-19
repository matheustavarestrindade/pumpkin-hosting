use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::config::ServerSettings;

pub async fn connect(url: &str) -> PgPool {
    PgPoolOptions::new()
        .max_connections(4)
        .connect(url)
        .await
        .expect("connect to postgres")
}

#[derive(Debug, sqlx::FromRow)]
pub struct ServerRow {
    pub id: uuid::Uuid,
    pub subdomain: String,
    pub image: String,
    pub volume_name: String,
    pub status: String,
    pub settings: sqlx::types::Json<ServerSettings>,
    pub container_id: Option<String>,
}

pub async fn get_server(pool: &PgPool, id: uuid::Uuid) -> Result<ServerRow, sqlx::Error> {
    sqlx::query_as::<_, ServerRow>(
        "select id, subdomain, image, volume_name, status::text as status, settings, container_id
         from servers where id = $1",
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

pub async fn servers_on_node(pool: &PgPool, node_id: uuid::Uuid) -> Result<Vec<ServerRow>, sqlx::Error> {
    sqlx::query_as::<_, ServerRow>(
        "select id, subdomain, image, volume_name, status::text as status, settings, container_id
         from servers where node_id = $1",
    )
    .bind(node_id)
    .fetch_all(pool)
    .await
}

pub async fn heartbeat(pool: &PgPool, node_id: uuid::Uuid) {
    let _ = sqlx::query("update nodes set last_seen_at = now() where id = $1")
        .bind(node_id)
        .execute(pool)
        .await;
}

/// Servers whose grace period ended: ready for volume + row deletion.
pub async fn expired_deletions(pool: &PgPool, node_id: uuid::Uuid) -> Result<Vec<ServerRow>, sqlx::Error> {
    sqlx::query_as::<_, ServerRow>(
        "select id, subdomain, image, volume_name, status::text as status, settings, container_id
         from servers where node_id = $1 and deletion_scheduled_at is not null and deletion_scheduled_at < now()",
    )
    .bind(node_id)
    .fetch_all(pool)
    .await
}

pub async fn delete_server_row(pool: &PgPool, id: uuid::Uuid) {
    let _ = sqlx::query("delete from servers where id = $1")
        .bind(id)
        .execute(pool)
        .await;
}
