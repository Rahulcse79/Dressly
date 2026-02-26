use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;

use crate::api::middleware::AuthenticatedUser;
use crate::api::response::ApiResponse;
use crate::db::models::subscription::*;
use crate::db::models::user::UserRole;
use crate::db::repositories::{SubscriptionRepository, PaymentRepository, AdminConfigRepository, UserRepository};
use crate::errors::AppError;
use crate::services::payment::PaymentService;
use crate::services::websocket::{WsManager, WsServerMessage};

/// GET /subscription
pub async fn get_subscription(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let subscription = SubscriptionRepository::get_active(&pool, user.id).await?;
    let is_pro = subscription.is_some();
    let days_remaining = subscription.as_ref().and_then(|s| {
        s.expires_at.map(|exp| (exp - chrono::Utc::now()).num_days())
    });

    let response = SubscriptionResponse {
        subscription,
        is_pro,
        days_remaining,
    };

    Ok(ApiResponse::success(response))
}

/// POST /subscription/checkout
pub async fn checkout(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    payment_service: web::Data<PaymentService>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    // Check if already has active subscription
    if let Some(_) = SubscriptionRepository::get_active(&pool, user.id).await? {
        return Err(AppError::Conflict("Already have an active Pro subscription".into()));
    }

    // Get current pro price from admin config
    let price_inr = AdminConfigRepository::get_pro_price(&pool).await?;

    // Create Razorpay order
    let receipt = format!("dressly_pro_{}", uuid::Uuid::new_v4());
    let order = payment_service.create_order(price_inr, &receipt, &user.email).await?;

    // Create subscription record
    let subscription = SubscriptionRepository::create(
        &pool,
        user.id,
        &PlanType::Pro,
        price_inr,
        &order.id,
    )
    .await?;

    // Create payment record
    PaymentRepository::create(&pool, subscription.id, user.id, &order.id, price_inr).await?;

    Ok(ApiResponse::success(serde_json::json!({
        "order_id": order.id,
        "amount": order.amount,
        "currency": order.currency,
        "key_id": payment_service.get_key_id(),
        "subscription_id": subscription.id,
    })))
}

/// POST /subscription/verify
pub async fn verify_payment(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    payment_service: web::Data<PaymentService>,
    ws_manager: web::Data<WsManager>,
    body: web::Json<VerifyPaymentRequest>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    // Verify Razorpay signature
    let is_valid = payment_service.verify_payment_signature(
        &body.razorpay_order_id,
        &body.razorpay_payment_id,
        &body.razorpay_signature,
    )?;

    if !is_valid {
        return Err(AppError::PaymentError("Invalid payment signature".into()));
    }

    // Find subscription by order ID
    let subscription = SubscriptionRepository::find_by_order_id(&pool, &body.razorpay_order_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Subscription not found".into()))?;

    // Activate subscription
    let activated = SubscriptionRepository::activate(
        &pool,
        subscription.id,
        Some(&body.razorpay_payment_id),
    )
    .await?;

    // Update payment record
    PaymentRepository::update_captured(
        &pool,
        &body.razorpay_order_id,
        &body.razorpay_payment_id,
        None,
    )
    .await?;

    // Update user role to Pro
    UserRepository::update_role(&pool, user.id, &UserRole::Pro).await?;

    // Notify user via WebSocket
    ws_manager.send_to_user(&user.id, WsServerMessage::SubscriptionUpdated {
        data: serde_json::json!({
            "status": "active",
            "plan": "pro",
            "expires_at": activated.expires_at,
        }),
    });

    Ok(ApiResponse::success(activated))
}

/// POST /subscription/cancel
pub async fn cancel_subscription(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    ws_manager: web::Data<WsManager>,
) -> Result<HttpResponse, AppError> {
    let user = req.extensions().get::<AuthenticatedUser>().cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".into()))?;

    let subscription = SubscriptionRepository::get_active(&pool, user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("No active subscription found".into()))?;

    SubscriptionRepository::cancel(&pool, subscription.id).await?;
    UserRepository::update_role(&pool, user.id, &UserRole::User).await?;

    ws_manager.send_to_user(&user.id, WsServerMessage::SubscriptionUpdated {
        data: serde_json::json!({ "status": "cancelled" }),
    });

    Ok(crate::api::response::ok_message("Subscription cancelled"))
}
