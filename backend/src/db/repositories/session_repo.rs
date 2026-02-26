use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::session::UserSession;
use crate::errors::AppResult;

/// Repository for user session management.
pub struct SessionRepository;

impl SessionRepository {
    /// Create or update a session for a device.
    pub async fn upsert(
        pool: &PgPool,
        user_id: Uuid,
        device_id: Option<&str>,
        fcm_token: Option<&str>,
        platform: Option<&str>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> AppResult<UserSession> {
        let session = sqlx::query_as::<_, UserSession>(
            r#"
            INSERT INTO user_sessions (user_id, device_id, fcm_token, platform, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
                fcm_token = COALESCE($3, user_sessions.fcm_token),
                last_active_at = NOW(),
                ip_address = COALESCE($5, user_sessions.ip_address)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(device_id)
        .bind(fcm_token)
        .bind(platform)
        .bind(ip_address)
        .bind(user_agent)
        .fetch_one(pool)
        .await?;

        Ok(session)
    }

    /// Get all FCM tokens for a user (for sending push notifications).
    pub async fn get_fcm_tokens(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<String>> {
        let tokens: Vec<(Option<String>,)> = sqlx::query_as(
            "SELECT fcm_token FROM user_sessions WHERE user_id = $1 AND fcm_token IS NOT NULL"
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(tokens.into_iter().filter_map(|t| t.0).collect())
    }

    /// Update FCM token for a device.
    pub async fn update_fcm_token(
        pool: &PgPool,
        user_id: Uuid,
        device_id: &str,
        fcm_token: &str,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE user_sessions SET fcm_token = $3, last_active_at = NOW()
            WHERE user_id = $1 AND device_id = $2
            "#,
        )
        .bind(user_id)
        .bind(device_id)
        .bind(fcm_token)
        .execute(pool)
        .await?;
        Ok(())
    }

    /// Delete all sessions for a user (logout everywhere).
    pub async fn delete_all(pool: &PgPool, user_id: Uuid) -> AppResult<()> {
        sqlx::query("DELETE FROM user_sessions WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }
}
