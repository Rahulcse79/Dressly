use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Admin configuration key-value store.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AdminConfig {
    pub key: String,
    pub value: serde_json::Value,
    pub updated_at: DateTime<Utc>,
    pub updated_by: Option<String>,
}

/// Update config request.
#[derive(Debug, Deserialize)]
pub struct UpdateConfigRequest {
    pub configs: Vec<ConfigEntry>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ConfigEntry {
    pub key: String,
    pub value: serde_json::Value,
}

/// Well-known config keys.
pub const CONFIG_PRO_PRICE_INR: &str = "pro_price_inr";
pub const CONFIG_FREE_DAILY_QUOTA: &str = "free_daily_ai_quota";
pub const CONFIG_MAINTENANCE_MODE: &str = "maintenance_mode";
pub const CONFIG_APP_VERSION_MIN: &str = "app_version_min";
pub const CONFIG_ANNOUNCEMENT: &str = "announcement";
