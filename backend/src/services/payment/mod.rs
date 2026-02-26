use crate::config::AppConfig;
use crate::errors::{AppError, AppResult};
use hmac::{Hmac, Mac};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::sync::Arc;
use tracing::{info, error, instrument};

type HmacSha256 = Hmac<Sha256>;

/// Payment service for Razorpay integration.
pub struct PaymentService {
    config: Arc<AppConfig>,
    http_client: Client,
}

#[derive(Debug, Serialize)]
struct CreateOrderRequest {
    amount: i64,      // Amount in paise (INR * 100)
    currency: String,
    receipt: String,
    notes: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayOrderResponse {
    pub id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
    pub receipt: Option<String>,
}

impl PaymentService {
    pub fn new(config: Arc<AppConfig>) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("Failed to build HTTP client");

        Self { config, http_client }
    }

    /// Create a Razorpay order for Pro subscription.
    #[instrument(skip(self), fields(amount_inr = amount_inr))]
    pub async fn create_order(
        &self,
        amount_inr: i64,
        receipt: &str,
        user_email: &str,
    ) -> AppResult<RazorpayOrderResponse> {
        let request = CreateOrderRequest {
            amount: amount_inr * 100, // Convert to paise
            currency: "INR".to_string(),
            receipt: receipt.to_string(),
            notes: serde_json::json!({
                "email": user_email,
                "plan": "pro",
                "app": "dressly"
            }),
        };

        let response = self.http_client
            .post("https://api.razorpay.com/v1/orders")
            .basic_auth(&self.config.razorpay.key_id, Some(&self.config.razorpay.key_secret))
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                error!("Razorpay order creation failed: {}", e);
                AppError::PaymentError(format!("Failed to create payment order: {}", e))
            })?;

        if !response.status().is_success() {
            let error_body = response.text().await.unwrap_or_default();
            error!("Razorpay error: {}", error_body);
            return Err(AppError::PaymentError(format!("Payment gateway error: {}", error_body)));
        }

        let order: RazorpayOrderResponse = response.json().await.map_err(|e| {
            AppError::PaymentError(format!("Failed to parse payment response: {}", e))
        })?;

        info!(order_id = %order.id, "Razorpay order created");
        Ok(order)
    }

    /// Verify Razorpay payment signature.
    /// Signature = HMAC-SHA256(order_id|payment_id, key_secret)
    pub fn verify_payment_signature(
        &self,
        order_id: &str,
        payment_id: &str,
        signature: &str,
    ) -> AppResult<bool> {
        let data = format!("{}|{}", order_id, payment_id);

        let mut mac = HmacSha256::new_from_slice(self.config.razorpay.key_secret.as_bytes())
            .map_err(|e| AppError::InternalError(format!("HMAC key error: {}", e)))?;

        mac.update(data.as_bytes());
        let expected = hex::encode(mac.finalize().into_bytes());

        Ok(expected == signature)
    }

    /// Verify Razorpay webhook signature.
    pub fn verify_webhook_signature(
        &self,
        body: &str,
        signature: &str,
    ) -> AppResult<bool> {
        let mut mac = HmacSha256::new_from_slice(self.config.razorpay.webhook_secret.as_bytes())
            .map_err(|e| AppError::InternalError(format!("HMAC key error: {}", e)))?;

        mac.update(body.as_bytes());
        let expected = hex::encode(mac.finalize().into_bytes());

        Ok(expected == signature)
    }

    /// Get Razorpay key ID for client-side initialization.
    pub fn get_key_id(&self) -> &str {
        &self.config.razorpay.key_id
    }
}
