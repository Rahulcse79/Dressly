use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::notification::*;
use crate::errors::AppResult;

/// Repository for notification operations.
pub struct NotificationRepository;

impl NotificationRepository {
    /// Create a notification.
    pub async fn create(pool: &PgPool, req: &CreateNotificationRequest) -> AppResult<Notification> {
        let notif = sqlx::query_as::<_, Notification>(
            r#"
            INSERT INTO notifications (user_id, title, body, notification_type, data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(req.user_id)
        .bind(&req.title)
        .bind(&req.body)
        .bind(&req.notification_type)
        .bind(&req.data)
        .fetch_one(pool)
        .await?;

        Ok(notif)
    }

    /// List notifications for a user (paginated).
    pub async fn list_by_user(
        pool: &PgPool,
        user_id: Uuid,
        page: u32,
        per_page: u32,
    ) -> AppResult<(Vec<Notification>, i64)> {
        let offset = ((page.saturating_sub(1)) * per_page) as i64;

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        let notifs = sqlx::query_as::<_, Notification>(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(user_id)
        .bind(per_page as i64)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok((notifs, total.0))
    }

    /// Mark notification as read.
    pub async fn mark_read(pool: &PgPool, user_id: Uuid, notification_id: Uuid) -> AppResult<()> {
        sqlx::query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2"
        )
        .bind(notification_id)
        .bind(user_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    /// Count unread notifications.
    pub async fn count_unread(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE"
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(count.0)
    }

    /// Mark all as read.
    pub async fn mark_all_read(pool: &PgPool, user_id: Uuid) -> AppResult<u64> {
        let result = sqlx::query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE"
        )
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}
