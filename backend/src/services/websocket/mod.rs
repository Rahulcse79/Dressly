use actix_web::web;
use actix_ws;
use bytes::Bytes;
use dashmap::DashMap;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use tokio::time::interval;
use uuid::Uuid;
use tracing::{info, warn, error, debug};

use crate::config::AppConfig;
use crate::services::auth::AuthService;

/// WebSocket message types (client → server).
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum WsClientMessage {
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "subscribe")]
    Subscribe { channel: String },
    #[serde(rename = "unsubscribe")]
    Unsubscribe { channel: String },
}

/// WebSocket message types (server → client).
#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type")]
pub enum WsServerMessage {
    #[serde(rename = "pong")]
    Pong { server_time: i64 },
    #[serde(rename = "notification")]
    Notification { data: serde_json::Value },
    #[serde(rename = "ai_progress")]
    AiProgress {
        generation_id: String,
        status: String,
        progress: u8,
        message: Option<String>,
    },
    #[serde(rename = "ai_complete")]
    AiComplete {
        generation_id: String,
        result: serde_json::Value,
    },
    #[serde(rename = "subscription_updated")]
    SubscriptionUpdated { data: serde_json::Value },
    #[serde(rename = "config_updated")]
    ConfigUpdated { key: String, value: serde_json::Value },
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "connected")]
    Connected { user_id: String, server_time: i64 },
}

/// Per-user WebSocket sender channel.
pub type WsSender = mpsc::UnboundedSender<WsServerMessage>;

/// Global WebSocket connection manager.
/// Uses DashMap (lock-free concurrent HashMap) for O(1) lookups.
/// Each user has exactly 1 WebSocket connection.
pub struct WsManager {
    /// Map of user_id → sender channel
    connections: Arc<DashMap<Uuid, WsSender>>,
    config: Arc<AppConfig>,
}

impl WsManager {
    pub fn new(config: Arc<AppConfig>) -> Self {
        Self {
            connections: Arc::new(DashMap::new()),
            config,
        }
    }

    /// Get the number of active connections.
    pub fn connection_count(&self) -> usize {
        self.connections.len()
    }

    /// Check if a user is connected.
    pub fn is_connected(&self, user_id: &Uuid) -> bool {
        self.connections.contains_key(user_id)
    }

    /// Register a new WebSocket connection for a user.
    /// If user already has a connection, the old one is replaced (1 user = 1 connection).
    pub fn register(&self, user_id: Uuid, sender: WsSender) {
        if let Some(old_sender) = self.connections.insert(user_id, sender) {
            // Close the old connection gracefully
            let _ = old_sender.send(WsServerMessage::Error {
                message: "Connection replaced by new session".to_string(),
            });
            info!(user_id = %user_id, "Replaced existing WebSocket connection");
        } else {
            info!(user_id = %user_id, "New WebSocket connection registered");
        }
    }

    /// Remove a user's WebSocket connection.
    pub fn unregister(&self, user_id: &Uuid) {
        if self.connections.remove(user_id).is_some() {
            info!(user_id = %user_id, "WebSocket connection unregistered");
        }
    }

    /// Send a message to a specific user.
    pub fn send_to_user(&self, user_id: &Uuid, message: WsServerMessage) -> bool {
        if let Some(sender) = self.connections.get(user_id) {
            match sender.send(message) {
                Ok(_) => true,
                Err(e) => {
                    warn!(user_id = %user_id, "Failed to send WS message: {}", e);
                    self.connections.remove(user_id);
                    false
                }
            }
        } else {
            debug!(user_id = %user_id, "User not connected via WebSocket");
            false
        }
    }

    /// Broadcast a message to all connected users.
    pub fn broadcast(&self, message: WsServerMessage) {
        let mut failed_ids = Vec::new();

        for entry in self.connections.iter() {
            if entry.send(message.clone()).is_err() {
                failed_ids.push(*entry.key());
            }
        }

        // Clean up failed connections
        for id in failed_ids {
            self.connections.remove(&id);
        }
    }

