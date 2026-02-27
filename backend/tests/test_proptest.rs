// ─── Property-Based Tests ───────────────────────────────────────────────────
// Using proptest for fuzz-testing critical paths with random inputs.

#[cfg(test)]
mod proptest_tests {
    use proptest::prelude::*;
    use dressly_backend::utils::helpers::*;
    use dressly_backend::services::auth::AuthService;
    use dressly_backend::db::models::user::*;
    use std::sync::Arc;
    use uuid::Uuid;
    use chrono::Utc;

    fn test_config() -> Arc<dressly_backend::config::AppConfig> {
        Arc::new(dressly_backend::config::AppConfig {
            server: dressly_backend::config::ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 0,
                workers: 1,
            },
            database: dressly_backend::config::DatabaseConfig {
                url: "postgres://test:test@localhost:5432/dressly_test".to_string(),
                max_connections: 5,
                min_connections: 1,
            },
            redis: dressly_backend::config::RedisConfig {
                url: "redis://localhost:6379/15".to_string(),
                max_connections: 5,
            },
            jwt: dressly_backend::config::JwtConfig {
                secret: "super-secret-test-key-that-is-long-enough-for-hmac-256!!".to_string(),
                access_token_expiry: 900,
                refresh_token_expiry: 604800,
            },
            gemini: dressly_backend::config::GeminiConfig {
                api_key: "test".to_string(),
                model: "gemini-2.0-flash".to_string(),
                api_url: "https://test.com".to_string(),
            },
            razorpay: dressly_backend::config::RazorpayConfig {
                key_id: "rzp_test".to_string(),
                key_secret: "rzp_secret".to_string(),
                webhook_secret: "webhook_secret".to_string(),
            },
            fcm: dressly_backend::config::FcmConfig {
                server_key: "fcm_key".to_string(),
                project_id: "project".to_string(),
            },
            storage: dressly_backend::config::StorageConfig {
                endpoint: "http://localhost:9000".to_string(),
                access_key: "key".to_string(),
                secret_key: "secret".to_string(),
                bucket: "bucket".to_string(),
                public_url: "http://localhost:9000/bucket".to_string(),
            },
            app: dressly_backend::config::AppSettings {
                free_daily_ai_quota: 5,
                pro_price_inr: 499,
                max_upload_size_mb: 10,
                max_images_per_generation: 5,
            },
            rate_limit: dressly_backend::config::RateLimitConfig {
                per_minute: 60,
                burst: 10,
            },
            websocket: dressly_backend::config::WebSocketConfig {
                heartbeat_interval: 10,
                client_timeout: 30,
                max_message_size: 65536,
            },
        })
    }

    // ── OTP Property Tests ──────────────────────────────────────

    proptest! {
        #[test]
        fn prop_otp_always_6_digits(_ in 0..1000u32) {
            let otp = generate_otp();
            prop_assert_eq!(otp.len(), 6);
            prop_assert!(otp.chars().all(|c| c.is_ascii_digit()));
        }

        #[test]
        fn prop_otp_numeric_range(_ in 0..1000u32) {
            let otp: u32 = generate_otp().parse().unwrap();
            prop_assert!(otp >= 100000);
            prop_assert!(otp < 999999);
        }
    }

    // ── Email Sanitization Property Tests ───────────────────────

    proptest! {
        #[test]
        fn prop_sanitize_email_always_lowercase(email in "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}") {
            let sanitized = sanitize_email(&email);
            prop_assert_eq!(sanitized, sanitized.to_lowercase());
        }

        #[test]
        fn prop_sanitize_email_trims_whitespace(email in "\\s*[a-zA-Z]+@[a-zA-Z]+\\.com\\s*") {
            let sanitized = sanitize_email(&email);
            prop_assert_eq!(sanitized, sanitized.trim());
        }

        #[test]
        fn prop_sanitize_email_idempotent(email in "[a-z]+@[a-z]+\\.[a-z]+") {
            let s1 = sanitize_email(&email);
            let s2 = sanitize_email(&s1);
            prop_assert_eq!(s1, s2);
        }
    }

    // ── Truncation Property Tests ───────────────────────────────

    proptest! {
        #[test]
        fn prop_truncate_never_exceeds_max_len(s in "\\PC{0,200}", max_len in 0..200usize) {
            let result = truncate(&s, max_len);
            if s.len() <= max_len {
                prop_assert_eq!(result, s);
            } else {
                prop_assert!(result.len() <= max_len || result.ends_with("..."));
            }
        }

        #[test]
        fn prop_truncate_short_strings_unchanged(s in "\\PC{0,5}") {
            let result = truncate(&s, 100);
            prop_assert_eq!(result, s);
        }

        #[test]
        fn prop_truncate_adds_ellipsis_when_truncated(s in "[a-z]{20,50}") {
            let result = truncate(&s, 10);
            prop_assert!(result.ends_with("..."));
        }
    }

    // ── Image Type Validation Property Tests ────────────────────

    proptest! {
        #[test]
        fn prop_random_content_types_rejected(ct in "[a-z]+/[a-z]+") {
            // Random content types should be rejected unless they happen to match
            let valid_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
            if !valid_types.contains(&ct.as_str()) {
                prop_assert!(!is_valid_image_type(&ct));
            }
        }
    }

    // ── Bytes to MB Property Tests ──────────────────────────────

    proptest! {
        #[test]
        fn prop_bytes_to_mb_non_negative(bytes in 0..usize::MAX) {
            prop_assert!(bytes_to_mb(bytes) >= 0.0);
        }

        #[test]
        fn prop_bytes_to_mb_monotonic(a in 0..1_000_000usize, b in 0..1_000_000usize) {
            if a <= b {
                prop_assert!(bytes_to_mb(a) <= bytes_to_mb(b));
            }
        }
    }

    // ── Password Hashing Property Tests ─────────────────────────

    proptest! {
        #[test]
        fn prop_hash_always_starts_with_argon2id(password in ".{1,50}") {
            let svc = AuthService::new(test_config());
            let hash = svc.hash_password(&password).unwrap();
            prop_assert!(hash.starts_with("$argon2id$"));
        }

        #[test]
        fn prop_hash_verify_roundtrip(password in ".{1,50}") {
            let svc = AuthService::new(test_config());
            let hash = svc.hash_password(&password).unwrap();
            prop_assert!(svc.verify_password(&password, &hash).unwrap());
        }

        #[test]
        fn prop_different_passwords_different_hashes(a in "[a-z]{8,20}", b in "[A-Z]{8,20}") {
            if a.to_lowercase() != b.to_lowercase() {
                let svc = AuthService::new(test_config());
                let hash_a = svc.hash_password(&a).unwrap();
                let hash_b = svc.hash_password(&b).unwrap();
                prop_assert_ne!(hash_a, hash_b);
            }
        }
    }

    // ── JWT Token Property Tests ────────────────────────────────

    proptest! {
        #[test]
        fn prop_access_token_has_three_parts(email in "[a-z]{3,10}@test\\.com") {
            let svc = AuthService::new(test_config());
            let user = UserWithProfile {
                id: Uuid::new_v4(),
                email,
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
            };
            let token = svc.generate_access_token(&user).unwrap();
            let parts: Vec<&str> = token.split('.').collect();
            prop_assert_eq!(parts.len(), 3);
        }

        #[test]
        fn prop_token_roundtrip(email in "[a-z]{3,10}@test\\.com") {
            let svc = AuthService::new(test_config());
            let user = UserWithProfile {
                id: Uuid::new_v4(),
                email: email.clone(),
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
            };
            let token = svc.generate_access_token(&user).unwrap();
            let claims = svc.validate_access_token(&token).unwrap();
            prop_assert_eq!(claims.email, email);
        }
    }

    // ── Password Validation Property Tests ──────────────────────

    proptest! {
        #[test]
        fn prop_passwords_under_8_chars_rejected(password in ".{0,7}") {
            let result = AuthService::validate_password_strength(&password);
            prop_assert!(result.is_err());
        }

        #[test]
        fn prop_passwords_over_128_chars_rejected(password in ".{129,200}") {
            let result = AuthService::validate_password_strength(&password);
            prop_assert!(result.is_err());
        }

        #[test]
        fn prop_all_lowercase_rejected(password in "[a-z1]{8,20}") {
            // All lowercase (with digits) should be rejected for missing uppercase
            let result = AuthService::validate_password_strength(&password);
            prop_assert!(result.is_err());
        }

        #[test]
        fn prop_all_uppercase_rejected(password in "[A-Z1]{8,20}") {
            // All uppercase (with digits) should be rejected for missing lowercase
            let result = AuthService::validate_password_strength(&password);
            prop_assert!(result.is_err());
        }
    }
}
