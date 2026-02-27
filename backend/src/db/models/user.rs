use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// User role enumeration for RBAC.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    User,
    Pro,
    Admin,
}

impl Default for UserRole {
    fn default() -> Self {
        Self::User
    }
}

/// Core user model mapped to the `users` table.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub is_verified: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// User profile with extended fashion preferences.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserProfile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub body_type: Option<String>,
    pub style_preferences: Option<serde_json::Value>,
    pub color_preferences: Option<serde_json::Value>,
    pub updated_at: DateTime<Utc>,
}

/// Combined user + profile view for API responses.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserWithProfile {
    pub id: Uuid,
    pub email: String,
    pub role: UserRole,
    pub is_verified: bool,
    pub is_active: bool,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub body_type: Option<String>,
    pub style_preferences: Option<serde_json::Value>,
    pub color_preferences: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// Registration request DTO with validation.
#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 8, max = 128, message = "Password must be 8-128 characters"))]
    pub password: String,
    #[validate(length(min = 2, max = 50, message = "Display name must be 2-50 characters"))]
    pub display_name: Option<String>,
}

/// Login request DTO.
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
    pub device_id: Option<String>,
    pub fcm_token: Option<String>,
    pub platform: Option<String>,
}

/// Token pair response.
#[derive(Debug, Serialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub token_type: String,
    pub user: UserWithProfile,
}

/// Profile update request.
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 2, max = 50))]
    pub display_name: Option<String>,
    pub gender: Option<String>,
    pub body_type: Option<String>,
    pub style_preferences: Option<serde_json::Value>,
    pub color_preferences: Option<serde_json::Value>,
}

/// Refresh token request.
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

/// Password reset request.
#[derive(Debug, Deserialize, Validate)]
pub struct ResetPasswordRequest {
    pub token: String,
    #[validate(length(min = 8, max = 128))]
    pub new_password: String,
}