    /// Get a reference to the connections map.
    pub fn connections(&self) -> Arc<DashMap<Uuid, WsSender>> {
        self.connections.clone()
    }
}

/// Handle a WebSocket connection for a single user.
/// Implements heartbeat (ping/pong) and message routing.
pub async fn handle_ws_connection(
    mut session: actix_ws::Session,
    mut msg_stream: actix_ws::MessageStream,
    user_id: Uuid,
    ws_manager: web::Data<WsManager>,
    config: web::Data<AppConfig>,
) {
    let heartbeat_interval = Duration::from_secs(config.websocket.heartbeat_interval);
    let client_timeout = Duration::from_secs(config.websocket.client_timeout);

    // Create mpsc channel for this user
    let (tx, mut rx) = mpsc::unbounded_channel::<WsServerMessage>();

    // Register this connection
    ws_manager.register(user_id, tx);

    // Send connected message
    let connected_msg = WsServerMessage::Connected {
        user_id: user_id.to_string(),
        server_time: chrono::Utc::now().timestamp(),
    };
    let _ = session.text(serde_json::to_string(&connected_msg).unwrap_or_default()).await;

    let mut last_heartbeat = Instant::now();
    let mut heartbeat_timer = interval(heartbeat_interval);

    loop {
        tokio::select! {
            // Handle incoming WebSocket messages from client
            Some(msg) = msg_stream.next() => {
                match msg {
                    Ok(actix_ws::Message::Text(text)) => {
                        last_heartbeat = Instant::now();
                        handle_client_message(&mut session, &text, &user_id).await;
                    }
                    Ok(actix_ws::Message::Ping(bytes)) => {
                        last_heartbeat = Instant::now();
                        let _ = session.pong(&bytes).await;
                    }
                    Ok(actix_ws::Message::Pong(_)) => {
                        last_heartbeat = Instant::now();
                    }
                    Ok(actix_ws::Message::Close(reason)) => {
                        info!(user_id = %user_id, "WebSocket closed by client: {:?}", reason);
                        break;
                    }
                    Err(e) => {
                        error!(user_id = %user_id, "WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }

            // Handle outgoing messages to client (from server/other services)
            Some(server_msg) = rx.recv() => {
                match serde_json::to_string(&server_msg) {
                    Ok(json) => {
                        if session.text(json).await.is_err() {
                            break;
                        }
                    }
                    Err(e) => {
                        error!("Failed to serialize WS message: {}", e);
                    }
                }
            }

            // Heartbeat tick
            _ = heartbeat_timer.tick() => {
                if Instant::now().duration_since(last_heartbeat) > client_timeout {
                    warn!(user_id = %user_id, "WebSocket client timeout, disconnecting");
                    break;
                }
                let _ = session.ping(b"").await;
            }
        }
    }

    // Cleanup
    ws_manager.unregister(&user_id);
    let _ = session.close(None).await;
    info!(user_id = %user_id, "WebSocket connection closed");
}

/// Process a message from the client.
async fn handle_client_message(
    session: &mut actix_ws::Session,
    text: &str,
    user_id: &Uuid,
) {
    match serde_json::from_str::<WsClientMessage>(text) {
        Ok(WsClientMessage::Ping) => {
            let pong = WsServerMessage::Pong {
                server_time: chrono::Utc::now().timestamp(),
            };
            let _ = session.text(serde_json::to_string(&pong).unwrap_or_default()).await;
        }
        Ok(WsClientMessage::Subscribe { channel }) => {
            debug!(user_id = %user_id, channel = %channel, "User subscribed to channel");
        }
        Ok(WsClientMessage::Unsubscribe { channel }) => {
            debug!(user_id = %user_id, channel = %channel, "User unsubscribed from channel");
        }
        Err(e) => {
            warn!(user_id = %user_id, "Invalid WS message: {}", e);
            let error_msg = WsServerMessage::Error {
                message: format!("Invalid message format: {}", e),
            };
            let _ = session.text(serde_json::to_string(&error_msg).unwrap_or_default()).await;
        }
    }
}
