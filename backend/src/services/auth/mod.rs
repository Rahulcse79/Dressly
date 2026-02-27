use crate::config::AppConfig;
use crate::db::models::user::{UserRole, UserWithProfile};
use crate::errors::{AppError, AppResult};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

/// JWT claims payload.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,        // user_id
    pub email: String,
    pub role: String,
    pub iat: i64,           // issued at
    pub exp: i64,           // expiry
    pub jti: String,        // unique token ID
    pub token_type: String, // "access" or "refresh"
}

/// Authentication service handling password hashing, JWT generation/verification.
pub struct AuthService {
    config: Arc<AppConfig>,
}

impl AuthService {
    pub fn new(config: Arc<AppConfig>) -> Self {
        Self { config }
    }

    /// Hash a password using Argon2id (OWASP recommended).
    /// Memory: 64MB, Iterations: 3, Parallelism: 4
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        let salt = SaltString::generate(&mut OsRng);

        let argon2 = Argon2::new(
            argon2::Algorithm::Argon2id,
            argon2::Version::V0x13,
            argon2::Params::new(65536, 3, 4, None)
                .map_err(|e| AppError::InternalError(format!("Argon2 params error: {}", e)))?,
        );

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| AppError::InternalError(format!("Password hashing error: {}", e)))?
            .to_string();

        Ok(password_hash)
    }

    /// Verify a password against a stored hash.
    pub fn verify_password(&self, password: &str, password_hash: &str) -> AppResult<bool> {
        let parsed_hash = PasswordHash::new(password_hash)
            .map_err(|e| AppError::InternalError(format!("Invalid hash format: {}", e)))?;

        let argon2 = Argon2::default();

        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(e) => Err(AppError::InternalError(format!("Password verification error: {}", e))),
        }
    }

    /// Generate an access token (short-lived: 15min default).
    pub fn generate_access_token(&self, user: &UserWithProfile) -> AppResult<String> {
        let now = Utc::now();
        let expiry = now + Duration::seconds(self.config.jwt.access_token_expiry);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: format!("{:?}", user.role).to_lowercase(),
            iat: now.timestamp(),
            exp: expiry.timestamp(),
            jti: Uuid::new_v4().to_string(),
            token_type: "access".to_string(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.jwt.access_secret.as_bytes()),
        )?;

        Ok(token)
    }

    /// Generate a refresh token (long-lived: 7 days default).
    pub fn generate_refresh_token(&self, user: &UserWithProfile) -> AppResult<String> {
        let now = Utc::now();
        let expiry = now + Duration::seconds(self.config.jwt.refresh_token_expiry);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: format!("{:?}", user.role).to_lowercase(),
            iat: now.timestamp(),
            exp: expiry.timestamp(),
            jti: Uuid::new_v4().to_string(),
            token_type: "refresh".to_string(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.jwt.refresh_secret.as_bytes()),
        )?;

        Ok(token)
    }

    /// Validate and decode a JWT token.
    pub fn validate_token(&self, token: &str) -> AppResult<TokenData<Claims>> {
        let validation = Validation::default();

        // Try access secret first, then refresh secret
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.jwt.access_secret.as_bytes()),
            &validation,
        )
        .or_else(|_| {
            decode::<Claims>(
                token,
                &DecodingKey::from_secret(self.config.jwt.refresh_secret.as_bytes()),
                &validation,
            )
        })?;

        Ok(token_data)
    }

    /// Validate an access token specifically.
    pub fn validate_access_token(&self, token: &str) -> AppResult<Claims> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.jwt.access_secret.as_bytes()),
            &validation,
        )?;

        if token_data.claims.token_type != "access" {
            return Err(AppError::Unauthorized("Not an access token".into()));
        }

        Ok(token_data.claims)
    }

    /// Validate a refresh token specifically.
    pub fn validate_refresh_token(&self, token: &str) -> AppResult<Claims> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.jwt.refresh_secret.as_bytes()),
            &validation,
        )?;

        if token_data.claims.token_type != "refresh" {
            return Err(AppError::Unauthorized("Not a refresh token".into()));
        }

        Ok(token_data.claims)
    }

    /// Extract user_id from claims.
    pub fn extract_user_id(claims: &Claims) -> AppResult<Uuid> {
        Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("Invalid user ID in token".into()))
    }

    /// Extract role from claims.
    pub fn extract_role(claims: &Claims) -> UserRole {
        match claims.role.as_str() {
            "admin" => UserRole::Admin,
            "pro" => UserRole::Pro,
            _ => UserRole::User,
        }
    }

    /// Validate password strength.
    pub fn validate_password_strength(password: &str) -> AppResult<()> {
        if password.len() < 8 {
            return Err(AppError::ValidationError("Password must be at least 8 characters".into()));
        }
        if password.len() > 128 {
            return Err(AppError::ValidationError("Password must be at most 128 characters".into()));
        }
        if !password.chars().any(|c| c.is_uppercase()) {
            return Err(AppError::ValidationError("Password must contain at least one uppercase letter".into()));
        }
        if !password.chars().any(|c| c.is_lowercase()) {
            return Err(AppError::ValidationError("Password must contain at least one lowercase letter".into()));
        }
        if !password.chars().any(|c| c.is_numeric()) {
            return Err(AppError::ValidationError("Password must contain at least one digit".into()));
        }
        Ok(())
    }
}
