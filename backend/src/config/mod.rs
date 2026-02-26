use serde::Deserialize;
use std::sync::Arc;

/// Application configuration loaded from environment variables and config files.
/// Uses a hierarchical configuration system: defaults → config file → env vars.
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub gemini: GeminiConfig,
    pub razorpay: RazorpayConfig,
    pub fcm: FcmConfig,
    pub storage: StorageConfig,
    pub app: AppSettings,
    pub rate_limit: RateLimitConfig,
    pub websocket: WebSocketConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
    pub max_connections: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_expiry: i64,
    pub refresh_token_expiry: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GeminiConfig {
    pub api_key: String,
    pub model: String,
    pub api_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RazorpayConfig {
    pub key_id: String,
    pub key_secret: String,
    pub webhook_secret: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct FcmConfig {
    pub server_key: String,
    pub project_id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StorageConfig {
    pub endpoint: String,
    pub access_key: String,
    pub secret_key: String,
    pub bucket: String,
    pub public_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AppSettings {
    pub free_daily_ai_quota: i32,
    pub pro_price_inr: i64,
    pub max_upload_size_mb: usize,
    pub max_images_per_generation: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RateLimitConfig {
    pub per_minute: u32,
    pub burst: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WebSocketConfig {
    pub heartbeat_interval: u64,
    pub client_timeout: u64,
    pub max_message_size: usize,
}

impl AppConfig {
    /// Load configuration from environment variables.
    /// Priority: ENV vars > .env file > defaults
    pub fn load() -> Result<Arc<Self>, config::ConfigError> {
        dotenvy::dotenv().ok();

        let config = Self {
            server: ServerConfig {
                host: std::env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".into()),
                port: std::env::var("SERVER_PORT")
                    .unwrap_or_else(|_| "8080".into())
                    .parse()
                    .unwrap_or(8080),
                workers: std::env::var("SERVER_WORKERS")
                    .unwrap_or_else(|_| "4".into())
                    .parse()
                    .unwrap_or(4),
            },
            database: DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set"),
                max_connections: std::env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "100".into())
                    .parse()
                    .unwrap_or(100),
                min_connections: std::env::var("DATABASE_MIN_CONNECTIONS")
                    .unwrap_or_else(|_| "5".into())
                    .parse()
                    .unwrap_or(5),
            },
            redis: RedisConfig {
                url: std::env::var("REDIS_URL")
                    .unwrap_or_else(|_| "redis://localhost:6379".into()),
                max_connections: std::env::var("REDIS_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "50".into())
                    .parse()
                    .unwrap_or(50),
            },
            jwt: JwtConfig {
                secret: std::env::var("JWT_SECRET")
                    .expect("JWT_SECRET must be set"),
                access_token_expiry: std::env::var("JWT_ACCESS_TOKEN_EXPIRY")
                    .unwrap_or_else(|_| "900".into())
                    .parse()
                    .unwrap_or(900),
                refresh_token_expiry: std::env::var("JWT_REFRESH_TOKEN_EXPIRY")
                    .unwrap_or_else(|_| "604800".into())
                    .parse()
                    .unwrap_or(604800),
            },
            gemini: GeminiConfig {
                api_key: std::env::var("GEMINI_API_KEY")
                    .unwrap_or_default(),
                model: std::env::var("GEMINI_MODEL")
                    .unwrap_or_else(|_| "gemini-2.0-flash".into()),
                api_url: std::env::var("GEMINI_API_URL")
                    .unwrap_or_else(|_| "https://generativelanguage.googleapis.com/v1beta".into()),
            },
            razorpay: RazorpayConfig {
                key_id: std::env::var("RAZORPAY_KEY_ID").unwrap_or_default(),
                key_secret: std::env::var("RAZORPAY_KEY_SECRET").unwrap_or_default(),
                webhook_secret: std::env::var("RAZORPAY_WEBHOOK_SECRET").unwrap_or_default(),
            },
            fcm: FcmConfig {
                server_key: std::env::var("FCM_SERVER_KEY").unwrap_or_default(),
                project_id: std::env::var("FCM_PROJECT_ID").unwrap_or_default(),
            },
            storage: StorageConfig {
                endpoint: std::env::var("STORAGE_ENDPOINT").unwrap_or_default(),
                access_key: std::env::var("STORAGE_ACCESS_KEY").unwrap_or_default(),
                secret_key: std::env::var("STORAGE_SECRET_KEY").unwrap_or_default(),
                bucket: std::env::var("STORAGE_BUCKET")
                    .unwrap_or_else(|_| "dressly-media".into()),
                public_url: std::env::var("STORAGE_PUBLIC_URL")
                    .unwrap_or_else(|_| "https://media.dressly.app".into()),
            },
            app: AppSettings {
                free_daily_ai_quota: std::env::var("FREE_DAILY_AI_QUOTA")
                    .unwrap_or_else(|_| "5".into())
                    .parse()
                    .unwrap_or(5),
                pro_price_inr: std::env::var("PRO_PRICE_INR")
                    .unwrap_or_else(|_| "299".into())
                    .parse()
                    .unwrap_or(299),
                max_upload_size_mb: std::env::var("MAX_UPLOAD_SIZE_MB")
                    .unwrap_or_else(|_| "10".into())
                    .parse()
                    .unwrap_or(10),
                max_images_per_generation: std::env::var("MAX_IMAGES_PER_GENERATION")
                    .unwrap_or_else(|_| "4".into())
                    .parse()
                    .unwrap_or(4),
            },
            rate_limit: RateLimitConfig {
                per_minute: std::env::var("RATE_LIMIT_PER_MINUTE")
                    .unwrap_or_else(|_| "100".into())
                    .parse()
                    .unwrap_or(100),
                burst: std::env::var("RATE_LIMIT_BURST")
                    .unwrap_or_else(|_| "20".into())
                    .parse()
                    .unwrap_or(20),
            },
            websocket: WebSocketConfig {
                heartbeat_interval: std::env::var("WS_HEARTBEAT_INTERVAL")
                    .unwrap_or_else(|_| "10".into())
                    .parse()
                    .unwrap_or(10),
                client_timeout: std::env::var("WS_CLIENT_TIMEOUT")
                    .unwrap_or_else(|_| "30".into())
                    .parse()
                    .unwrap_or(30),
                max_message_size: std::env::var("WS_MAX_MESSAGE_SIZE")
                    .unwrap_or_else(|_| "65536".into())
                    .parse()
                    .unwrap_or(65536),
            },
        };

        Ok(Arc::new(config))
    }
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "0.0.0.0".into(),
            port: 8080,
            workers: 4,
        }
    }
}
