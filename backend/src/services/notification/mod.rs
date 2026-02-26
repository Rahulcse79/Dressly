use crate::config::AppConfig;
use crate::db::models::notification::*;
use crate::errors::{AppError, AppResult};
use reqwest::Client;
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{info, error, warn, instrument};

/// Notification service for sending push notifications via FCM.
pub struct NotificationService {
    config: Arc<AppConfig>,
    http_client: Client,
}

impl NotificationService {
    pub fn new(config: Arc<AppConfig>) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .expect("Failed to build HTTP client");

        Self { config, http_client }
    }

    /// Send a push notification to a specific device via FCM.
    #[instrument(skip(self, data), fields(title = %title))]
    pub async fn send_push(
        &self,
        fcm_token: &str,
        title: &str,
        body: &str,
        data: Option<HashMap<String, String>>,
    ) -> AppResult<()> {
        let message = FcmMessage {
            message: FcmMessageBody {
                token: fcm_token.to_string(),
                notification: FcmNotification {
                    title: title.to_string(),
                    body: body.to_string(),
                },
                data,
            },
        };

        let url = format!(
            "https://fcm.googleapis.com/v1/projects/{}/messages:send",
            self.config.fcm.project_id
        );

        let response = self.http_client
            .post(&url)
            .bearer_auth(&self.config.fcm.server_key)
            .json(&message)
            .send()
            .await
            .map_err(|e| {
                error!("FCM send failed: {}", e);
                AppError::ExternalServiceError(format!("Push notification failed: {}", e))
            })?;

        if response.status().is_success() {
            info!("Push notification sent successfully");
        } else {
            let error_body = response.text().await.unwrap_or_default();
            warn!("FCM error: {}", error_body);
        }

        Ok(())
    }

    /// Send push notification to multiple devices.
    pub async fn send_push_to_tokens(
        &self,
        tokens: &[String],
        title: &str,
        body: &str,
        data: Option<HashMap<String, String>>,
    ) -> AppResult<()> {
        for token in tokens {
            if let Err(e) = self.send_push(token, title, body, data.clone()).await {
                warn!("Failed to send to token {}: {}", &token[..8], e);
            }
        }
        Ok(())
    }

    /// Build notification data for different types.
    pub fn build_notification_data(
        notification_type: &NotificationType,
        extra: Option<serde_json::Value>,
    ) -> HashMap<String, String> {
        let mut data = HashMap::new();
        data.insert("type".to_string(), format!("{:?}", notification_type));

        if let Some(extra_data) = extra {
            if let Some(obj) = extra_data.as_object() {
                for (key, value) in obj {
                    data.insert(key.clone(), value.to_string());
                }
            }
        }

        data
    }
}
