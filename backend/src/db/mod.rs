pub mod models;
pub mod repositories;
pub mod migrations;

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::sync::Arc;
use crate::config::AppConfig;

/// Initialize PostgreSQL connection pool with optimized settings.
pub async fn init_db_pool(config: &Arc<AppConfig>) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .min_connections(config.database.min_connections)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .idle_timeout(std::time::Duration::from_secs(300))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .connect(&config.database.url)
        .await?;

    tracing::info!(
        "✅ PostgreSQL pool initialized (max={}, min={})",
        config.database.max_connections,
        config.database.min_connections
    );

    Ok(pool)
}

/// Run database migrations.
pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    tracing::info!("🔄 Running database migrations...");
    sqlx::migrate!("./src/db/migrations")
        .run(pool)
        .await?;
    tracing::info!("✅ Migrations completed successfully");
    Ok(())
}
