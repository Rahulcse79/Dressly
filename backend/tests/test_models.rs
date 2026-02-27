// ─── Model & Data Structure Tests ───────────────────────────────────────────
// Tests for all DB models, enums, serialization, validation, and DTOs.

#[cfg(test)]
mod model_tests {
    use dressly_backend::db::models::user::*;
    use dressly_backend::db::models::wardrobe::*;
    use dressly_backend::db::models::generation::*;
    use dressly_backend::db::models::subscription::*;
    use dressly_backend::db::models::payment::*;
    use dressly_backend::db::models::notification::*;
    use dressly_backend::db::models::admin_config::*;
    use dressly_backend::db::models::session::*;
    use chrono::Utc;
    use uuid::Uuid;

    // ── User Role Tests ─────────────────────────────────────────

    #[test]
    fn test_user_role_default_is_user() {
        assert_eq!(UserRole::default(), UserRole::User);
    }

    #[test]
    fn test_user_role_equality() {
        assert_eq!(UserRole::Admin, UserRole::Admin);
        assert_eq!(UserRole::Pro, UserRole::Pro);
        assert_eq!(UserRole::User, UserRole::User);
    }

    #[test]
    fn test_user_role_inequality() {
        assert_ne!(UserRole::Admin, UserRole::User);
        assert_ne!(UserRole::Pro, UserRole::Admin);
        assert_ne!(UserRole::User, UserRole::Pro);
    }

    #[test]
    fn test_user_role_clone() {
        let role = UserRole::Admin;
        let cloned = role.clone();
        assert_eq!(role, cloned);
    }

    #[test]
    fn test_user_role_debug_format() {
        assert_eq!(format!("{:?}", UserRole::Admin), "Admin");
        assert_eq!(format!("{:?}", UserRole::Pro), "Pro");
        assert_eq!(format!("{:?}", UserRole::User), "User");
    }

    #[test]
    fn test_user_role_serialization() {
        let json = serde_json::to_string(&UserRole::Admin).unwrap();
        assert_eq!(json, "\"Admin\"");
    }

    #[test]
    fn test_user_role_deserialization() {
        let role: UserRole = serde_json::from_str("\"Pro\"").unwrap();
        assert_eq!(role, UserRole::Pro);
    }

    // ── User Model Tests ────────────────────────────────────────

    #[test]
    fn test_user_password_hash_not_serialized() {
        let user = User {
            id: Uuid::new_v4(),
            email: "test@dressly.com".to_string(),
            password_hash: "secret_hash".to_string(),
            role: UserRole::User,
            is_verified: false,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let json = serde_json::to_string(&user).unwrap();
        assert!(!json.contains("secret_hash"), "Password hash should be skipped during serialization");
    }

    #[test]
    fn test_user_with_profile_serialization() {
        let user = UserWithProfile {
            id: Uuid::new_v4(),
            email: "test@dressly.com".to_string(),
            role: UserRole::Pro,
            is_verified: true,
            is_active: true,
            display_name: Some("Test User".to_string()),
            avatar_url: None,
            gender: Some("male".to_string()),
            body_type: None,
            style_preferences: Some(serde_json::json!(["casual", "sporty"])),
            color_preferences: None,
            created_at: Utc::now(),
        };
        let json = serde_json::to_value(&user).unwrap();
        assert_eq!(json["email"], "test@dressly.com");
        assert_eq!(json["role"], "Pro");
        assert_eq!(json["display_name"], "Test User");
        assert!(json["avatar_url"].is_null());
    }

    // ── RegisterRequest Validation Tests ────────────────────────

    #[test]
    fn test_register_request_deserialization() {
        let json = r#"{"email":"user@dressly.com","password":"Test1234!","display_name":"John"}"#;
        let req: RegisterRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.email, "user@dressly.com");
        assert_eq!(req.display_name, Some("John".to_string()));
    }

    #[test]
    fn test_register_request_without_display_name() {
        let json = r#"{"email":"user@dressly.com","password":"Test1234!"}"#;
        let req: RegisterRequest = serde_json::from_str(json).unwrap();
        assert!(req.display_name.is_none());
    }

