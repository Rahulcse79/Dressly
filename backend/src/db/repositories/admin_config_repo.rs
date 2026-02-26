use sqlx::PgPool;
use crate::db::models::admin_config::*;
use crate::errors::AppResult;

/// Repository for admin config operations.
pub struct AdminConfigRepository;

impl AdminConfigRepository {
    /// Get all config entries.
    pub async fn get_all(pool: &PgPool) -> AppResult<Vec<AdminConfig>> {
        let configs = sqlx::query_as::<_, AdminConfig>(
            "SELECT * FROM admin_config ORDER BY key"
        )
        .fetch_all(pool)
        .await?;

        Ok(configs)
    }

    /// Get a single config value by key.
    pub async fn get_by_key(pool: &PgPool, key: &str) -> AppResult<Option<AdminConfig>> {
        let config = sqlx::query_as::<_, AdminConfig>(
            "SELECT * FROM admin_config WHERE key = $1"
        )
        .bind(key)
        .fetch_optional(pool)
        .await?;

        Ok(config)
    }

    /// Upsert a config entry.
    pub async fn upsert(
        pool: &PgPool,
        key: &str,
        value: &serde_json::Value,
        updated_by: &str,
    ) -> AppResult<AdminConfig> {
        let config = sqlx::query_as::<_, AdminConfig>(
            r#"
            INSERT INTO admin_config (key, value, updated_by)
            VALUES ($1, $2, $3)
            ON CONFLICT (key) DO UPDATE SET
                value = $2,
                updated_at = NOW(),
                updated_by = $3
            RETURNING *
            "#,
        )
        .bind(key)
        .bind(value)
        .bind(updated_by)
        .fetch_one(pool)
        .await?;

        Ok(config)
    }

    /// Batch update configs.
    pub async fn batch_update(
        pool: &PgPool,
        entries: &[ConfigEntry],
        updated_by: &str,
    ) -> AppResult<Vec<AdminConfig>> {
        let mut tx = pool.begin().await?;
        let mut results = Vec::new();

        for entry in entries {
            let config = sqlx::query_as::<_, AdminConfig>(
                r#"
                INSERT INTO admin_config (key, value, updated_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO UPDATE SET
                    value = $2,
                    updated_at = NOW(),
                    updated_by = $3
                RETURNING *
                "#,
            )
            .bind(&entry.key)
            .bind(&entry.value)
            .bind(updated_by)
            .fetch_one(&mut *tx)
            .await?;

            results.push(config);
        }

        tx.commit().await?;
        Ok(results)
    }

    /// Get pro price from config.
    pub async fn get_pro_price(pool: &PgPool) -> AppResult<i64> {
        let config = Self::get_by_key(pool, CONFIG_PRO_PRICE_INR).await?;
        match config {
            Some(c) => {
                let price: i64 = serde_json::from_value(c.value).unwrap_or(299);
                Ok(price)
            }
            None => Ok(299),
        }
    }

    /// Get free daily AI quota from config.
    pub async fn get_free_quota(pool: &PgPool) -> AppResult<i32> {
        let config = Self::get_by_key(pool, CONFIG_FREE_DAILY_QUOTA).await?;
        match config {
            Some(c) => {
                let quota: i32 = serde_json::from_value(c.value).unwrap_or(5);
                Ok(quota)
            }
            None => Ok(5),
        }
    }
}
