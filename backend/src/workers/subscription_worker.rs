use sqlx::PgPool;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tracing::{info, error};

use crate::db::repositories::SubscriptionRepository;

/// Background worker that periodically checks for expired subscriptions.
/// Runs every hour and marks expired subscriptions.
pub async fn start_subscription_worker(pool: Arc<PgPool>) {
    let mut ticker = interval(Duration::from_secs(3600)); // Every hour

    info!("🔄 Subscription expiry worker started");

    loop {
        ticker.tick().await;

        match SubscriptionRepository::expire_old(&pool).await {
            Ok(count) => {
                if count > 0 {
                    info!("⏰ Expired {} subscriptions", count);
                }
            }
            Err(e) => {
                error!("❌ Subscription worker error: {}", e);
            }
        }
    }
}
