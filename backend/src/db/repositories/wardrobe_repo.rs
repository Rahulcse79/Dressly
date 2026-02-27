use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::wardrobe::*;
use crate::errors::AppResult;

/// Repository for wardrobe-related database operations.
pub struct WardrobeRepository;

impl WardrobeRepository {
    /// Add a new wardrobe item.
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        image_url: &str,
        req: &AddWardrobeItemRequest,
    ) -> AppResult<WardrobeItem> {
        let occasion_tags = req.occasion_tags.as_ref().map(|tags| serde_json::json!(tags));

        let item = sqlx::query_as::<_, WardrobeItem>(
            r#"
            INSERT INTO wardrobe_items (user_id, image_url, category, color, brand, occasion_tags, season, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(image_url)
        .bind(&req.category)
        .bind(&req.color)
        .bind(&req.brand)
        .bind(&occasion_tags)
        .bind(&req.season)
        .bind(&req.metadata)
        .fetch_one(pool)
        .await?;

        Ok(item)
    }

    /// Get wardrobe items with pagination and filtering.
    pub async fn list(
        pool: &PgPool,
        user_id: Uuid,
        params: &PaginationParams,
    ) -> AppResult<(Vec<WardrobeItem>, i64)> {
        let page = params.page.unwrap_or(1);
        let per_page = params.per_page.unwrap_or(20).min(100);
        let offset = ((page.saturating_sub(1)) * per_page) as i64;

        // Use optional filters for category and season
        match (&params.category, &params.season) {
            (Some(category), Some(season)) => {
                let total: (i64,) = sqlx::query_as(
                    "SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1 AND category = $2 AND season = $3"
                )
                .bind(user_id)
                .bind(category)
                .bind(season)
                .fetch_one(pool)
                .await?;

                let items = sqlx::query_as::<_, WardrobeItem>(
                    "SELECT * FROM wardrobe_items WHERE user_id = $1 AND category = $2 AND season = $3 ORDER BY created_at DESC LIMIT $4 OFFSET $5"
                )
                .bind(user_id)
                .bind(category)
                .bind(season)
                .bind(per_page as i64)
                .bind(offset)
                .fetch_all(pool)
                .await?;

                Ok((items, total.0))
            }
            (Some(category), None) => {
                let total: (i64,) = sqlx::query_as(
                    "SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1 AND category = $2"
                )
                .bind(user_id)
                .bind(category)
                .fetch_one(pool)
                .await?;

                let items = sqlx::query_as::<_, WardrobeItem>(
                    "SELECT * FROM wardrobe_items WHERE user_id = $1 AND category = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4"
                )
                .bind(user_id)
                .bind(category)
                .bind(per_page as i64)
                .bind(offset)
                .fetch_all(pool)
                .await?;

                Ok((items, total.0))
            }
            (None, Some(season)) => {
                let total: (i64,) = sqlx::query_as(
                    "SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1 AND season = $2"
                )
                .bind(user_id)
                .bind(season)
                .fetch_one(pool)
                .await?;

                let items = sqlx::query_as::<_, WardrobeItem>(
                    "SELECT * FROM wardrobe_items WHERE user_id = $1 AND season = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4"
                )
                .bind(user_id)
                .bind(season)
                .bind(per_page as i64)
                .bind(offset)
                .fetch_all(pool)
                .await?;

                Ok((items, total.0))
            }
            (None, None) => {
                let total: (i64,) = sqlx::query_as(
                    "SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1"
                )
                .bind(user_id)
                .fetch_one(pool)
                .await?;

                let items = sqlx::query_as::<_, WardrobeItem>(
                    "SELECT * FROM wardrobe_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
                )
                .bind(user_id)
                .bind(per_page as i64)
                .bind(offset)
                .fetch_all(pool)
                .await?;

                Ok((items, total.0))
            }
        }
    }

    /// Get a single wardrobe item by ID (owned by user).
    pub async fn find_by_id(pool: &PgPool, user_id: Uuid, item_id: Uuid) -> AppResult<Option<WardrobeItem>> {
        let item = sqlx::query_as::<_, WardrobeItem>(
            "SELECT * FROM wardrobe_items WHERE id = $1 AND user_id = $2"
        )
        .bind(item_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(item)
    }

    /// Get multiple wardrobe items by IDs (for AI generation).
    pub async fn find_by_ids(pool: &PgPool, user_id: Uuid, item_ids: &[Uuid]) -> AppResult<Vec<WardrobeItem>> {
        let items = sqlx::query_as::<_, WardrobeItem>(
            "SELECT * FROM wardrobe_items WHERE user_id = $1 AND id = ANY($2)"
        )
        .bind(user_id)
        .bind(item_ids)
        .fetch_all(pool)
        .await?;

        Ok(items)
    }

    /// Update a wardrobe item.
    pub async fn update(
        pool: &PgPool,
        user_id: Uuid,
        item_id: Uuid,
        req: &UpdateWardrobeItemRequest,
    ) -> AppResult<WardrobeItem> {
        let occasion_tags = req.occasion_tags.as_ref().map(|tags| serde_json::json!(tags));

        let item = sqlx::query_as::<_, WardrobeItem>(
            r#"
            UPDATE wardrobe_items SET
                category = COALESCE($3, category),
                color = COALESCE($4, color),
                brand = COALESCE($5, brand),
                occasion_tags = COALESCE($6, occasion_tags),
                season = COALESCE($7, season),
                metadata = COALESCE($8, metadata)
            WHERE id = $1 AND user_id = $2
            RETURNING *
            "#,
        )
        .bind(item_id)
        .bind(user_id)
        .bind(&req.category)
        .bind(&req.color)
        .bind(&req.brand)
        .bind(&occasion_tags)
        .bind(&req.season)
        .bind(&req.metadata)
        .fetch_one(pool)
        .await?;

        Ok(item)
    }

    /// Delete a wardrobe item.
    pub async fn delete(pool: &PgPool, user_id: Uuid, item_id: Uuid) -> AppResult<bool> {
        let result = sqlx::query(
            "DELETE FROM wardrobe_items WHERE id = $1 AND user_id = $2"
        )
        .bind(item_id)
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Count items for a user.
    pub async fn count_by_user(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
        let count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM wardrobe_items WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(count.0)
    }
}
