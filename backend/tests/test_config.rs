// ─── Config Tests ───────────────────────────────────────────────────────────
// Tests for AppConfig defaults, validation, edge cases.

mod common;

#[cfg(test)]
mod config_tests {
    use super::common;
    use dressly_backend::config::*;

    #[test]
    fn test_config_server_defaults() {
        let config = common::test_config();
        assert_eq!(config.server.host, "127.0.0.1");
        assert_eq!(config.server.workers, 1);
    }

    #[test]
    fn test_config_jwt_defaults() {
        let config = common::test_config();
        assert_eq!(config.jwt.access_token_expiry, 900);
        assert_eq!(config.jwt.refresh_token_expiry, 604800);
    }

    #[test]
    fn test_config_jwt_secret_not_empty() {
        let config = common::test_config();
        assert!(!config.jwt.secret.is_empty());
    }

    #[test]
    fn test_config_database_pool_sizes() {
        let config = common::test_config();
        assert!(config.database.max_connections >= config.database.min_connections);
    }

    #[test]
    fn test_config_redis_url_format() {
        let config = common::test_config();
        assert!(config.redis.url.starts_with("redis://"));
    }

    #[test]
    fn test_config_gemini_model() {
        let config = common::test_config();
        assert_eq!(config.gemini.model, "gemini-2.0-flash");
    }

    #[test]
    fn test_config_app_settings() {
        let config = common::test_config();
        assert_eq!(config.app.free_daily_ai_quota, 5);
        assert_eq!(config.app.pro_price_inr, 499);
        assert_eq!(config.app.max_upload_size_mb, 10);
        assert_eq!(config.app.max_images_per_generation, 5);
    }

    #[test]
    fn test_config_rate_limit() {
        let config = common::test_config();
        assert_eq!(config.rate_limit.per_minute, 60);
        assert_eq!(config.rate_limit.burst, 10);
    }

    #[test]
    fn test_config_websocket() {
        let config = common::test_config();
        assert_eq!(config.websocket.heartbeat_interval, 10);
        assert_eq!(config.websocket.client_timeout, 30);
        assert_eq!(config.websocket.max_message_size, 65536);
    }

    #[test]
    fn test_config_razorpay() {
        let config = common::test_config();
        assert!(!config.razorpay.key_id.is_empty());
        assert!(!config.razorpay.key_secret.is_empty());
        assert!(!config.razorpay.webhook_secret.is_empty());
    }

    #[test]
    fn test_config_fcm() {
        let config = common::test_config();
        assert!(!config.fcm.server_key.is_empty());
        assert!(!config.fcm.project_id.is_empty());
    }

    #[test]
    fn test_config_storage() {
        let config = common::test_config();
        assert!(config.storage.endpoint.starts_with("http"));
        assert!(!config.storage.bucket.is_empty());
    }

    #[test]
    fn test_config_clone() {
        let config = common::test_config();
        let cloned = (*config).clone();
        assert_eq!(cloned.server.host, config.server.host);
        assert_eq!(cloned.jwt.secret, config.jwt.secret);
    }

    #[test]
    fn test_config_debug_output() {
        let config = common::test_config();
        let debug = format!("{:?}", *config);
        assert!(debug.contains("AppConfig"));
        assert!(debug.contains("ServerConfig"));
    }

    // ── Sub-Config Struct Tests ─────────────────────────────────

    #[test]
    fn test_server_config_clone() {
        let cfg = ServerConfig {
            host: "0.0.0.0".to_string(),
            port: 8080,
            workers: 4,
        };
        let cloned = cfg.clone();
        assert_eq!(cloned.host, "0.0.0.0");
        assert_eq!(cloned.port, 8080);
    }

    #[test]
    fn test_database_config_clone() {
        let cfg = DatabaseConfig {
            url: "postgres://localhost/test".to_string(),
            max_connections: 50,
            min_connections: 5,
        };
        let cloned = cfg.clone();
        assert_eq!(cloned.url, "postgres://localhost/test");
    }

    #[test]
    fn test_jwt_config_clone() {
        let cfg = JwtConfig {
            secret: "secret".to_string(),
            access_token_expiry: 900,
            refresh_token_expiry: 604800,
        };
        let cloned = cfg.clone();
        assert_eq!(cloned.secret, "secret");
    }

    #[test]
    fn test_websocket_config_heartbeat_less_than_timeout() {
        let config = common::test_config();
        assert!(
            config.websocket.heartbeat_interval < config.websocket.client_timeout,
            "Heartbeat should be less than timeout"
        );
    }
}
