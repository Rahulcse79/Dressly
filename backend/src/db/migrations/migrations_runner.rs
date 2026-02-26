/// Placeholder for migration runner utility.
/// Actual migrations are handled by SQLx CLI.
/// Run: `sqlx migrate run` to apply migrations.
pub fn migration_info() -> &'static str {
    "Run `sqlx migrate run` to apply pending migrations"
}
