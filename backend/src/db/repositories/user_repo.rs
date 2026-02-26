use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::user::*;
use crate::errors::AppResult;

/// Repository for user-related database operations.
/// All queries are compile-time checked by SQLx.
pub struct UserRepository;

impl UserRepository {
    /// Create a new user and their profile in a single transaction.
    pub async fn create_user(
        pool: &PgPool,
        email: &str,
        password_hash: &str,
        display_name: Option<&str>,
    ) -> AppResult<User> {
        let mut tx = pool.begin().await?;

        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email, password_hash, role AS "role: UserRole",
                      is_verified, is_active, created_at, updated_at
            "#,
        )
        .bind(email.to_lowercase().trim())
        .bind(password_hash)
        .fetch_one(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO user_profiles (user_id, display_name)
            VALUES ($1, $2)
            "#,
        )
        .bind(user.id)
        .bind(display_name)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(user)
    }

    /// Find user by email (for login).
    pub async fn find_by_email(pool: &PgPool, email: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, role AS "role: UserRole",
                   is_verified, is_active, created_at, updated_at
            FROM users
            WHERE email = $1 AND is_active = TRUE
            "#,
        )
        .bind(email.to_lowercase().trim())
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Find user by ID.
    pub async fn find_by_id(pool: &PgPool, user_id: Uuid) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, password_hash, role AS "role: UserRole",
                   is_verified, is_active, created_at, updated_at
            FROM users WHERE id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Get user with profile combined.
    pub async fn get_user_with_profile(pool: &PgPool, user_id: Uuid) -> AppResult<Option<UserWithProfile>> {
        let result = sqlx::query_as!(
            UserWithProfile,
            r#"
            SELECT u.id, u.email, u.role AS "role: UserRole",
                   u.is_verified, u.is_active,
                   p.display_name, p.avatar_url, p.gender, p.body_type,
                   p.style_preferences, p.color_preferences,
                   u.created_at
            FROM users u
            LEFT JOIN user_profiles p ON p.user_id = u.id
            WHERE u.id = $1
            "#,
            user_id
        )
        .fetch_optional(pool)
        .await?;

        Ok(result)
    }

    /// Update user profile.
    pub async fn update_profile(
        pool: &PgPool,
        user_id: Uuid,
        req: &UpdateProfileRequest,
    ) -> AppResult<UserProfile> {
        let profile = sqlx::query_as::<_, UserProfile>(
            r#"
            UPDATE user_profiles SET
                display_name = COALESCE($2, display_name),
                gender = COALESCE($3, gender),
                body_type = COALESCE($4, body_type),
                style_preferences = COALESCE($5, style_preferences),
                color_preferences = COALESCE($6, color_preferences)
            WHERE user_id = $1
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(&req.display_name)
        .bind(&req.gender)
        .bind(&req.body_type)
        .bind(&req.style_preferences)
        .bind(&req.color_preferences)
        .fetch_one(pool)
        .await?;

        Ok(profile)
    }

    /// Update user role (admin operation).
    pub async fn update_role(pool: &PgPool, user_id: Uuid, role: &UserRole) -> AppResult<()> {
        sqlx::query("UPDATE users SET role = $2 WHERE id = $1")
            .bind(user_id)
            .bind(role)
            .execute(pool)
            .await?;
        Ok(())
    }

    /// Set user verified status.
    pub async fn set_verified(pool: &PgPool, user_id: Uuid) -> AppResult<()> {
        sqlx::query("UPDATE users SET is_verified = TRUE WHERE id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    /// Soft delete user (set is_active = false).
    pub async fn soft_delete(pool: &PgPool, user_id: Uuid) -> AppResult<()> {
        sqlx::query("UPDATE users SET is_active = FALSE WHERE id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    /// List all users with pagination (admin).
    pub async fn list_users(
        pool: &PgPool,
        page: u32,
        per_page: u32,
    ) -> AppResult<(Vec<UserWithProfile>, i64)> {
        let offset = ((page.saturating_sub(1)) * per_page) as i64;

        let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await?;

        let users = sqlx::query_as!(
            UserWithProfile,
            r#"
            SELECT u.id, u.email, u.role AS "role: UserRole",
                   u.is_verified, u.is_active,
                   p.display_name, p.avatar_url, p.gender, p.body_type,
                   p.style_preferences, p.color_preferences,
                   u.created_at
            FROM users u
            LEFT JOIN user_profiles p ON p.user_id = u.id
            ORDER BY u.created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            per_page as i64,
            offset
        )
        .fetch_all(pool)
        .await?;

        Ok((users, total.0))
    }

    /// Update user's password hash.
    pub async fn update_password(pool: &PgPool, user_id: Uuid, password_hash: &str) -> AppResult<()> {
        sqlx::query("UPDATE users SET password_hash = $2 WHERE id = $1")
            .bind(user_id)
            .bind(password_hash)
            .execute(pool)
            .await?;
        Ok(())
    }

    /// Update avatar URL.
    pub async fn update_avatar(pool: &PgPool, user_id: Uuid, avatar_url: &str) -> AppResult<()> {
        sqlx::query("UPDATE user_profiles SET avatar_url = $2 WHERE user_id = $1")
            .bind(user_id)
            .bind(avatar_url)
            .execute(pool)
            .await?;
        Ok(())
    }
}
