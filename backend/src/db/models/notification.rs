use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Notification types.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_type", rename_all = "snake_case")]
pub enum NotificationType {
    AiGenerationComplete,
    SubscriptionActivated,
    SubscriptionExpiring,
    AdminAnnouncement,
    StyleTip,
    PaymentSuccess,
    PaymentFailed,
}

/// Notification model.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub body: String,
    pub notification_type: NotificationType,
    pub is_read: bool,
    pub data: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// Create notification request (internal).
#[derive(Debug, Deserialize)]
pub struct CreateNotificationRequest {
    pub user_id: Uuid,
    pub title: String,
    pub body: String,
    pub notification_type: NotificationType,
    pub data: Option<serde_json::Value>,
}

/// FCM token registration.
#[derive(Debug, Deserialize)]
pub struct RegisterFcmTokenRequest {
    pub token: String,
    pub platform: String,
    pub device_id: Option<String>,
}

/// FCM push notification payload.
#[derive(Debug, Serialize)]
pub struct FcmMessage {
    pub message: FcmMessageBody,
}

#[derive(Debug, Serialize)]
pub struct FcmMessageBody {
    pub token: String,
    pub notification: FcmNotification,
    pub data: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Serialize)]
pub struct FcmNotification {
    pub title: String,
    pub body: String,
}
