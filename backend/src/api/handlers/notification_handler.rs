use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::notification::*;
use crate::db::repositories::NotificationRepository;
use crate::errors::AppError;

/// GET /notifications
pub async fn list_notifications(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    query: web::Query<crate::db::models::wardrobe::PaginationParams>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    let (notifications, total) = NotificationRepository::list_by_user(&pool, user.id, page, per_page).await?;
    let unread = NotificationRepository::count_unread(&pool, user.id).await?;

    Ok(ApiResponse::success(serde_json::json!({
        "notifications": notifications,
        "unread_count": unread,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": ((total as f64) / (per_page as f64)).ceil() as u32,
        }
    })))
}

/// PATCH /notifications/{id}/read
pub async fn mark_read(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let notif_id = path.into_inner();
    NotificationRepository::mark_read(&pool, user.id, notif_id).await?;

    Ok(crate::api::response::ok_message("Notification marked as read"))
}

/// POST /notifications/token
pub async fn register_token(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<RegisterFcmTokenRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    use crate::db::repositories::SessionRepository;

    SessionRepository::upsert(
        &pool,
        user.id,
        body.device_id.as_deref(),
        Some(&body.token),
        Some(&body.platform),
        None,
        None,
    )
    .await?;

    Ok(crate::api::response::ok_message("FCM token registered"))
}
