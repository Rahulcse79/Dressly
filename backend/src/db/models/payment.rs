use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Payment record.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Payment {
    pub id: Uuid,
    pub subscription_id: Uuid,
    pub user_id: Uuid,
    pub razorpay_payment_id: Option<String>,
    pub razorpay_order_id: String,
    pub amount_inr: i64,
    pub currency: String,
    pub status: PaymentStatus,
    pub method: Option<String>,
    pub error_code: Option<String>,
    pub error_description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "payment_status", rename_all = "lowercase")]
pub enum PaymentStatus {
    Created,
    Authorized,
    Captured,
    Failed,
    Refunded,
}

/// Razorpay order creation response.
#[derive(Debug, Serialize, Deserialize)]
pub struct RazorpayOrder {
    pub id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
}

/// Razorpay webhook payload.
#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookPayload {
    pub event: String,
    pub payload: serde_json::Value,
}
