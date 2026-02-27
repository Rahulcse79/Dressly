// ─── Error Handling & Response Tests ────────────────────────────────────────
// Tests for AppError variants, HTTP status mapping, From impls, response format.

#[cfg(test)]
mod error_tests {
    use dressly_backend::errors::*;
    use actix_web::ResponseError;
    use actix_web::http::StatusCode;

    // ── Error Display Messages ──────────────────────────────────

    #[test]
    fn test_unauthorized_display() {
        let err = AppError::Unauthorized("bad creds".into());
        assert_eq!(err.to_string(), "Authentication failed: bad creds");
    }

    #[test]
    fn test_forbidden_display() {
        let err = AppError::Forbidden("no access".into());
        assert_eq!(err.to_string(), "Access forbidden: no access");
    }

    #[test]
    fn test_not_found_display() {
        let err = AppError::NotFound("user".into());
        assert_eq!(err.to_string(), "Resource not found: user");
    }

    #[test]
    fn test_validation_error_display() {
        let err = AppError::ValidationError("email invalid".into());
        assert_eq!(err.to_string(), "Validation error: email invalid");
    }

    #[test]
    fn test_conflict_display() {
        let err = AppError::Conflict("user exists".into());
        assert_eq!(err.to_string(), "Conflict: user exists");
    }

    #[test]
    fn test_rate_limit_display() {
        let err = AppError::RateLimitExceeded;
        assert_eq!(err.to_string(), "Rate limit exceeded");
    }

    #[test]
    fn test_payload_too_large_display() {
        let err = AppError::PayloadTooLarge("10MB max".into());
        assert_eq!(err.to_string(), "Payload too large: 10MB max");
    }

    #[test]
    fn test_external_service_display() {
        let err = AppError::ExternalServiceError("timeout".into());
        assert_eq!(err.to_string(), "External service error: timeout");
    }

    #[test]
    fn test_ai_service_display() {
        let err = AppError::AiServiceError("model busy".into());
        assert_eq!(err.to_string(), "AI service error: model busy");
    }

    #[test]
    fn test_payment_error_display() {
        let err = AppError::PaymentError("declined".into());
        assert_eq!(err.to_string(), "Payment error: declined");
    }

    #[test]
    fn test_database_error_display() {
        let err = AppError::DatabaseError("connection lost".into());
        assert_eq!(err.to_string(), "Database error: connection lost");
    }

    #[test]
    fn test_cache_error_display() {
        let err = AppError::CacheError("redis down".into());
        assert_eq!(err.to_string(), "Redis error: redis down");
    }

    #[test]
    fn test_websocket_error_display() {
        let err = AppError::WebSocketError("closed".into());
        assert_eq!(err.to_string(), "WebSocket error: closed");
    }

    #[test]
    fn test_internal_error_display() {
        let err = AppError::InternalError("panic".into());
        assert_eq!(err.to_string(), "Internal server error: panic");
    }

    #[test]
    fn test_bad_request_display() {
        let err = AppError::BadRequest("missing field".into());
        assert_eq!(err.to_string(), "Bad request: missing field");
    }

    #[test]
    fn test_service_unavailable_display() {
        let err = AppError::ServiceUnavailable("maintenance".into());
        assert_eq!(err.to_string(), "Service unavailable: maintenance");
    }

    // ── HTTP Status Code Mapping ────────────────────────────────

