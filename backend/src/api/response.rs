use serde::Serialize;
use actix_web::HttpResponse;

/// Standard API response wrapper.
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    /// Create a success response with data.
    pub fn success(data: T) -> HttpResponse {
        HttpResponse::Ok().json(Self {
            success: true,
            data: Some(data),
            message: None,
        })
    }

    /// Create a success response with message.
    pub fn success_with_message(data: T, message: &str) -> HttpResponse {
        HttpResponse::Ok().json(Self {
            success: true,
            data: Some(data),
            message: Some(message.to_string()),
        })
    }

    /// Create a created response (201).
    pub fn created(data: T) -> HttpResponse {
        HttpResponse::Created().json(Self {
            success: true,
            data: Some(data),
            message: None,
        })
    }
}

/// No-data response helper.
pub fn ok_message(message: &str) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": message
    }))
}

/// No content response (204).
pub fn no_content() -> HttpResponse {
    HttpResponse::NoContent().finish()
}
