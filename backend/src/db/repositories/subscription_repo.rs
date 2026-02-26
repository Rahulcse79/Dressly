use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::subscription::*;
use crate::errors::AppResult;
use chrono::Utc;

/// Repository for subscription operations.
pub struct SubscriptionRepository;

impl SubscriptionRepository {
    /// Create a new subscription.
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        plan_type: &PlanType,
        price_inr: i64,
        razorpay_order_id: &str,
    ) -> AppResult<Subscription> {
        let sub = sqlx::query_as::<_, Subscription>(
            r#"
            INSERT INTO subscriptions (user_id, plan_type, status, price_inr, razorpay_order_id)
            VALUES ($1, $2, 'pending', $3, $4)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(plan_type)
        .bind(price_inr)
        .bind(razorpay_order_id)
        .fetch_one(pool)
        .await?;

        Ok(sub)
    }

    /// Activate subscription after payment verification.
    pub async fn activate(
        pool: &PgPool,
        subscription_id: Uuid,
        razorpay_subscription_id: Option<&str>,
    ) -> AppResult<Subscription> {
        let now = Utc::now();
        let expires_at = now + chrono::Duration::days(30);

        let sub = sqlx::query_as::<_, Subscription>(
            r#"
            UPDATE subscriptions SET
                status = 'active',
                razorpay_subscription_id = $2,
                starts_at = $3,
                expires_at = $4
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(subscription_id)
        .bind(razorpay_subscription_id)
        .bind(now)
        .bind(expires_at)
        .fetch_one(pool)
        .await?;

        Ok(sub)
    }

    /// Get active subscription for a user.
    pub async fn get_active(pool: &PgPool, user_id: Uuid) -> AppResult<Option<Subscription>> {
        let sub = sqlx::query_as::<_, Subscription>(
            r#"
            SELECT * FROM subscriptions
            WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(sub)
    }

    /// Find subscription by Razorpay order ID.
    pub async fn find_by_order_id(pool: &PgPool, order_id: &str) -> AppResult<Option<Subscription>> {
        let sub = sqlx::query_as::<_, Subscription>(
            "SELECT * FROM subscriptions WHERE razorpay_order_id = $1"
        )
        .bind(order_id)
        .fetch_optional(pool)
        .await?;

        Ok(sub)
    }

    /// Cancel subscription.
    pub async fn cancel(pool: &PgPool, subscription_id: Uuid) -> AppResult<()> {
        sqlx::query(
            "UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1"
        )
        .bind(subscription_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    /// List all subscriptions (admin).
    pub async fn list_all(
        pool: &PgPool,
        page: u32,
        per_page: u32,
    ) -> AppResult<(Vec<Subscription>, i64)> {
        let offset = ((page.saturating_sub(1)) * per_page) as i64;

        let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM subscriptions")
            .fetch_one(pool)
            .await?;

        let subs = sqlx::query_as::<_, Subscription>(
            "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT $1 OFFSET $2"
        )
        .bind(per_page as i64)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok((subs, total.0))
    }

    /// Expire old subscriptions (cron job).
    pub async fn expire_old(pool: &PgPool) -> AppResult<u64> {
        let result = sqlx::query(
            "UPDATE subscriptions SET status = 'expired' WHERE status = 'active' AND expires_at < NOW()"
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}
