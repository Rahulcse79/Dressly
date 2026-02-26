use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use validator::Validate;

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::wardrobe::*;
use crate::db::repositories::WardrobeRepository;
use crate::errors::AppError;

/// GET /wardrobe
pub async fn list_items(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    query: web::Query<PaginationParams>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let (items, total) = WardrobeRepository::list(&pool, user.id, &query).await?;
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    let response = PaginatedResponse {
        data: items,
        pagination: PaginationMeta {
            page,
            per_page,
            total,
            total_pages: ((total as f64) / (per_page as f64)).ceil() as u32,
        },
    };

    Ok(ApiResponse::success(response))
}

/// POST /wardrobe
pub async fn add_item(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<AddWardrobeItemRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    body.validate()?;

    // In production, image would be uploaded to S3/R2 first
    // For now, use a placeholder URL
    let image_url = format!("https://media.dressly.app/wardrobe/{}/{}", user.id, uuid::Uuid::new_v4());

    let item = WardrobeRepository::create(&pool, user.id, &image_url, &body).await?;
    Ok(ApiResponse::created(item))
}

/// GET /wardrobe/{id}
pub async fn get_item(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let item_id = path.into_inner();
    let item = WardrobeRepository::find_by_id(&pool, user.id, item_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Wardrobe item not found".into()))?;

    Ok(ApiResponse::success(item))
}

/// PATCH /wardrobe/{id}
pub async fn update_item(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
    body: web::Json<UpdateWardrobeItemRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    body.validate()?;

    let item_id = path.into_inner();
    let item = WardrobeRepository::update(&pool, user.id, item_id, &body).await?;
    Ok(ApiResponse::success(item))
}

/// DELETE /wardrobe/{id}
pub async fn delete_item(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let item_id = path.into_inner();
    let deleted = WardrobeRepository::delete(&pool, user.id, item_id).await?;

    if deleted {
        Ok(crate::api::response::ok_message("Item deleted successfully"))
    } else {
        Err(AppError::NotFound("Wardrobe item not found".into()))
    }
}
