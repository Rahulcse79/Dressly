use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use validator::Validate;
use chrono::{Utc, Duration};

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::generation::*;
use crate::db::models::user::UserRole;
use crate::db::repositories::{GenerationRepository, WardrobeRepository, AdminConfigRepository, SubscriptionRepository};
use crate::errors::AppError;
use crate::services::ai::AiService;
use crate::services::redis_service::RedisService;
use crate::services::websocket::{WsManager, WsServerMessage};

/// POST /ai/generate
pub async fn generate_outfit(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    ai_service: web::Data<AiService>,
    redis: web::Data<RedisService>,
    ws_manager: web::Data<WsManager>,
    body: web::Json<GenerateOutfitRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    body.validate()?;

    // Check rate limit / quota
    let is_pro = user.role == UserRole::Pro || user.role == UserRole::Admin;
    if !is_pro {
        let daily_quota = AdminConfigRepository::get_free_quota(&pool).await?;
        let used_today = GenerationRepository::count_today_by_user(&pool, user.id).await?;

        if used_today >= daily_quota {
            return Err(AppError::RateLimitExceeded);
        }
    }

    // Get wardrobe items if image IDs provided
    let mut image_data: Vec<(String, Vec<u8>)> = Vec::new();
    let mut input_urls: Vec<String> = Vec::new();

    if let Some(ref image_ids) = body.image_ids {
        let items = WardrobeRepository::find_by_ids(&pool, user.id, image_ids).await?;
        for item in &items {
            input_urls.push(item.image_url.clone());
            // In production: download image from S3 and convert to bytes
            // For now, we'll pass the URLs to Gemini
        }
    }

    let input_urls_json = serde_json::json!(input_urls);

    // Create generation record
    let generation = GenerationRepository::create(
        &pool,
        user.id,
        &body.prompt,
        &input_urls_json,
        body.occasion.as_deref(),
        "gemini-2.0-flash",
    )
    .await?;

    // Update status to processing
    GenerationRepository::update_status(&pool, generation.id, &GenerationStatus::Processing).await?;

    // Send progress update via WebSocket
    ws_manager.send_to_user(&user.id, WsServerMessage::AiProgress {
        generation_id: generation.id.to_string(),
        status: "processing".to_string(),
        progress: 10,
        message: Some("Starting AI analysis...".to_string()),
    });

    // Call Gemini API
    let result = ai_service.generate_outfit(
        &body.prompt,
        image_data,
        body.occasion.as_deref(),
    ).await;

    match result {
        Ok(ai_result) => {
            // Update generation with result
            let updated = GenerationRepository::update_result(
                &pool,
                generation.id,
                None, // output_image_url (would come from image generation)
                Some(ai_result.style_score),
                Some(&ai_result.ai_feedback),
                ai_result.latency_ms,
                ai_result.tokens_used,
                &GenerationStatus::Completed,
                None,
            )
            .await?;

            // Send completion via WebSocket
            ws_manager.send_to_user(&user.id, WsServerMessage::AiComplete {
                generation_id: generation.id.to_string(),
                result: serde_json::json!({
                    "style_score": ai_result.style_score,
                    "feedback": ai_result.ai_feedback,
                    "latency_ms": ai_result.latency_ms,
                }),
            });

            Ok(ApiResponse::success(updated))
        }
        Err(e) => {
            // Update generation with error
            GenerationRepository::update_result(
                &pool,
                generation.id,
                None,
                None,
                None,
                0,
                0,
                &GenerationStatus::Failed,
                Some(&e.to_string()),
            )
            .await?;

            Err(e)
        }
    }
}

/// GET /ai/generations
pub async fn list_generations(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    query: web::Query<crate::db::models::wardrobe::PaginationParams>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    let (generations, total) = GenerationRepository::list_by_user(&pool, user.id, page, per_page).await?;

    let response = crate::db::models::wardrobe::PaginatedResponse {
        data: generations,
        pagination: crate::db::models::wardrobe::PaginationMeta {
            page,
            per_page,
            total,
            total_pages: ((total as f64) / (per_page as f64)).ceil() as u32,
        },
    };

    Ok(ApiResponse::success(response))
}

/// GET /ai/generations/{id}
pub async fn get_generation(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let gen_id = path.into_inner();
    let generation = GenerationRepository::find_by_id(&pool, user.id, gen_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Generation not found".into()))?;

    Ok(ApiResponse::success(generation))
}

/// GET /ai/quota
pub async fn get_quota(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let is_pro = user.role == UserRole::Pro || user.role == UserRole::Admin;
    let daily_limit = if is_pro {
        i32::MAX
    } else {
        AdminConfigRepository::get_free_quota(&pool).await?
    };

    let used_today = GenerationRepository::count_today_by_user(&pool, user.id).await?;

    let tomorrow = (Utc::now() + Duration::days(1))
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap();

    let response = AiQuotaResponse {
        used_today,
        daily_limit,
        remaining: if is_pro { i32::MAX } else { (daily_limit - used_today).max(0) },
        is_pro,
        resets_at: chrono::DateTime::<Utc>::from_naive_utc_and_offset(tomorrow, Utc),
    };

    Ok(ApiResponse::success(response))
}
