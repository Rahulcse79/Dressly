use thiserror::Error;
use actix_web::{HttpResponse, ResponseError};
use serde::Serialize;

/// Centralized error types for the Dressly application.
/// Each variant maps to a specific HTTP status code and error response.
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    Unauthorized(String),

    #[error("Access forbidden: {0}")]
    Forbidden(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Payload too large: {0}")]
    PayloadTooLarge(String),

    #[error("External service error: {0}")]
    ExternalServiceError(String),

    #[error("AI service error: {0}")]
    AiServiceError(String),

    #[error("Payment error: {0}")]
    PaymentError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Redis error: {0}")]
    CacheError(String),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("Internal server error: {0}")]
    InternalError(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
}

/// Standard error response body sent to clients.
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub success: bool,
    pub error: ErrorDetail,
}

#[derive(Debug, Serialize)]
pub struct ErrorDetail {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status, code) = match self {
            AppError::Unauthorized(_) => (actix_web::http::StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            AppError::Forbidden(_) => (actix_web::http::StatusCode::FORBIDDEN, "FORBIDDEN"),
            AppError::NotFound(_) => (actix_web::http::StatusCode::NOT_FOUND, "NOT_FOUND"),
            AppError::ValidationError(_) => (actix_web::http::StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR"),
            AppError::Conflict(_) => (actix_web::http::StatusCode::CONFLICT, "CONFLICT"),
            AppError::RateLimitExceeded => (actix_web::http::StatusCode::TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED"),
            AppError::PayloadTooLarge(_) => (actix_web::http::StatusCode::PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE"),
            AppError::ExternalServiceError(_) => (actix_web::http::StatusCode::BAD_GATEWAY, "EXTERNAL_SERVICE_ERROR"),
            AppError::AiServiceError(_) => (actix_web::http::StatusCode::BAD_GATEWAY, "AI_SERVICE_ERROR"),
            AppError::PaymentError(_) => (actix_web::http::StatusCode::BAD_GATEWAY, "PAYMENT_ERROR"),
            AppError::DatabaseError(_) => (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR"),
            AppError::CacheError(_) => (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "CACHE_ERROR"),
            AppError::WebSocketError(_) => (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "WEBSOCKET_ERROR"),
            AppError::InternalError(_) => (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
            AppError::BadRequest(_) => (actix_web::http::StatusCode::BAD_REQUEST, "BAD_REQUEST"),
            AppError::ServiceUnavailable(_) => (actix_web::http::StatusCode::SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE"),
        };

        let response = ErrorResponse {
            success: false,
            error: ErrorDetail {
                code: code.to_string(),
                message: self.to_string(),
                details: None,
            },
        };

        HttpResponse::build(status).json(response)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {:?}", err);
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Record not found".into()),
            sqlx::Error::Database(db_err) => {
                if let Some(code) = db_err.code() {
                    if code == "23505" {
                        return AppError::Conflict("Record already exists".into());
                    }
                }
                AppError::DatabaseError(db_err.to_string())
            }
            _ => AppError::DatabaseError(err.to_string()),
        }
    }
}

impl From<redis::RedisError> for AppError {
    fn from(err: redis::RedisError) -> Self {
        tracing::error!("Redis error: {:?}", err);
        AppError::CacheError(err.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::Unauthorized(format!("Invalid token: {}", err))
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        tracing::error!("HTTP client error: {:?}", err);
        AppError::ExternalServiceError(err.to_string())
    }
}

impl From<validator::ValidationErrors> for AppError {
    fn from(err: validator::ValidationErrors) -> Self {
        AppError::ValidationError(err.to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalError(err.to_string())
    }
}

/// Result type alias for Dressly operations.
pub type AppResult<T> = Result<T, AppError>;
