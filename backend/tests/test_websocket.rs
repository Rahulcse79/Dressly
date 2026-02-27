// ─── WebSocket Manager Tests ────────────────────────────────────────────────
// Tests for WsManager: connection registry, send, broadcast, message types.

mod common;

#[cfg(test)]
mod ws_manager_tests {
    use super::common;
    use dressly_backend::services::websocket::*;
    use tokio::sync::mpsc;
    use uuid::Uuid;

    fn ws_manager() -> WsManager {
        WsManager::new(common::test_config())
    }

    // ── Connection Management ───────────────────────────────────

    #[test]
    fn test_initial_connection_count_zero() {
        let mgr = ws_manager();
        assert_eq!(mgr.connection_count(), 0);
    }

    #[test]
    fn test_register_user_increases_count() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, _rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);
        assert_eq!(mgr.connection_count(), 1);
    }

    #[test]
    fn test_register_multiple_users() {
        let mgr = ws_manager();
        for _ in 0..100 {
            let (tx, _rx) = mpsc::unbounded_channel();
            mgr.register(Uuid::new_v4(), tx);
        }
        assert_eq!(mgr.connection_count(), 100);
    }

    #[test]
    fn test_register_replaces_existing_connection() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();

        let (tx1, _rx1) = mpsc::unbounded_channel();
        mgr.register(user_id, tx1);
        assert_eq!(mgr.connection_count(), 1);

        let (tx2, _rx2) = mpsc::unbounded_channel();
        mgr.register(user_id, tx2);
        assert_eq!(mgr.connection_count(), 1, "Same user should replace, not add");
    }

    #[test]
    fn test_unregister_user() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, _rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);
        assert_eq!(mgr.connection_count(), 1);

        mgr.unregister(&user_id);
        assert_eq!(mgr.connection_count(), 0);
    }

    #[test]
    fn test_unregister_nonexistent_user() {
        let mgr = ws_manager();
        mgr.unregister(&Uuid::new_v4());
        assert_eq!(mgr.connection_count(), 0);
    }

    #[test]
    fn test_is_connected_true() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, _rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);
        assert!(mgr.is_connected(&user_id));
    }

    #[test]
    fn test_is_connected_false() {
        let mgr = ws_manager();
        assert!(!mgr.is_connected(&Uuid::new_v4()));
    }

    #[test]
    fn test_is_connected_after_unregister() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, _rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);
        mgr.unregister(&user_id);
        assert!(!mgr.is_connected(&user_id));
    }

    // ── Send to User ────────────────────────────────────────────

    #[test]
    fn test_send_to_connected_user() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);

        let msg = WsServerMessage::Pong { server_time: 12345 };
        assert!(mgr.send_to_user(&user_id, msg));

        let received = rx.try_recv().unwrap();
        match received {
            WsServerMessage::Pong { server_time } => assert_eq!(server_time, 12345),
            _ => panic!("Expected Pong message"),
        }
    }

    #[test]
    fn test_send_to_disconnected_user() {
        let mgr = ws_manager();
        let msg = WsServerMessage::Pong { server_time: 0 };
        assert!(!mgr.send_to_user(&Uuid::new_v4(), msg));
    }

    #[test]
    fn test_send_to_user_dropped_receiver() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);
        drop(rx); // Drop receiver → sender will fail

        let msg = WsServerMessage::Pong { server_time: 0 };
        assert!(!mgr.send_to_user(&user_id, msg));
        // Should auto-remove failed connection
        assert!(!mgr.is_connected(&user_id));
    }

    #[test]
    fn test_send_multiple_messages() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);

        for i in 0..10 {
            let msg = WsServerMessage::Pong { server_time: i };
            assert!(mgr.send_to_user(&user_id, msg));
        }

        for i in 0..10 {
            let received = rx.try_recv().unwrap();
            match received {
                WsServerMessage::Pong { server_time } => assert_eq!(server_time, i),
                _ => panic!("Expected Pong"),
            }
        }
    }

    // ── Broadcast ───────────────────────────────────────────────

    #[test]
    fn test_broadcast_to_all_users() {
        let mgr = ws_manager();
        let mut receivers = Vec::new();

        for _ in 0..5 {
            let (tx, rx) = mpsc::unbounded_channel();
            mgr.register(Uuid::new_v4(), tx);
            receivers.push(rx);
        }

        let msg = WsServerMessage::ConfigUpdated {
            key: "test".to_string(),
            value: serde_json::json!(42),
        };
        mgr.broadcast(msg);

        for rx in &mut receivers {
            let received = rx.try_recv().unwrap();
            match received {
                WsServerMessage::ConfigUpdated { key, value } => {
                    assert_eq!(key, "test");
                    assert_eq!(value, 42);
                }
                _ => panic!("Expected ConfigUpdated"),
            }
        }
    }

    #[test]
    fn test_broadcast_cleans_up_failed() {
        let mgr = ws_manager();

        // Register with a valid connection
        let user_alive = Uuid::new_v4();
        let (tx_alive, _rx_alive) = mpsc::unbounded_channel();
        mgr.register(user_alive, tx_alive);

        // Register with a dead connection
        let user_dead = Uuid::new_v4();
        let (tx_dead, rx_dead) = mpsc::unbounded_channel();
        mgr.register(user_dead, tx_dead);
        drop(rx_dead);

        assert_eq!(mgr.connection_count(), 2);

        let msg = WsServerMessage::Pong { server_time: 0 };
        mgr.broadcast(msg);

        // Dead connection should be cleaned up
        assert!(!mgr.is_connected(&user_dead));
        assert!(mgr.is_connected(&user_alive));
    }

    #[test]
    fn test_broadcast_to_zero_users() {
        let mgr = ws_manager();
        let msg = WsServerMessage::Pong { server_time: 0 };
        mgr.broadcast(msg); // Should not panic
    }

    // ── Message Type Tests ──────────────────────────────────────

    #[test]
    fn test_ws_server_message_pong_serialization() {
        let msg = WsServerMessage::Pong { server_time: 1700000000 };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"pong\""));
        assert!(json.contains("1700000000"));
    }

    #[test]
    fn test_ws_server_message_notification_serialization() {
        let msg = WsServerMessage::Notification {
            data: serde_json::json!({"title": "Test", "body": "Message"}),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"notification\""));
    }

    #[test]
    fn test_ws_server_message_ai_progress_serialization() {
        let msg = WsServerMessage::AiProgress {
            generation_id: "gen_123".to_string(),
            status: "processing".to_string(),
            progress: 75,
            message: Some("Almost done...".to_string()),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"ai_progress\""));
        assert!(json.contains("\"progress\":75"));
    }

    #[test]
    fn test_ws_server_message_ai_complete_serialization() {
        let msg = WsServerMessage::AiComplete {
            generation_id: "gen_456".to_string(),
            result: serde_json::json!({"style_score": 85, "feedback": "Great combo!"}),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"ai_complete\""));
    }

    #[test]
    fn test_ws_server_message_subscription_updated_serialization() {
        let msg = WsServerMessage::SubscriptionUpdated {
            data: serde_json::json!({"plan": "pro", "active": true}),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"subscription_updated\""));
    }

    #[test]
    fn test_ws_server_message_config_updated_serialization() {
        let msg = WsServerMessage::ConfigUpdated {
            key: "pro_price_inr".to_string(),
            value: serde_json::json!(599),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"config_updated\""));
        assert!(json.contains("pro_price_inr"));
    }

    #[test]
    fn test_ws_server_message_error_serialization() {
        let msg = WsServerMessage::Error {
            message: "Connection closed".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"error\""));
    }

    #[test]
    fn test_ws_server_message_connected_serialization() {
        let msg = WsServerMessage::Connected {
            user_id: "test-user-id".to_string(),
            server_time: 1700000000,
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"connected\""));
        assert!(json.contains("test-user-id"));
    }

    // ── Client Message Deserialization ───────────────────────────

    #[test]
    fn test_ws_client_message_ping_deserialization() {
        let json = r#"{"type":"ping"}"#;
        let msg: WsClientMessage = serde_json::from_str(json).unwrap();
        match msg {
            WsClientMessage::Ping => {}
            _ => panic!("Expected Ping"),
        }
    }

    #[test]
    fn test_ws_client_message_subscribe_deserialization() {
        let json = r#"{"type":"subscribe","channel":"notifications"}"#;
        let msg: WsClientMessage = serde_json::from_str(json).unwrap();
        match msg {
            WsClientMessage::Subscribe { channel } => assert_eq!(channel, "notifications"),
            _ => panic!("Expected Subscribe"),
        }
    }

    #[test]
    fn test_ws_client_message_unsubscribe_deserialization() {
        let json = r#"{"type":"unsubscribe","channel":"ai_updates"}"#;
        let msg: WsClientMessage = serde_json::from_str(json).unwrap();
        match msg {
            WsClientMessage::Unsubscribe { channel } => assert_eq!(channel, "ai_updates"),
            _ => panic!("Expected Unsubscribe"),
        }
    }

    #[test]
    fn test_ws_client_message_invalid_type() {
        let json = r#"{"type":"invalid_type"}"#;
        let result = serde_json::from_str::<WsClientMessage>(json);
        assert!(result.is_err());
    }

    // ── Connections Map ─────────────────────────────────────────

    #[test]
    fn test_connections_map_reference() {
        let mgr = ws_manager();
        let user_id = Uuid::new_v4();
        let (tx, _rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);

        let connections = mgr.connections();
        assert!(connections.contains_key(&user_id));
        assert_eq!(connections.len(), 1);
    }

    // ── Concurrent Access ───────────────────────────────────────

    #[test]
    fn test_concurrent_register_unregister() {
        let mgr = ws_manager();
        let ids: Vec<Uuid> = (0..50).map(|_| Uuid::new_v4()).collect();

        // Register all
        for id in &ids {
            let (tx, _rx) = mpsc::unbounded_channel();
            mgr.register(*id, tx);
        }
        assert_eq!(mgr.connection_count(), 50);

        // Unregister half
        for id in &ids[..25] {
            mgr.unregister(id);
        }
        assert_eq!(mgr.connection_count(), 25);

        // Verify correct half remains
        for id in &ids[..25] {
            assert!(!mgr.is_connected(id));
        }
        for id in &ids[25..] {
            assert!(mgr.is_connected(id));
        }
    }

    // ── Message Clone ───────────────────────────────────────────

    #[test]
    fn test_server_message_clone() {
        let msg = WsServerMessage::Notification {
            data: serde_json::json!({"test": true}),
        };
        let cloned = msg.clone();
        let json1 = serde_json::to_string(&msg).unwrap();
        let json2 = serde_json::to_string(&cloned).unwrap();
        assert_eq!(json1, json2);
    }

    #[test]
    fn test_all_server_message_variants_clone() {
        let messages: Vec<WsServerMessage> = vec![
            WsServerMessage::Pong { server_time: 0 },
            WsServerMessage::Notification { data: serde_json::json!({}) },
            WsServerMessage::AiProgress {
                generation_id: "g".into(),
                status: "s".into(),
                progress: 0,
                message: None,
            },
            WsServerMessage::AiComplete {
                generation_id: "g".into(),
                result: serde_json::json!({}),
            },
            WsServerMessage::SubscriptionUpdated { data: serde_json::json!({}) },
            WsServerMessage::ConfigUpdated { key: "k".into(), value: serde_json::json!({}) },
            WsServerMessage::Error { message: "e".into() },
            WsServerMessage::Connected { user_id: "u".into(), server_time: 0 },
        ];
        for msg in messages {
            let _cloned = msg.clone();
        }
    }
}