    #[test]
    fn test_unauthorized_status_code() {
        let err = AppError::Unauthorized("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_forbidden_status_code() {
        let err = AppError::Forbidden("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    }

    #[test]
    fn test_not_found_status_code() {
        let err = AppError::NotFound("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn test_validation_error_status_code() {
        let err = AppError::ValidationError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[test]
    fn test_conflict_status_code() {
        let err = AppError::Conflict("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::CONFLICT);
    }

    #[test]
    fn test_rate_limit_status_code() {
        let err = AppError::RateLimitExceeded;
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[test]
    fn test_payload_too_large_status_code() {
        let err = AppError::PayloadTooLarge("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[test]
    fn test_external_service_status_code() {
        let err = AppError::ExternalServiceError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::BAD_GATEWAY);
    }

    #[test]
    fn test_ai_service_status_code() {
        let err = AppError::AiServiceError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::BAD_GATEWAY);
    }

    #[test]
    fn test_payment_error_status_code() {
        let err = AppError::PaymentError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::BAD_GATEWAY);
    }

    #[test]
    fn test_database_error_status_code() {
        let err = AppError::DatabaseError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn test_cache_error_status_code() {
        let err = AppError::CacheError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn test_websocket_error_status_code() {
        let err = AppError::WebSocketError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn test_internal_error_status_code() {
        let err = AppError::InternalError("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }

    #[test]
    fn test_bad_request_status_code() {
        let err = AppError::BadRequest("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn test_service_unavailable_status_code() {
        let err = AppError::ServiceUnavailable("".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    // ── Error Response Body Format ──────────────────────────────

    #[test]
    fn test_error_response_has_success_false() {
        let resp = ErrorResponse {
            success: false,
            error: ErrorDetail {
                code: "UNAUTHORIZED".to_string(),
                message: "test".to_string(),
                details: None,
            },
        };
        assert!(!resp.success);
    }

    #[test]
    fn test_error_detail_serialization() {
        let detail = ErrorDetail {
            code: "NOT_FOUND".to_string(),
            message: "User not found".to_string(),
            details: None,
        };
        let json = serde_json::to_value(&detail).unwrap();
        assert_eq!(json["code"], "NOT_FOUND");
        assert_eq!(json["message"], "User not found");
        assert!(json.get("details").is_none() || json["details"].is_null());
    }

    #[test]
    fn test_error_detail_with_details_field() {
        let detail = ErrorDetail {
            code: "VALIDATION_ERROR".to_string(),
            message: "Invalid input".to_string(),
            details: Some(serde_json::json!({"field": "email", "reason": "invalid format"})),
        };
        let json = serde_json::to_value(&detail).unwrap();
        assert_eq!(json["details"]["field"], "email");
    }

    #[test]
    fn test_error_response_full_serialization() {
        let resp = ErrorResponse {
            success: false,
            error: ErrorDetail {
                code: "BAD_REQUEST".to_string(),
                message: "Missing field".to_string(),
                details: None,
            },
        };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("\"success\":false"));
        assert!(json.contains("\"code\":\"BAD_REQUEST\""));
    }

    // ── From Implementations ────────────────────────────────────

    #[test]
    fn test_from_sqlx_row_not_found() {
        let err: AppError = sqlx::Error::RowNotFound.into();
        match err {
            AppError::NotFound(msg) => assert_eq!(msg, "Record not found"),
            _ => panic!("Expected NotFound"),
        }
    }

    #[test]
    fn test_from_jsonwebtoken_error() {
        let jwt_err = jsonwebtoken::errors::Error::from(
            jsonwebtoken::errors::ErrorKind::InvalidToken,
        );
        let err: AppError = jwt_err.into();
        match err {
            AppError::Unauthorized(msg) => assert!(msg.contains("Invalid token")),
            _ => panic!("Expected Unauthorized"),
        }
    }

    // ── Debug Trait ──────────────────────────────────────────────

    #[test]
    fn test_error_debug_output() {
        let err = AppError::NotFound("test resource".into());
        let debug = format!("{:?}", err);
        assert!(debug.contains("NotFound"));
    }

    // ── Empty Message Variants ──────────────────────────────────

    #[test]
    fn test_all_variants_with_empty_message() {
        let variants: Vec<AppError> = vec![
            AppError::Unauthorized(String::new()),
            AppError::Forbidden(String::new()),
            AppError::NotFound(String::new()),
            AppError::ValidationError(String::new()),
            AppError::Conflict(String::new()),
            AppError::RateLimitExceeded,
            AppError::PayloadTooLarge(String::new()),
            AppError::ExternalServiceError(String::new()),
            AppError::AiServiceError(String::new()),
            AppError::PaymentError(String::new()),
            AppError::DatabaseError(String::new()),
            AppError::CacheError(String::new()),
            AppError::WebSocketError(String::new()),
            AppError::InternalError(String::new()),
            AppError::BadRequest(String::new()),
            AppError::ServiceUnavailable(String::new()),
        ];
        for err in variants {
            let resp = err.error_response();
            assert!(resp.status().as_u16() >= 400);
        }
    }

    // ── Long Error Messages ─────────────────────────────────────

    #[test]
    fn test_error_with_very_long_message() {
        let long_msg = "x".repeat(10_000);
        let err = AppError::InternalError(long_msg.clone());
        assert!(err.to_string().contains(&long_msg));
    }

    #[test]
    fn test_error_with_unicode_message() {
        let err = AppError::NotFound("ユーザー が見つかりません 🔍".into());
        assert!(err.to_string().contains("ユーザー"));
    }

    #[test]
    fn test_error_with_newlines() {
        let err = AppError::BadRequest("field1: invalid\nfield2: missing".into());
        let resp = err.error_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }
}
