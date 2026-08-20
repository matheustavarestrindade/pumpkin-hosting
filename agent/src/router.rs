use reqwest::Client;

/// Register/update a route on mc-router's REST API. Idempotent.
/// Discovery would re-add it on container start anyway; this makes it explicit.
pub async fn route_add(client: &Client, router_api: &str, fqdn: &str, backend: &str) {
    let res = client
        .post(format!("{router_api}/routes"))
        .json(&serde_json::json!({ "serverAddress": fqdn, "backend": backend }))
        .send()
        .await;
    if let Err(e) = res {
        tracing::warn!(%e, %fqdn, "router route add failed");
    }
}

/// Remove a route so join attempts cannot reach (or wake) the server.
pub async fn route_delete(client: &Client, router_api: &str, fqdn: &str) {
    let res = client
        .delete(format!("{router_api}/routes/{fqdn}"))
        .send()
        .await;
    if let Err(e) = res {
        tracing::warn!(%e, %fqdn, "router route delete failed");
    }
}
