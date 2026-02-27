use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
    web,
};
use futures::future::{ok, Ready, LocalBoxFuture};
use std::rc::Rc;
use uuid::Uuid;

use crate::db::models::user::UserRole;
use crate::errors::AppError;
use crate::services::auth::AuthService;

/// Authenticated user data extracted from JWT.
#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub id: Uuid,
    pub email: String,
    pub role: UserRole,
}

/// JWT Authentication middleware.
/// Extracts and validates JWT from Authorization header.
pub struct AuthMiddleware {
    pub required_role: Option<UserRole>,
}

impl AuthMiddleware {
    /// Create auth middleware that accepts any authenticated user.
    pub fn any() -> Self {
        Self { required_role: None }
    }

    /// Create auth middleware that requires admin role.
    pub fn admin() -> Self {
        Self { required_role: Some(UserRole::Admin) }
    }

    /// Create auth middleware that requires pro or admin role.
    pub fn pro_or_admin() -> Self {
        Self { required_role: Some(UserRole::Pro) }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddlewareService {
            service: Rc::new(service),
            required_role: self.required_role.clone(),
        })
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
    required_role: Option<UserRole>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let required_role = self.required_role.clone();

        Box::pin(async move {
            // Extract token from Authorization header
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "));

            let token = match auth_header {
                Some(t) => t.to_string(),
                None => {
                    return Err(AppError::Unauthorized("Missing authorization token".into()).into());
                }
            };

            // Get AuthService from app data
            let auth_service = req
                .app_data::<web::Data<AuthService>>()
                .ok_or_else(|| AppError::InternalError("Auth service not configured".into()))?;

            // Validate token
            let claims = auth_service
                .validate_access_token(&token)
                .map_err(|_| AppError::Unauthorized("Invalid or expired token".into()))?;

            let user_id = AuthService::extract_user_id(&claims)
                .map_err(|_| AppError::Unauthorized("Invalid user ID in token".into()))?;

            let role = AuthService::extract_role(&claims);

            // Check role requirement
            if let Some(ref required) = required_role {
                match required {
                    UserRole::Admin => {
                        if role != UserRole::Admin {
                            return Err(AppError::Forbidden("Admin access required".into()).into());
                        }
                    }
                    UserRole::Pro => {
                        if role != UserRole::Pro && role != UserRole::Admin {
                            return Err(AppError::Forbidden("Pro subscription required".into()).into());
                        }
                    }
                    _ => {}
                }
            }

            // Insert authenticated user into request extensions
            req.extensions_mut().insert(AuthenticatedUser {
                id: user_id,
                email: claims.email.clone(),
                role,
            });

            service.call(req).await
        })
    }
}
