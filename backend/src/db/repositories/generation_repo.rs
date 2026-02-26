use sqlx::PgPool;
use uuid::Uuid;
use crate::db::models::generation::*;
use crate::errors::AppResult;

/// Repository for AI generation operations.
pub struct GenerationRepository;

impl GenerationRepository {
    /// Create a new generation record.
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        prompt: &str,
        input_image_urls: &serde_json::Value,
        occasion: Option<&str>,
        model_version: &str,
    ) -> AppResult<OutfitGeneration> {
        let gen = sqlx::query_as::<_, OutfitGeneration>(
            r#"
            INSERT INTO outfit_generations (user_id, prompt_text, input_image_urls, occasion, model_version, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(prompt)
        .bind(input_image_urls)
        .bind(occasion)
        .bind(model_version)
        .fetch_one(pool)
        .await?;

        Ok(gen)
    }

    /// Update generation with AI result.
    pub async fn update_result(
        pool: &PgPool,
        generation_id: Uuid,
        output_image_url: Option<&str>,
        style_score: Option<f64>,
        ai_feedback: Option<&str>,
        latency_ms: i64,
        tokens_used: i32,
        status: &GenerationStatus,
        error_message: Option<&str>,
    ) -> AppResult<OutfitGeneration> {
        let gen = sqlx::query_as::<_, OutfitGeneration>(
            r#"
            UPDATE outfit_generations SET
                output_image_url = $2,
                style_score = $3,
                ai_feedback = $4,
                latency_ms = $5,
                tokens_used = $6,
                status = $7,
                error_message = $8
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(generation_id)
        .bind(output_image_url)
        .bind(style_score)
        .bind(ai_feedback)
        .bind(latency_ms)
        .bind(tokens_used)
        .bind(status)
        .bind(error_message)
        .fetch_one(pool)
        .await?;

        Ok(gen)
    }

    /// Update generation status.
    pub async fn update_status(
        pool: &PgPool,
        generation_id: Uuid,
        status: &GenerationStatus,
    ) -> AppResult<()> {
        sqlx::query("UPDATE outfit_generations SET status = $2 WHERE id = $1")
            .bind(generation_id)
            .bind(status)
            .execute(pool)
            .await?;
        Ok(())
    }

    /// Get generation by ID.
    pub async fn find_by_id(pool: &PgPool, user_id: Uuid, generation_id: Uuid) -> AppResult<Option<OutfitGeneration>> {
        let gen = sqlx::query_as::<_, OutfitGeneration>(
            "SELECT * FROM outfit_generations WHERE id = $1 AND user_id = $2"
        )
        .bind(generation_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(gen)
    }

    /// List generations for a user (paginated).
    pub async fn list_by_user(
        pool: &PgPool,
        user_id: Uuid,
        page: u32,
        per_page: u32,
    ) -> AppResult<(Vec<OutfitGeneration>, i64)> {
        let offset = ((page.saturating_sub(1)) * per_page) as i64;

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM outfit_generations WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        let generations = sqlx::query_as::<_, OutfitGeneration>(
            "SELECT * FROM outfit_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(user_id)
        .bind(per_page as i64)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok((generations, total.0))
    }

    /// Count today's generations for rate limiting.
    pub async fn count_today_by_user(pool: &PgPool, user_id: Uuid) -> AppResult<i32> {
        let count: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) FROM outfit_generations
            WHERE user_id = $1
              AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC')
              AND status != 'failed'
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await?;

        Ok(count.0 as i32)
    }
}
