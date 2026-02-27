// ─── Test Common Utilities ──────────────────────────────────────────────────
// Shared test helpers, fixtures, and mock factories for all test modules.

use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

/// Build a test AppConfig with sensible defaults (no external services needed).
pub fn test_config() -> Arc<dressly_backend::config::AppConfig> {
    Arc::new(dressly_backend::config::AppConfig {
        server: dressly_backend::config::ServerConfig {
            host: "127.0.0.1".to_string(),
            port: 0,
            workers: 1,
        },
        database: dressly_backend::config::DatabaseConfig {
            url: "postgres://test:test@localhost:5432/dressly_test".to_string(),
            max_connections: 5,
            min_connections: 1,
        },
        redis: dressly_backend::config::RedisConfig {
            url: "redis://localhost:6379/15".to_string(),
            max_connections: 5,
        },
        jwt: dressly_backend::config::JwtConfig {
            secret: "super-secret-test-key-that-is-long-enough-for-hmac-256-bits!!".to_string(),
            access_token_expiry: 900,
            refresh_token_expiry: 604800,
        },
        gemini: dressly_backend::config::GeminiConfig {
            api_key: "test-gemini-key".to_string(),
            model: "gemini-2.0-flash".to_string(),
            api_url: "https://generativelanguage.googleapis.com/v1beta".to_string(),
        },
        razorpay: dressly_backend::config::RazorpayConfig {
            key_id: "rzp_test_key123".to_string(),
            key_secret: "rzp_test_secret456".to_string(),
            webhook_secret: "webhook_secret_789".to_string(),
        },
        fcm: dressly_backend::config::FcmConfig {
            server_key: "test-fcm-server-key".to_string(),
            project_id: "test-project".to_string(),
        },
        storage: dressly_backend::config::StorageConfig {
            endpoint: "http://localhost:9000".to_string(),
            access_key: "minioadmin".to_string(),
            secret_key: "minioadmin".to_string(),
            bucket: "dressly-test".to_string(),
            public_url: "http://localhost:9000/dressly-test".to_string(),
        },
        app: dressly_backend::config::AppSettings {
            free_daily_ai_quota: 5,
            pro_price_inr: 499,
            max_upload_size_mb: 10,
            max_images_per_generation: 5,
        },
        rate_limit: dressly_backend::config::RateLimitConfig {
            per_minute: 60,
            burst: 10,
        },
        websocket: dressly_backend::config::WebSocketConfig {
            heartbeat_interval: 10,
            client_timeout: 30,
            max_message_size: 65536,
        },
    })
}

/// Create a mock UserWithProfile for testing.
pub fn mock_user(role: &str) -> dressly_backend::db::models::user::UserWithProfile {
    use dressly_backend::db::models::user::*;
    UserWithProfile {
        id: Uuid::new_v4(),
        email: format!("test_{}@dressly.com", Uuid::new_v4().to_string().split('-').next().unwrap()),
        role: match role {
            "admin" => UserRole::Admin,
            "pro" => UserRole::Pro,
            _ => UserRole::User,
        },
        is_verified: true,
        is_active: true,
        display_name: Some("Test User".to_string()),
        avatar_url: None,
        gender: None,
        body_type: None,
        style_preferences: None,
        color_preferences: None,
        created_at: Utc::now(),
    }
}

/// Create a mock UserWithProfile with a specific ID.
pub fn mock_user_with_id(id: Uuid, role: &str) -> dressly_backend::db::models::user::UserWithProfile {
    let mut user = mock_user(role);
    user.id = id;
    user
}

/// Generate a random email.
pub fn random_email() -> String {
    format!("user_{}@dressly.com", Uuid::new_v4().to_string().split('-').next().unwrap())
}

/// Generate a valid password for tests.
pub fn valid_password() -> String {
    "StrongP@ss1234!".to_string()
}

/// Generate a weak password for negative tests.
pub fn weak_password() -> String {
    "weak".to_string()
}
