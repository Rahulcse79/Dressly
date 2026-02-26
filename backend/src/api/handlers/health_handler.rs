use actix_web::{HttpResponse, web};
use sqlx::PgPool;

use crate::api::response::ApiResponse;
use crate::services::websocket::WsManager;

/// GET /health
pub async fn health_check(
    pool: web::Data<PgPool>,
    ws_manager: web::Data<WsManager>,
) -> HttpResponse {
    // Check database connection
    let db_ok = sqlx::query("SELECT 1")
        .execute(pool.as_ref())
        .await
        .is_ok();

    let status = if db_ok { "healthy" } else { "degraded" };

    ApiResponse::success(serde_json::json!({
        "status": status,
        "version": env!("CARGO_PKG_VERSION"),
        "database": if db_ok { "connected" } else { "disconnected" },
        "ws_connections": ws_manager.connection_count(),
        "timestamp": chrono::Utc::now().to_rfc3339(),
    }))
}

/// GET /health/ready
pub async fn readiness_check(pool: web::Data<PgPool>) -> HttpResponse {
    match sqlx::query("SELECT 1").execute(pool.as_ref()).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ready": true })),
        Err(_) => HttpResponse::ServiceUnavailable().json(serde_json::json!({ "ready": false })),
    }
}