    #[test]
    fn test_login_request_deserialization() {
        let json = r#"{"email":"user@dressly.com","password":"Test1234!"}"#;
        let req: LoginRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.email, "user@dressly.com");
        assert!(req.device_id.is_none());
    }

    #[test]
    fn test_login_request_with_all_fields() {
        let json = r#"{"email":"user@dressly.com","password":"Test1234!","device_id":"abc123","fcm_token":"token","platform":"ios"}"#;
        let req: LoginRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.device_id, Some("abc123".to_string()));
        assert_eq!(req.fcm_token, Some("token".to_string()));
        assert_eq!(req.platform, Some("ios".to_string()));
    }

    #[test]
    fn test_token_response_serialization() {
        let resp = TokenResponse {
            access_token: "access.token.here".to_string(),
            refresh_token: "refresh.token.here".to_string(),
            expires_in: 900,
            token_type: "Bearer".to_string(),
            user: UserWithProfile {
                id: Uuid::new_v4(),
                email: "test@dressly.com".to_string(),
                role: UserRole::User,
                is_verified: true,
                is_active: true,
                display_name: None,
                avatar_url: None,
                gender: None,
                body_type: None,
                style_preferences: None,
                color_preferences: None,
                created_at: Utc::now(),
            },
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert_eq!(json["token_type"], "Bearer");
        assert_eq!(json["expires_in"], 900);
    }

    // ── Clothing Category Tests ─────────────────────────────────

    #[test]
    fn test_clothing_category_all_variants() {
        let categories = vec![
            ClothingCategory::Top,
            ClothingCategory::Bottom,
            ClothingCategory::Dress,
            ClothingCategory::Outerwear,
            ClothingCategory::Shoes,
            ClothingCategory::Accessory,
            ClothingCategory::Bag,
            ClothingCategory::Jewelry,
            ClothingCategory::Other,
        ];
        assert_eq!(categories.len(), 9);
    }

    #[test]
    fn test_clothing_category_serialization() {
        let cat = ClothingCategory::Outerwear;
        let json = serde_json::to_string(&cat).unwrap();
        assert_eq!(json, "\"Outerwear\"");
    }

    #[test]
    fn test_clothing_category_equality() {
        assert_eq!(ClothingCategory::Top, ClothingCategory::Top);
        assert_ne!(ClothingCategory::Top, ClothingCategory::Bottom);
    }

    // ── Season Tests ────────────────────────────────────────────

    #[test]
    fn test_season_all_variants() {
        let seasons = vec![
            Season::Spring,
            Season::Summer,
            Season::Autumn,
            Season::Winter,
            Season::AllSeason,
        ];
        assert_eq!(seasons.len(), 5);
    }

    #[test]
    fn test_season_serialization() {
        let s = Season::AllSeason;
        let json = serde_json::to_string(&s).unwrap();
        assert_eq!(json, "\"AllSeason\"");
    }

    // ── Wardrobe Item Tests ─────────────────────────────────────

    #[test]
    fn test_wardrobe_item_serialization() {
        let item = WardrobeItem {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            image_url: "https://cdn.dressly.com/images/test.jpg".to_string(),
            category: ClothingCategory::Top,
            color: Some("Navy Blue".to_string()),
            brand: Some("Nike".to_string()),
            occasion_tags: Some(serde_json::json!(["casual", "sport"])),
            season: Some(Season::Summer),
            metadata: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let json = serde_json::to_value(&item).unwrap();
        assert_eq!(json["color"], "Navy Blue");
        assert_eq!(json["brand"], "Nike");
    }

    #[test]
    fn test_add_wardrobe_item_request_deserialization() {
        let json = r#"{"category":"Top","color":"Red","brand":"Adidas","season":"Summer"}"#;
        let req: AddWardrobeItemRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.category, ClothingCategory::Top);
        assert_eq!(req.color, Some("Red".to_string()));
    }

    #[test]
    fn test_add_wardrobe_item_minimal() {
        let json = r#"{"category":"Other"}"#;
        let req: AddWardrobeItemRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.category, ClothingCategory::Other);
        assert!(req.color.is_none());
        assert!(req.brand.is_none());
    }

    // ── Generation Model Tests ──────────────────────────────────

    #[test]
    fn test_generation_status_all_variants() {
        let statuses = vec![
            GenerationStatus::Pending,
            GenerationStatus::Processing,
            GenerationStatus::Completed,
            GenerationStatus::Failed,
        ];
        assert_eq!(statuses.len(), 4);
    }

    #[test]
    fn test_generation_status_equality() {
        assert_eq!(GenerationStatus::Pending, GenerationStatus::Pending);
        assert_ne!(GenerationStatus::Pending, GenerationStatus::Completed);
    }

    #[test]
    fn test_generate_outfit_request_deserialization() {
        let json = r#"{"prompt":"Create a summer casual outfit","occasion":"casual"}"#;
        let req: GenerateOutfitRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.prompt, "Create a summer casual outfit");
        assert_eq!(req.occasion, Some("casual".to_string()));
    }

    #[test]
    fn test_ai_quota_response_serialization() {
        let resp = AiQuotaResponse {
            used_today: 3,
            daily_limit: 5,
            remaining: 2,
            is_pro: false,
            resets_at: Utc::now(),
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert_eq!(json["used_today"], 3);
        assert_eq!(json["remaining"], 2);
    }

    // ── Subscription Model Tests ────────────────────────────────

    #[test]
    fn test_plan_type_variants() {
        assert_eq!(PlanType::Free, PlanType::Free);
        assert_ne!(PlanType::Free, PlanType::Pro);
    }

    #[test]
    fn test_subscription_status_all_variants() {
        let statuses = vec![
            SubscriptionStatus::Active,
            SubscriptionStatus::Cancelled,
            SubscriptionStatus::Expired,
            SubscriptionStatus::Pending,
        ];
        assert_eq!(statuses.len(), 4);
    }

    #[test]
    fn test_checkout_request_deserialization() {
        let json = r#"{"plan":"Pro"}"#;
        let req: CheckoutRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.plan, PlanType::Pro);
    }

    #[test]
    fn test_verify_payment_request_deserialization() {
        let json = r#"{"razorpay_order_id":"order_123","razorpay_payment_id":"pay_456","razorpay_signature":"sig_789"}"#;
        let req: VerifyPaymentRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.razorpay_order_id, "order_123");
        assert_eq!(req.razorpay_payment_id, "pay_456");
    }

    #[test]
    fn test_subscription_response_serialization() {
        let resp = SubscriptionResponse {
            subscription: None,
            is_pro: false,
            days_remaining: None,
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert!(!json["is_pro"].as_bool().unwrap());
    }

    // ── Payment Model Tests ─────────────────────────────────────

    #[test]
    fn test_payment_status_all_variants() {
        let statuses = vec![
            PaymentStatus::Created,
            PaymentStatus::Authorized,
            PaymentStatus::Captured,
            PaymentStatus::Failed,
            PaymentStatus::Refunded,
        ];
        assert_eq!(statuses.len(), 5);
    }

    #[test]
    fn test_payment_status_equality() {
        assert_eq!(PaymentStatus::Captured, PaymentStatus::Captured);
        assert_ne!(PaymentStatus::Captured, PaymentStatus::Failed);
    }

    #[test]
    fn test_razorpay_order_deserialization() {
        let json = r#"{"id":"order_123","amount":49900,"currency":"INR","status":"created"}"#;
        let order: RazorpayOrder = serde_json::from_str(json).unwrap();
        assert_eq!(order.id, "order_123");
        assert_eq!(order.amount, 49900);
    }

    #[test]
    fn test_razorpay_webhook_payload_deserialization() {
        let json = r#"{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123"}}}}"#;
        let payload: RazorpayWebhookPayload = serde_json::from_str(json).unwrap();
        assert_eq!(payload.event, "payment.captured");
    }

    // ── Notification Model Tests ────────────────────────────────

    #[test]
    fn test_notification_type_all_variants() {
        let types = vec![
            NotificationType::AiGenerationComplete,
            NotificationType::SubscriptionActivated,
            NotificationType::SubscriptionExpiring,
            NotificationType::AdminAnnouncement,
            NotificationType::StyleTip,
            NotificationType::PaymentSuccess,
            NotificationType::PaymentFailed,
        ];
        assert_eq!(types.len(), 7);
    }

    #[test]
    fn test_notification_type_equality() {
        assert_eq!(NotificationType::StyleTip, NotificationType::StyleTip);
        assert_ne!(NotificationType::StyleTip, NotificationType::PaymentSuccess);
    }

    #[test]
    fn test_notification_serialization() {
        let notif = Notification {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            title: "AI Result Ready".to_string(),
            body: "Your outfit generation is complete!".to_string(),
            notification_type: NotificationType::AiGenerationComplete,
            is_read: false,
            data: Some(serde_json::json!({"generation_id": "gen_123"})),
            created_at: Utc::now(),
        };
        let json = serde_json::to_value(&notif).unwrap();
        assert_eq!(json["title"], "AI Result Ready");
        assert!(!json["is_read"].as_bool().unwrap());
    }

    #[test]
    fn test_create_notification_request_deserialization() {
        let json = serde_json::json!({
            "user_id": Uuid::new_v4(),
            "title": "Test",
            "body": "Body",
            "notification_type": "StyleTip",
            "data": null
        });
        let req: CreateNotificationRequest = serde_json::from_value(json).unwrap();
        assert_eq!(req.title, "Test");
        assert_eq!(req.notification_type, NotificationType::StyleTip);
    }

    #[test]
    fn test_register_fcm_token_request_deserialization() {
        let json = r#"{"token":"fcm_token_123","platform":"android","device_id":"device_abc"}"#;
        let req: RegisterFcmTokenRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.token, "fcm_token_123");
        assert_eq!(req.platform, "android");
    }

    // ── Admin Config Tests ──────────────────────────────────────

    #[test]
    fn test_admin_config_constants() {
        assert_eq!(CONFIG_PRO_PRICE_INR, "pro_price_inr");
        assert_eq!(CONFIG_FREE_DAILY_QUOTA, "free_daily_ai_quota");
        assert_eq!(CONFIG_MAINTENANCE_MODE, "maintenance_mode");
        assert_eq!(CONFIG_APP_VERSION_MIN, "app_version_min");
        assert_eq!(CONFIG_ANNOUNCEMENT, "announcement");
    }

    #[test]
    fn test_update_config_request_deserialization() {
        let json = r#"{"configs":[{"key":"pro_price_inr","value":599}]}"#;
        let req: UpdateConfigRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.configs.len(), 1);
        assert_eq!(req.configs[0].key, "pro_price_inr");
    }

    #[test]
    fn test_config_entry_serialization_roundtrip() {
        let entry = ConfigEntry {
            key: "test_key".to_string(),
            value: serde_json::json!(42),
        };
        let json = serde_json::to_string(&entry).unwrap();
        let roundtrip: ConfigEntry = serde_json::from_str(&json).unwrap();
        assert_eq!(roundtrip.key, "test_key");
    }

    // ── Session Model Tests ─────────────────────────────────────

    #[test]
    fn test_user_session_serialization() {
        let session = UserSession {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            device_id: Some("device123".to_string()),
            fcm_token: Some("fcm_token".to_string()),
            platform: Some("ios".to_string()),
            app_version: Some("1.0.0".to_string()),
            ip_address: Some("192.168.1.1".to_string()),
            user_agent: Some("Dressly/1.0 iOS".to_string()),
            last_active_at: Utc::now(),
            created_at: Utc::now(),
        };
        let json = serde_json::to_value(&session).unwrap();
        assert_eq!(json["platform"], "ios");
        assert_eq!(json["app_version"], "1.0.0");
    }

    // ── Gemini Model Tests ──────────────────────────────────────

    #[test]
    fn test_gemini_request_serialization() {
        let req = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart::Text {
                    text: "Analyze this outfit".to_string(),
                }],
            }],
            generation_config: GeminiGenerationConfig {
                temperature: 0.7,
                top_p: 0.95,
                top_k: 40,
                max_output_tokens: 2048,
            },
        };
        let json = serde_json::to_value(&req).unwrap();
        assert_eq!(json["generationConfig"]["temperature"], 0.7);
        assert_eq!(json["generationConfig"]["max_output_tokens"], 2048);
    }

    #[test]
    fn test_gemini_part_text_serialization() {
        let part = GeminiPart::Text { text: "Hello".to_string() };
        let json = serde_json::to_value(&part).unwrap();
        assert_eq!(json["text"], "Hello");
    }

    #[test]
    fn test_gemini_part_inline_data_serialization() {
        let part = GeminiPart::InlineData {
            inline_data: GeminiInlineData {
                mime_type: "image/jpeg".to_string(),
                data: "base64data".to_string(),
            },
        };
        let json = serde_json::to_value(&part).unwrap();
        assert_eq!(json["inlineData"]["mimeType"], "image/jpeg");
    }

    // ── FCM Model Tests ─────────────────────────────────────────

    #[test]
    fn test_fcm_message_serialization() {
        let msg = FcmMessage {
            message: FcmMessageBody {
                token: "fcm_device_token".to_string(),
                notification: FcmNotification {
                    title: "New Outfit".to_string(),
                    body: "Your AI outfit is ready!".to_string(),
                },
                data: None,
            },
        };
        let json = serde_json::to_value(&msg).unwrap();
        assert_eq!(json["message"]["notification"]["title"], "New Outfit");
    }

    #[test]
    fn test_fcm_message_with_data() {
        let mut data = std::collections::HashMap::new();
        data.insert("generation_id".to_string(), "gen_123".to_string());
        data.insert("type".to_string(), "ai_complete".to_string());

        let msg = FcmMessage {
            message: FcmMessageBody {
                token: "token".to_string(),
                notification: FcmNotification {
                    title: "Test".to_string(),
                    body: "Test body".to_string(),
                },
                data: Some(data),
            },
        };
        let json = serde_json::to_value(&msg).unwrap();
        assert_eq!(json["message"]["data"]["type"], "ai_complete");
    }

    // ── Generation Progress Tests ───────────────────────────────

    #[test]
    fn test_generation_progress_serialization() {
        let progress = GenerationProgress {
            generation_id: Uuid::new_v4(),
            status: "processing".to_string(),
            progress: 50,
            message: Some("Analyzing your wardrobe items...".to_string()),
        };
        let json = serde_json::to_value(&progress).unwrap();
        assert_eq!(json["progress"], 50);
        assert_eq!(json["status"], "processing");
    }

    #[test]
    fn test_generation_progress_clone() {
        let progress = GenerationProgress {
            generation_id: Uuid::new_v4(),
            status: "completed".to_string(),
            progress: 100,
            message: None,
        };
        let cloned = progress.clone();
        assert_eq!(cloned.status, "completed");
        assert_eq!(cloned.progress, 100);
    }
}
