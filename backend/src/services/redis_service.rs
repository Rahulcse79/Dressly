use deadpool_redis::{Config as RedisConfig, Pool, Runtime, Connection};
use redis::AsyncCommands;
use std::sync::Arc;
use uuid::Uuid;
use crate::config::AppConfig;
use crate::errors::{AppError, AppResult};
use tracing::{info, error};

/// Redis service for caching, sessions, rate limiting, and pub/sub.
pub struct RedisService {
    pool: Pool,
}

impl RedisService {
    /// Initialize Redis connection pool.
    pub fn new(config: &Arc<AppConfig>) -> AppResult<Self> {
        let cfg = RedisConfig::from_url(&config.redis.url);
        let pool = cfg
            .create_pool(Some(Runtime::Tokio1))
            .map_err(|e| AppError::CacheError(format!("Failed to create Redis pool: {}", e)))?;

        info!("✅ Redis connection pool initialized");
        Ok(Self { pool })
    }

    /// Get a connection from the pool.
    pub async fn get_conn(&self) -> AppResult<Connection> {
        self.pool
            .get()
            .await
            .map_err(|e| AppError::CacheError(format!("Redis connection error: {}", e)))
    }

    // ── Session Management ──────────────────────────────────────────

    /// Store a user session in Redis.
    pub async fn store_session(
        &self,
        user_id: &Uuid,
        token_jti: &str,
        ttl_seconds: i64,
    ) -> AppResult<()> {
        let mut conn = self.get_conn().await?;
        let key = format!("session:{}:{}", user_id, token_jti);
        let _: () = redis::cmd("SETEX")
            .arg(&key)
            .arg(ttl_seconds)
            .arg("1")
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(())
    }

    /// Check if a session is valid.
    pub async fn is_session_valid(&self, user_id: &Uuid, token_jti: &str) -> AppResult<bool> {
        let mut conn = self.get_conn().await?;
        let key = format!("session:{}:{}", user_id, token_jti);
        let exists: bool = conn.exists(&key).await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(exists)
    }

    /// Invalidate a specific session.
    pub async fn invalidate_session(&self, user_id: &Uuid, token_jti: &str) -> AppResult<()> {
        let mut conn = self.get_conn().await?;
        let key = format!("session:{}:{}", user_id, token_jti);
        let _: () = conn.del(&key).await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(())
    }

    /// Invalidate all sessions for a user.
    pub async fn invalidate_all_sessions(&self, user_id: &Uuid) -> AppResult<()> {
        let mut conn = self.get_conn().await?;
        let pattern = format!("session:{}:*", user_id);
        let keys: Vec<String> = redis::cmd("KEYS")
            .arg(&pattern)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;

        if !keys.is_empty() {
            let _: () = conn.del(keys).await
                .map_err(|e| AppError::CacheError(e.to_string()))?;
        }
        Ok(())
    }

    // ── Caching ─────────────────────────────────────────────────────

    /// Cache user data.
    pub async fn cache_user(&self, user_id: &Uuid, data: &str) -> AppResult<()> {
        let mut conn = self.get_conn().await?;
        let key = format!("cache:user:{}", user_id);
        let _: () = redis::cmd("SETEX")
            .arg(&key)
            .arg(900) // 15 minutes TTL
            .arg(data)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(())
    }

    /// Get cached user data.
    pub async fn get_cached_user(&self, user_id: &Uuid) -> AppResult<Option<String>> {
        let mut conn = self.get_conn().await?;
        let key = format!("cache:user:{}", user_id);
        let data: Option<String> = conn.get(&key).await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(data)
    }

    /// Invalidate user cache.
    pub async fn invalidate_user_cache(&self, user_id: &Uuid) -> AppResult<()> {
        let mut conn = self.get_conn().await?;
        let key = format!("cache:user:{}", user_id);
        let _: () = conn.del(&key).await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(())
    }

    // ── Rate Limiting (Sliding Window) ──────────────────────────────

    /// Check and increment rate limit. Returns (allowed, remaining).
    pub async fn check_rate_limit(
        &self,
        key: &str,
        max_requests: u32,
        window_seconds: u64,
    ) -> AppResult<(bool, u32)> {
        let mut conn = self.get_conn().await?;
        let now = chrono::Utc::now().timestamp() as f64;
        let window_start = now - window_seconds as f64;

        let full_key = format!("ratelimit:{}", key);

        // Remove old entries outside the window
        let _: () = redis::cmd("ZREMRANGEBYSCORE")
            .arg(&full_key)
            .arg("-inf")
            .arg(window_start)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;

        // Count current entries
        let count: u32 = redis::cmd("ZCARD")
            .arg(&full_key)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;

        if count >= max_requests {
            return Ok((false, 0));
        }

        // Add new entry
        let member = format!("{}:{}", now, uuid::Uuid::new_v4());
        let _: () = redis::cmd("ZADD")
            .arg(&full_key)
            .arg(now)
            .arg(&member)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;

        // Set TTL on the key
        let _: () = redis::cmd("EXPIRE")
            .arg(&full_key)
            .arg(window_seconds)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;

        Ok((true, max_requests - count - 1))
    }

    // ── Config Cache ────────────────────────────────────────────────

    /// Cache a config value.
    pub async fn set_config(&self, key: &str, value: &str) -> AppResult<()> {
        let mut conn = self.get_conn().await?;
        let redis_key = format!("config:{}", key);
        let _: () = conn.set(&redis_key, value).await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(())
    }

    /// Get a cached config value.
    pub async fn get_config(&self, key: &str) -> AppResult<Option<String>> {
        let mut conn = self.get_conn().await?;
        let redis_key = format!("config:{}", key);
        let value: Option<String> = conn.get(&redis_key).await
            .map_err(|e| AppError::CacheError(e.to_string()))?;
        Ok(value)
    }

    // ── AI Generation Queue ─────────────────────────────────────────

    /// Add AI generation task to Redis Stream.
    pub async fn enqueue_ai_task(
        &self,
        generation_id: &Uuid,
        user_id: &Uuid,
        is_pro: bool,
    ) -> AppResult<String> {
        let mut conn = self.get_conn().await?;

        let stream_id: String = redis::cmd("XADD")
            .arg("stream:ai_tasks")
            .arg("*")
            .arg("generation_id")
            .arg(generation_id.to_string())
            .arg("user_id")
            .arg(user_id.to_string())
            .arg("priority")
            .arg(if is_pro { "high" } else { "normal" })
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::CacheError(e.to_string()))?;

        Ok(stream_id)
    }
}
