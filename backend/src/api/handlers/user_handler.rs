use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use validator::Validate;

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::user::*;
use crate::db::repositories::UserRepository;
use crate::errors::AppError;

/// GET /users/me
pub async fn get_me(req: HttpRequest, pool: web::Data<PgPool>) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let profile = UserRepository::get_user_with_profile(&pool, user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    Ok(ApiResponse::success(profile))
}

/// PATCH /users/me
pub async fn update_me(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    body.validate()?;

    let profile = UserRepository::update_profile(&pool, user.id, &body).await?;
    Ok(ApiResponse::success(profile))
}

/// DELETE /users/me
pub async fn delete_me(req: HttpRequest, pool: web::Data<PgPool>) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    UserRepository::soft_delete(&pool, user.id).await?;
    Ok(crate::api::response::ok_message("Account deleted successfully"))
}
