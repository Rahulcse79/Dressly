use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use sqlx::PgPool;

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::admin_config::*;
use crate::db::models::user::UserRole;
use crate::db::repositories::{AdminConfigRepository, UserRepository, SubscriptionRepository};
use crate::errors::AppError;
use crate::services::redis_service::RedisService;
use crate::services::websocket::{WsManager, WsServerMessage};

/// GET /admin/users
pub async fn list_users(
    _req: HttpRequest,
    pool: web::Data<PgPool>,
    query: web::Query<crate::db::models::wardrobe::PaginationParams>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    let (users, total) = UserRepository::list_users(&pool, page, per_page).await?;

    Ok(ApiResponse::success(serde_json::json!({
        "users": users,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": ((total as f64) / (per_page as f64)).ceil() as u32,
        }
    })))
}

/// PATCH /admin/users/{id}
pub async fn update_user(
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();

    // Update role if provided
    if let Some(role_str) = body.get("role").and_then(|v| v.as_str()) {
        let role = match role_str {
            "admin" => UserRole::Admin,
            "pro" => UserRole::Pro,
            _ => UserRole::User,
        };
        UserRepository::update_role(&pool, user_id, &role).await?;
    }

    // Ban/unban user if provided
    if let Some(is_active) = body.get("is_active").and_then(|v| v.as_bool()) {
        if !is_active {
            UserRepository::soft_delete(&pool, user_id).await?;
        }
    }

    let updated_user = UserRepository::get_user_with_profile(&pool, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    Ok(ApiResponse::success(updated_user))
}

/// GET /admin/config
pub async fn get_config(pool: web::Data<PgPool>) -> Result<HttpResponse, AppError> {
    let configs = AdminConfigRepository::get_all(&pool).await?;
    Ok(ApiResponse::success(configs))
}

/// PATCH /admin/config
pub async fn update_config(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    redis: web::Data<RedisService>,
    ws_manager: web::Data<WsManager>,
    body: web::Json<UpdateConfigRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let configs = AdminConfigRepository::batch_update(&pool, &body.configs, &user.email).await?;

    // Update Redis cache and notify all connected users
    for config in &configs {
        let _ = redis.set_config(&config.key, &config.value.to_string()).await;

        // Broadcast config update via WebSocket
        ws_manager.broadcast(WsServerMessage::ConfigUpdated {
            key: config.key.clone(),
            value: config.value.clone(),
        });
    }

    Ok(ApiResponse::success(configs))
}

/// GET /admin/analytics
pub async fn get_analytics(pool: web::Data<PgPool>, ws_manager: web::Data<WsManager>) -> Result<HttpResponse, AppError> {
    let total_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool.as_ref())
        .await?;

    let active_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE is_active = TRUE")
        .fetch_one(pool.as_ref())
        .await?;

    let pro_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE role = 'pro'")
        .fetch_one(pool.as_ref())
        .await?;

    let total_generations: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM outfit_generations")
        .fetch_one(pool.as_ref())
        .await?;

    let total_revenue: Option<(Option<i64>,)> = sqlx::query_as(
        "SELECT SUM(amount_inr) FROM payments WHERE status = 'captured'"
    )
    .fetch_optional(pool.as_ref())
    .await?;

    let active_subscriptions: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"
    )
    .fetch_one(pool.as_ref())
    .await?;

    Ok(ApiResponse::success(serde_json::json!({
        "total_users": total_users.0,
        "active_users": active_users.0,
        "pro_users": pro_users.0,
        "total_generations": total_generations.0,
        "total_revenue_inr": total_revenue.and_then(|r| r.0).unwrap_or(0),
        "active_subscriptions": active_subscriptions.0,
        "ws_connections": ws_manager.connection_count(),
    })))
}

/// GET /admin/subscriptions
pub async fn list_subscriptions(
    pool: web::Data<PgPool>,
    query: web::Query<crate::db::models::wardrobe::PaginationParams>,
) -> Result<HttpResponse, AppError> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    let (subs, total) = SubscriptionRepository::list_all(&pool, page, per_page).await?;

    Ok(ApiResponse::success(serde_json::json!({
        "subscriptions": subs,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
        }
    })))
}
