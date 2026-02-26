use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// User device session for multi-device management.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub device_id: Option<String>,
    pub fcm_token: Option<String>,
    pub platform: Option<String>,
    pub app_version: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub last_active_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}
