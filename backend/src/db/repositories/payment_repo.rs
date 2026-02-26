use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::payment::*;
use crate::errors::AppResult;

/// Repository for payment operations.
pub struct PaymentRepository;

impl PaymentRepository {
    /// Create a payment record.
    pub async fn create(
        pool: &PgPool,
        subscription_id: Uuid,
        user_id: Uuid,
        razorpay_order_id: &str,
        amount_inr: i64,
    ) -> AppResult<Payment> {
        let payment = sqlx::query_as::<_, Payment>(
            r#"
            INSERT INTO payments (subscription_id, user_id, razorpay_order_id, amount_inr, status)
            VALUES ($1, $2, $3, $4, 'created')
            RETURNING *
            "#,
        )
        .bind(subscription_id)
        .bind(user_id)
        .bind(razorpay_order_id)
        .bind(amount_inr)
        .fetch_one(pool)
        .await?;

        Ok(payment)
    }

    /// Update payment after capture.
    pub async fn update_captured(
        pool: &PgPool,
        razorpay_order_id: &str,
        razorpay_payment_id: &str,
        method: Option<&str>,
    ) -> AppResult<Payment> {
        let payment = sqlx::query_as::<_, Payment>(
            r#"
            UPDATE payments SET
                razorpay_payment_id = $2,
                status = 'captured',
                method = $3
            WHERE razorpay_order_id = $1
            RETURNING *
            "#,
        )
        .bind(razorpay_order_id)
        .bind(razorpay_payment_id)
        .bind(method)
        .fetch_one(pool)
        .await?;

        Ok(payment)
    }

    /// Mark payment as failed.
    pub async fn mark_failed(
        pool: &PgPool,
        razorpay_order_id: &str,
        error_code: Option<&str>,
        error_description: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE payments SET
                status = 'failed',
                error_code = $2,
                error_description = $3
            WHERE razorpay_order_id = $1
            "#,
        )
        .bind(razorpay_order_id)
        .bind(error_code)
        .bind(error_description)
        .execute(pool)
        .await?;
        Ok(())
    }

    /// Get payments for a user.
    pub async fn list_by_user(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Payment>> {
        let payments = sqlx::query_as::<_, Payment>(
            "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(payments)
    }
}
