use sqlx::PgPool;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tracing::{info, error};

use crate::db::models::user::UserRole;
use crate::db::repositories::{SubscriptionRepository, UserRepository};

/// Background worker that periodically checks for expired subscriptions.
/// Runs every hour and marks expired subscriptions, then downgrades affected users.
pub async fn start_subscription_worker(pool: Arc<PgPool>) {
    let mut ticker = interval(Duration::from_secs(3600)); // Every hour

    info!("🔄 Subscription expiry worker started");

    loop {
        ticker.tick().await;

        // Get user IDs of subscriptions that are about to expire
        let expired_user_ids = match get_expiring_user_ids(&pool).await {
            Ok(ids) => ids,
            Err(e) => {
                error!("❌ Failed to get expiring user IDs: {}", e);
                Vec::new()
            }
        };

        // Expire the subscriptions
        match SubscriptionRepository::expire_old(&pool).await {
            Ok(count) => {
                if count > 0 {
                    info!("⏰ Expired {} subscriptions", count);

                    // Downgrade affected users from Pro to User
                    for user_id in &expired_user_ids {
                        if let Err(e) = UserRepository::update_role(&pool, *user_id, &UserRole::User).await {
                            error!("❌ Failed to downgrade user {}: {}", user_id, e);
                        }
                    }

                    if !expired_user_ids.is_empty() {
                        info!("⬇️  Downgraded {} users from Pro to User", expired_user_ids.len());
                    }
                }
            }
            Err(e) => {
                error!("❌ Subscription worker error: {}", e);
            }
        }
    }
}

/// Get user IDs from subscriptions that are active but past expiry.
async fn get_expiring_user_ids(pool: &PgPool) -> Result<Vec<uuid::Uuid>, sqlx::Error> {
    let rows: Vec<(uuid::Uuid,)> = sqlx::query_as(
        "SELECT DISTINCT user_id FROM subscriptions WHERE status = 'active' AND expires_at < NOW()"
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(|(id,)| id).collect())
}
