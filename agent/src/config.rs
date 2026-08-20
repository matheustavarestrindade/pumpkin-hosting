use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerSettings {
    pub difficulty: String,
    pub pvp: bool,
    pub max_players: i64,
    pub gamemode: String,
    pub motd: String,
    pub allowlist_enabled: bool,
    pub allowlist: Vec<String>,
    #[serde(default)]
    pub hardcore: bool,
}

impl ServerSettings {
    pub fn to_pumpkin_toml(&self) -> String {
        let difficulty = match self.difficulty.as_str() {
            "peaceful" => "Peaceful",
            "easy" => "Easy",
            "hard" => "Hard",
            _ => "Normal",
        };
        let gamemode = match self.gamemode.as_str() {
            "creative" => "Creative",
            _ => "Survival",
        };

        #[derive(Serialize)]
        struct Java {
            max_players: i64,
            motd: String,
        }
        #[derive(Serialize)]
        struct Networking {
            java: Java,
        }
        #[derive(Serialize)]
        struct Pvp {
            enabled: bool,
        }
        #[derive(Serialize)]
        struct PumpkinToml {
            default_difficulty: String,
            default_gamemode: String,
            force_gamemode: bool,
            hardcore: bool,
            white_list: bool,
            enforce_whitelist: bool,
            networking: Networking,
            pvp: Pvp,
        }

        let cfg = PumpkinToml {
            default_difficulty: difficulty.to_string(),
            default_gamemode: gamemode.to_string(),
            force_gamemode: true,
            hardcore: self.hardcore,
            white_list: self.allowlist_enabled,
            enforce_whitelist: self.allowlist_enabled,
            networking: Networking {
                java: Java {
                    max_players: self.max_players,
                    motd: self.motd.clone(),
                },
            },
            pvp: Pvp { enabled: self.pvp },
        };

        toml::to_string_pretty(&cfg).expect("serialize pumpkin.toml")
    }

    /// Vanilla-format whitelist.json with UUIDs resolved through the Mojang API.
    /// Names that do not resolve are skipped.
    pub async fn to_whitelist_json(&self, http: &reqwest::Client) -> String {
        if !self.allowlist_enabled || self.allowlist.is_empty() {
            return "[]".to_string();
        }

        #[derive(Deserialize)]
        struct Profile {
            id: String,
            name: String,
        }
        #[derive(Serialize)]
        struct Entry {
            uuid: String,
            name: String,
        }

        let mut entries = Vec::new();
        for name in &self.allowlist {
            let url = format!("https://api.mojang.com/users/profiles/minecraft/{name}");
            match http.get(&url).send().await {
                Ok(res) if res.status().is_success() => match res.json::<Profile>().await {
                    Ok(p) => entries.push(Entry {
                        uuid: dashed_uuid(&p.id),
                        name: p.name,
                    }),
                    Err(e) => tracing::warn!(%name, %e, "whitelist: bad mojang response"),
                },
                _ => tracing::warn!(%name, "whitelist: name not found, skipped"),
            }
        }

        serde_json::to_string_pretty(&entries).expect("serialize whitelist.json")
    }
}

fn dashed_uuid(raw: &str) -> String {
    if raw.len() == 32 {
        format!(
            "{}-{}-{}-{}-{}",
            &raw[0..8],
            &raw[8..12],
            &raw[12..16],
            &raw[16..20],
            &raw[20..32]
        )
    } else {
        raw.to_string()
    }
}
