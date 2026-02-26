use actix_web::{web, HttpRequest, HttpResponse};

use crate::errors::AppError;
use crate::services::auth::AuthService;
use crate::services::websocket::{WsManager, handle_ws_connection};
use crate::config::AppConfig;

/// WebSocket upgrade handler.
/// GET /ws?token={jwt_access_token}
pub async fn ws_connect(
    req: HttpRequest,
    stream: web::Payload,
    ws_manager: web::Data<WsManager>,
    auth_service: web::Data<AuthService>,
    config: web::Data<AppConfig>,
    query: web::Query<WsQuery>,
) -> Result<HttpResponse, AppError> {
    // Authenticate via query parameter token
    let claims = auth_service.validate_access_token(&query.token)
        .map_err(|_| AppError::Unauthorized("Invalid WebSocket authentication token".into()))?;

    let user_id = AuthService::extract_user_id(&claims)?;

    // Upgrade to WebSocket
    let (response, session, msg_stream) = actix_ws::handle(&req, stream)
        .map_err(|e| AppError::WebSocketError(format!("WebSocket upgrade failed: {}", e)))?;

    // Spawn WebSocket handler
    actix_rt::spawn(handle_ws_connection(
        session,
        msg_stream,
        user_id,
        ws_manager,
        config,
    ));

    Ok(response)
}

#[derive(Debug, serde::Deserialize)]
pub struct WsQuery {
    pub token: String,
}
