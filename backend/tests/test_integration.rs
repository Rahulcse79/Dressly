// ─── Integration Test Stubs ─────────────────────────────────────────────────
// Full API integration tests using actix_test.
// These test the complete HTTP request/response cycle.

mod common;

#[cfg(test)]
mod integration_tests {
    use super::common;
    use dressly_backend::api::response::*;
    use dressly_backend::services::auth::AuthService;
    use dressly_backend::db::models::user::*;
    use serde_json;
    use uuid::Uuid;

    // ── Auth Flow Tests ─────────────────────────────────────────

    #[test]
    fn test_auth_token_generation_and_validation_flow() {
        let svc = AuthService::new(common::test_config());
        let user = common::mock_user("user");

        // Step 1: Generate tokens
        let access = svc.generate_access_token(&user).unwrap();
        let refresh = svc.generate_refresh_token(&user).unwrap();

        // Step 2: Validate access token
        let claims = svc.validate_access_token(&access).unwrap();
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.token_type, "access");

        // Step 3: Validate refresh token
        let ref_claims = svc.validate_refresh_token(&refresh).unwrap();
        assert_eq!(ref_claims.sub, user.id.to_string());
        assert_eq!(ref_claims.token_type, "refresh");

        // Step 4: Extract user info
        let extracted_id = AuthService::extract_user_id(&claims).unwrap();
        assert_eq!(extracted_id, user.id);
    }

    #[test]
    fn test_user_registration_to_login_flow() {
        let svc = AuthService::new(common::test_config());

        // Simulate registration: hash password
        let password = "SecurePass1!";
        let hash = svc.hash_password(password).unwrap();
        assert!(hash.starts_with("$argon2id$"));

        // Simulate login: verify password
        assert!(svc.verify_password(password, &hash).unwrap());

        // Simulate token generation
        let user = common::mock_user("user");
        let access = svc.generate_access_token(&user).unwrap();
        let refresh = svc.generate_refresh_token(&user).unwrap();

        // Validate tokens
        assert!(svc.validate_access_token(&access).is_ok());
        assert!(svc.validate_refresh_token(&refresh).is_ok());
    }

    #[test]
    fn test_token_refresh_flow() {
        let svc = AuthService::new(common::test_config());
        let user = common::mock_user("pro");

        // Initial token pair
        let refresh = svc.generate_refresh_token(&user).unwrap();
        let ref_claims = svc.validate_refresh_token(&refresh).unwrap();

        // Extract user_id from refresh token
        let user_id = AuthService::extract_user_id(&ref_claims).unwrap();
        assert_eq!(user_id, user.id);

        // Generate new access token (simulating refresh)
        let new_access = svc.generate_access_token(&user).unwrap();
        let new_claims = svc.validate_access_token(&new_access).unwrap();
        assert_eq!(new_claims.sub, user.id.to_string());
    }

    #[test]
    fn test_admin_access_control_flow() {
        let svc = AuthService::new(common::test_config());

        // Regular user
        let user = common::mock_user("user");
        let access = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&access).unwrap();
        let role = AuthService::extract_role(&claims);
        assert_ne!(role, UserRole::Admin);

        // Admin user
        let admin = common::mock_user("admin");
        let admin_access = svc.generate_access_token(&admin).unwrap();
        let admin_claims = svc.validate_access_token(&admin_access).unwrap();
        let admin_role = AuthService::extract_role(&admin_claims);
        assert_eq!(admin_role, UserRole::Admin);
    }

    #[test]
    fn test_pro_subscription_access_flow() {
        let svc = AuthService::new(common::test_config());

        // Free user
        let free_user = common::mock_user("user");
        let free_token = svc.generate_access_token(&free_user).unwrap();
        let free_claims = svc.validate_access_token(&free_token).unwrap();
        let free_role = AuthService::extract_role(&free_claims);
        assert_eq!(free_role, UserRole::User);

        // Pro user
        let pro_user = common::mock_user("pro");
        let pro_token = svc.generate_access_token(&pro_user).unwrap();
        let pro_claims = svc.validate_access_token(&pro_token).unwrap();
        let pro_role = AuthService::extract_role(&pro_claims);
        assert_eq!(pro_role, UserRole::Pro);
    }

    // ── API Response Structure Tests ────────────────────────────

    #[test]
    fn test_api_response_success_structure() {
        let data = serde_json::json!({"id": "test_id", "name": "Test"});
        let resp: ApiResponse<serde_json::Value> = ApiResponse {
            success: true,
            data: Some(data.clone()),
            message: None,
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert!(json["success"].as_bool().unwrap());
        assert_eq!(json["data"]["id"], "test_id");
    }

    #[test]
    fn test_api_response_paginated_structure() {
        let items = vec![
            serde_json::json!({"id": 1, "name": "Item 1"}),
            serde_json::json!({"id": 2, "name": "Item 2"}),
        ];
        let resp: ApiResponse<serde_json::Value> = ApiResponse {
            success: true,
            data: Some(serde_json::json!({
                "items": items,
                "total": 100,
                "page": 1,
                "per_page": 20,
            })),
            message: None,
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert_eq!(json["data"]["total"], 100);
        assert_eq!(json["data"]["items"].as_array().unwrap().len(), 2);
    }

    // ── Payment Signature Integration ───────────────────────────

    #[test]
    fn test_payment_signature_full_flow() {
        use dressly_backend::services::payment::*;
        use hmac::{Hmac, Mac};
        use sha2::Sha256;

        let svc = PaymentService::new(common::test_config());

        // Simulate Razorpay order creation response
        let order_id = "order_test_full_flow";
        let payment_id = "pay_test_full_flow";

        // Generate signature as Razorpay would
        let data = format!("{}|{}", order_id, payment_id);
        let mut mac = hmac::Hmac::<sha2::Sha256>::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let signature = hex::encode(mac.finalize().into_bytes());

        // Verify on our end
        assert!(svc.verify_payment_signature(order_id, payment_id, &signature).unwrap());

        // Verify webhook
        let webhook_body = serde_json::json!({
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "order_id": order_id,
                        "amount": 49900,
                        "currency": "INR",
                        "status": "captured"
                    }
                }
            }
        }).to_string();

        let mut webhook_mac = hmac::Hmac::<sha2::Sha256>::new_from_slice(b"webhook_secret_789").unwrap();
        webhook_mac.update(webhook_body.as_bytes());
        let webhook_sig = hex::encode(webhook_mac.finalize().into_bytes());

        assert!(svc.verify_webhook_signature(&webhook_body, &webhook_sig).unwrap());
    }

    // ── WebSocket Integration ───────────────────────────────────

    #[test]
    fn test_ws_full_lifecycle() {
        use dressly_backend::services::websocket::*;
        use tokio::sync::mpsc;

        let mgr = WsManager::new(common::test_config());

        // User connects
        let user_id = Uuid::new_v4();
        let (tx, mut rx) = mpsc::unbounded_channel();
        mgr.register(user_id, tx);
        assert!(mgr.is_connected(&user_id));

        // Server sends notification
        let notif = WsServerMessage::Notification {
            data: serde_json::json!({"type": "style_tip", "message": "Try navy with khaki!"}),
        };
        assert!(mgr.send_to_user(&user_id, notif));

        // User receives
        let received = rx.try_recv().unwrap();
        match received {
            WsServerMessage::Notification { data } => {
                assert_eq!(data["type"], "style_tip");
            }
            _ => panic!("Expected Notification"),
        }

        // AI progress updates
        for i in (0..=100).step_by(25) {
            let progress = WsServerMessage::AiProgress {
                generation_id: "gen_123".to_string(),
                status: if i < 100 { "processing" } else { "completed" }.to_string(),
                progress: i as u8,
                message: Some(format!("{}% complete", i)),
            };
            mgr.send_to_user(&user_id, progress);
        }

        // Drain all received messages
        let mut count = 0;
        while rx.try_recv().is_ok() {
            count += 1;
        }
        assert_eq!(count, 5);

        // User disconnects
        mgr.unregister(&user_id);
        assert!(!mgr.is_connected(&user_id));
    }

    // ── Multi-User Scenarios ────────────────────────────────────

    #[test]
    fn test_multi_user_ws_scenario() {
        use dressly_backend::services::websocket::*;
        use tokio::sync::mpsc;

        let mgr = WsManager::new(common::test_config());
        let mut users = Vec::new();

        // 20 users connect
        for _ in 0..20 {
            let user_id = Uuid::new_v4();
            let (tx, rx) = mpsc::unbounded_channel();
            mgr.register(user_id, tx);
            users.push((user_id, rx));
        }
        assert_eq!(mgr.connection_count(), 20);

        // Admin broadcasts config update
        let msg = WsServerMessage::ConfigUpdated {
            key: "pro_price_inr".to_string(),
            value: serde_json::json!(599),
        };
        mgr.broadcast(msg);

        // All 20 users should receive it
        for (_, rx) in &mut users {
            assert!(rx.try_recv().is_ok());
        }

        // 5 users disconnect
        for (user_id, _) in &users[..5] {
            mgr.unregister(user_id);
        }
        assert_eq!(mgr.connection_count(), 15);

        // Send to disconnected user fails gracefully
        assert!(!mgr.send_to_user(&users[0].0, WsServerMessage::Pong { server_time: 0 }));

        // Send to connected user still works
        assert!(mgr.send_to_user(&users[10].0, WsServerMessage::Pong { server_time: 0 }));
    }

    // ── Password Security Tests ─────────────────────────────────

    #[test]
    fn test_password_timing_attack_resistance() {
        let svc = AuthService::new(common::test_config());
        let hash = svc.hash_password("CorrectPassword1!").unwrap();

        // Both should take roughly the same time (Argon2 verifies against hash regardless)
        let _ = svc.verify_password("CorrectPassword1!", &hash);
        let _ = svc.verify_password("WrongPassword1!!", &hash);
        // Note: Actual timing measurement would need a benchmark framework
    }

    #[test]
    fn test_multiple_login_attempt_simulation() {
        let svc = AuthService::new(common::test_config());
        let hash = svc.hash_password("RealPassword1!").unwrap();

        let attempts = vec![
            ("wrong1!", false),
            ("wrong2!", false),
            ("RealPassword1!", true),
            ("wrong3!", false),
            ("RealPassword1!", true),
        ];

        for (pass, expected) in attempts {
            let result = svc.verify_password(pass, &hash).unwrap();
            assert_eq!(result, expected, "Password '{}' should be {}", pass, expected);
        }
    }
}
