use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Subscription plan type.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "plan_type", rename_all = "lowercase")]
pub enum PlanType {
    Free,
    Pro,
}

/// Subscription status.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "subscription_status", rename_all = "lowercase")]
pub enum SubscriptionStatus {
    Active,
    Cancelled,
    Expired,
    Pending,
}

/// User subscription model.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Subscription {
    pub id: Uuid,
    pub user_id: Uuid,
    pub plan_type: PlanType,
    pub status: SubscriptionStatus,
    pub price_inr: i64,
    pub razorpay_subscription_id: Option<String>,
    pub razorpay_order_id: Option<String>,
    pub starts_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Checkout request.
#[derive(Debug, Deserialize)]
pub struct CheckoutRequest {
    pub plan: PlanType,
}

/// Payment verification request.
#[derive(Debug, Deserialize)]
pub struct VerifyPaymentRequest {
    pub razorpay_order_id: String,
    pub razorpay_payment_id: String,
    pub razorpay_signature: String,
}

/// Subscription response with status info.
#[derive(Debug, Serialize)]
pub struct SubscriptionResponse {
    pub subscription: Option<Subscription>,
    pub is_pro: bool,
    pub days_remaining: Option<i64>,
}
