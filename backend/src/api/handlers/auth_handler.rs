use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use validator::Validate;

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::user::*;
use crate::db::repositories::UserRepository;
use crate::errors::{AppError, AppResult};
use crate::services::auth::AuthService;
use crate::services::redis_service::RedisService;

/// POST /auth/register
pub async fn register(
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;

    // Validate password strength
    AuthService::validate_password_strength(&body.password)?;

    // Check if email already exists
    if let Some(_) = UserRepository::find_by_email(&pool, &body.email).await? {
        return Err(AppError::Conflict("Email already registered".into()));
    }

    // Hash password with Argon2id
    let password_hash = auth_service.hash_password(&body.password)?;

    // Create user
    let user = UserRepository::create_user(
        &pool,
        &body.email,
        &password_hash,
        body.display_name.as_deref(),
    )
    .await?;

    // Get user with profile for token generation
    let user_profile = UserRepository::get_user_with_profile(&pool, user.id)
        .await?
        .ok_or_else(|| AppError::InternalError("Failed to load user profile".into()))?;

    // Generate tokens
    let access_token = auth_service.generate_access_token(&user_profile)?;
    let refresh_token = auth_service.generate_refresh_token(&user_profile)?;

    let response = TokenResponse {
        access_token,
        refresh_token,
        expires_in: 900,
        token_type: "Bearer".to_string(),
        user: user_profile,
    };

    Ok(ApiResponse::created(response))
}

/// POST /auth/login
pub async fn login(
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
    redis: web::Data<RedisService>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;

    // Find user
    let user = UserRepository::find_by_email(&pool, &body.email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

    // Verify password
    let is_valid = auth_service.verify_password(&body.password, &user.password_hash)?;
    if !is_valid {
        return Err(AppError::Unauthorized("Invalid email or password".into()));
    }

    // Check if user is active
    if !user.is_active {
        return Err(AppError::Forbidden("Account is deactivated".into()));
    }

    // Get user with profile
    let user_profile = UserRepository::get_user_with_profile(&pool, user.id)
        .await?
        .ok_or_else(|| AppError::InternalError("Failed to load user profile".into()))?;

    // Generate tokens
    let access_token = auth_service.generate_access_token(&user_profile)?;
    let refresh_token = auth_service.generate_refresh_token(&user_profile)?;

    let response = TokenResponse {
        access_token,
        refresh_token,
        expires_in: 900,
        token_type: "Bearer".to_string(),
        user: user_profile,
    };

    Ok(ApiResponse::success(response))
}

/// POST /auth/refresh
pub async fn refresh_token(
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
    body: web::Json<RefreshTokenRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate refresh token
    let claims = auth_service.validate_refresh_token(&body.refresh_token)?;
    let user_id = AuthService::extract_user_id(&claims)?;

    // Get fresh user data
    let user_profile = UserRepository::get_user_with_profile(&pool, user_id)
        .await?
        .ok_or_else(|| AppError::Unauthorized("User not found".into()))?;

    // Generate new token pair (token rotation)
    let access_token = auth_service.generate_access_token(&user_profile)?;
    let refresh_token = auth_service.generate_refresh_token(&user_profile)?;

    let response = TokenResponse {
        access_token,
        refresh_token,
        expires_in: 900,
        token_type: "Bearer".to_string(),
        user: user_profile,
    };

    Ok(ApiResponse::success(response))
}

/// POST /auth/logout
pub async fn logout(
    req: HttpRequest,
    redis: web::Data<RedisService>,
) -> Result<HttpResponse, AppError> {
    // Get user from request extensions (set by auth middleware)
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    // Invalidate all sessions in Redis
    redis.invalidate_all_sessions(&user.id).await?;

    Ok(crate::api::response::ok_message("Logged out successfully"))
}
