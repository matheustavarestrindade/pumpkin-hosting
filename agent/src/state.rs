use sqlx::PgPool;

pub struct AgentConfig {
    pub token: String,
    pub database_url: String,
    pub node_id: uuid::Uuid,
    pub network: String,
    pub base_domain: String,
    pub router_api: String,
}

impl AgentConfig {
    pub fn from_env() -> Self {
        Self {
            token: std::env::var("AGENT_TOKEN").expect("AGENT_TOKEN is required"),
            database_url: std::env::var("DATABASE_URL").expect("DATABASE_URL is required"),
            node_id: std::env::var("NODE_ID")
                .expect("NODE_ID is required")
                .parse()
                .expect("NODE_ID must be a uuid"),
            network: std::env::var("MC_NETWORK").unwrap_or_else(|_| "mc-net".to_string()),
            base_domain: std::env::var("BASE_DOMAIN").expect("BASE_DOMAIN is required"),
            router_api: std::env::var("ROUTER_API")
                .unwrap_or_else(|_| "http://router:25566".to_string()),
        }
    }
}

pub struct AppState {
    pub cfg: AgentConfig,
    pub db: PgPool,
    pub docker: bollard::Docker,
    pub http: reqwest::Client,
}
