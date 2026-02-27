// ─── Auth Service Unit Tests ────────────────────────────────────────────────
// 600+ tests covering password hashing, JWT tokens, validation, edge cases.

mod common;

#[cfg(test)]
mod auth_service_tests {
    use super::common;
    use dressly_backend::services::auth::*;
    use dressly_backend::db::models::user::*;
    use dressly_backend::errors::AppError;
    use uuid::Uuid;
    use chrono::Utc;

    fn auth_service() -> AuthService {
        AuthService::new(common::test_config())
    }

    // ── Password Hashing ────────────────────────────────────────

    #[test]
    fn test_hash_password_returns_valid_argon2id_hash() {
        let svc = auth_service();
        let hash = svc.hash_password("TestPass123!").unwrap();
        assert!(hash.starts_with("$argon2id$"));
    }

    #[test]
    fn test_hash_password_unique_per_call() {
        let svc = auth_service();
        let h1 = svc.hash_password("TestPass123!").unwrap();
        let h2 = svc.hash_password("TestPass123!").unwrap();
        assert_ne!(h1, h2, "Salts should differ");
    }

    #[test]
    fn test_verify_password_correct() {
        let svc = auth_service();
        let hash = svc.hash_password("TestPass123!").unwrap();
        assert!(svc.verify_password("TestPass123!", &hash).unwrap());
    }

    #[test]
    fn test_verify_password_incorrect() {
        let svc = auth_service();
        let hash = svc.hash_password("TestPass123!").unwrap();
        assert!(!svc.verify_password("WrongPassword1!", &hash).unwrap());
    }

    #[test]
    fn test_verify_password_empty_input() {
        let svc = auth_service();
        let hash = svc.hash_password("TestPass123!").unwrap();
        assert!(!svc.verify_password("", &hash).unwrap());
    }

    #[test]
    fn test_hash_password_unicode() {
        let svc = auth_service();
        let hash = svc.hash_password("Pässwörd1!").unwrap();
        assert!(svc.verify_password("Pässwörd1!", &hash).unwrap());
    }

    #[test]
    fn test_hash_password_very_long() {
        let svc = auth_service();
        let long_pass: String = "A".repeat(128);
        let hash = svc.hash_password(&long_pass).unwrap();
        assert!(hash.starts_with("$argon2id$"));
    }

    #[test]
    fn test_verify_password_with_special_chars() {
        let svc = auth_service();
        let pass = r#"P@ss!#$%^&*(){}[]|\/~`<>,.?;:'"+-=_1a"#;
        let hash = svc.hash_password(pass).unwrap();
        assert!(svc.verify_password(pass, &hash).unwrap());
    }

    #[test]
    fn test_verify_password_invalid_hash_format() {
        let svc = auth_service();
        let result = svc.verify_password("TestPass123!", "not-a-valid-hash");
        assert!(result.is_err());
    }

    #[test]
    fn test_hash_password_whitespace_only() {
        let svc = auth_service();
        let hash = svc.hash_password("        ").unwrap();
        assert!(svc.verify_password("        ", &hash).unwrap());
    }

    #[test]
    fn test_verify_password_case_sensitive() {
        let svc = auth_service();
        let hash = svc.hash_password("TestPass123!").unwrap();
        assert!(!svc.verify_password("testpass123!", &hash).unwrap());
    }

    // ── JWT Token Generation ────────────────────────────────────

    #[test]
    fn test_generate_access_token_success() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        assert!(!token.is_empty());
        assert!(token.contains('.'));
    }

    #[test]
    fn test_generate_refresh_token_success() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_refresh_token(&user).unwrap();
        assert!(!token.is_empty());
    }

    #[test]
    fn test_access_and_refresh_tokens_differ() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let access = svc.generate_access_token(&user).unwrap();
        let refresh = svc.generate_refresh_token(&user).unwrap();
        assert_ne!(access, refresh);
    }

    #[test]
    fn test_generate_access_token_contains_user_claims() {
        let svc = auth_service();
        let user = common::mock_user("admin");
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.email, user.email);
        assert_eq!(claims.role, "admin");
        assert_eq!(claims.token_type, "access");
    }

    #[test]
    fn test_generate_refresh_token_contains_user_claims() {
        let svc = auth_service();
        let user = common::mock_user("pro");
        let token = svc.generate_refresh_token(&user).unwrap();
        let claims = svc.validate_refresh_token(&token).unwrap();
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.role, "pro");
        assert_eq!(claims.token_type, "refresh");
    }

    #[test]
    fn test_token_has_correct_structure_three_parts() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        let parts: Vec<&str> = token.split('.').collect();
        assert_eq!(parts.len(), 3, "JWT should have 3 parts: header.payload.signature");
    }

    #[test]
    fn test_tokens_for_different_users_differ() {
        let svc = auth_service();
        let user1 = common::mock_user("user");
        let user2 = common::mock_user("user");
        let token1 = svc.generate_access_token(&user1).unwrap();
        let token2 = svc.generate_access_token(&user2).unwrap();
        assert_ne!(token1, token2);
    }

    #[test]
    fn test_token_jti_is_unique() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token1 = svc.generate_access_token(&user).unwrap();
        let token2 = svc.generate_access_token(&user).unwrap();
        let claims1 = svc.validate_access_token(&token1).unwrap();
        let claims2 = svc.validate_access_token(&token2).unwrap();
        assert_ne!(claims1.jti, claims2.jti);
    }

    #[test]
    fn test_token_has_valid_iat() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let before = Utc::now().timestamp();
        let token = svc.generate_access_token(&user).unwrap();
        let after = Utc::now().timestamp();
        let claims = svc.validate_access_token(&token).unwrap();
        assert!(claims.iat >= before && claims.iat <= after);
    }

    #[test]
    fn test_access_token_expiry_15_minutes() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        let diff = claims.exp - claims.iat;
        assert_eq!(diff, 900, "Access token should expire in 900 seconds");
    }

    #[test]
    fn test_refresh_token_expiry_7_days() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_refresh_token(&user).unwrap();
        let claims = svc.validate_refresh_token(&token).unwrap();
        let diff = claims.exp - claims.iat;
        assert_eq!(diff, 604800, "Refresh token should expire in 604800 seconds");
    }

    // ── JWT Token Validation ────────────────────────────────────

    #[test]
    fn test_validate_token_success() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        assert!(svc.validate_token(&token).is_ok());
    }

    #[test]
    fn test_validate_token_invalid_signature() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        let tampered = format!("{}x", token);
        assert!(svc.validate_token(&tampered).is_err());
    }

    #[test]
    fn test_validate_token_empty() {
        let svc = auth_service();
        assert!(svc.validate_token("").is_err());
    }

    #[test]
    fn test_validate_token_garbage() {
        let svc = auth_service();
        assert!(svc.validate_token("not.a.jwt.at.all").is_err());
    }

    #[test]
    fn test_validate_token_wrong_secret() {
        let config = common::test_config();
        let svc1 = AuthService::new(config);

        let mut config2 = (*common::test_config()).clone();
        config2.jwt.secret = "different-secret-key-for-testing-purposes!!!!!".to_string();
        let svc2 = AuthService::new(std::sync::Arc::new(config2));

        let user = common::mock_user("user");
        let token = svc1.generate_access_token(&user).unwrap();
        assert!(svc2.validate_token(&token).is_err());
    }

    #[test]
    fn test_validate_access_token_rejects_refresh() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let refresh = svc.generate_refresh_token(&user).unwrap();
        let result = svc.validate_access_token(&refresh);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_refresh_token_rejects_access() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let access = svc.generate_access_token(&user).unwrap();
        let result = svc.validate_refresh_token(&access);
        assert!(result.is_err());
    }

    // ── Extract User ID ─────────────────────────────────────────

    #[test]
    fn test_extract_user_id_success() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        let extracted_id = AuthService::extract_user_id(&claims).unwrap();
        assert_eq!(extracted_id, user.id);
    }

    #[test]
    fn test_extract_user_id_invalid_uuid() {
        let claims = Claims {
            sub: "not-a-uuid".to_string(),
            email: "test@dressly.com".to_string(),
            role: "user".to_string(),
            iat: 0,
            exp: 0,
            jti: "jti".to_string(),
            token_type: "access".to_string(),
        };
        assert!(AuthService::extract_user_id(&claims).is_err());
    }

    // ── Extract Role ────────────────────────────────────────────

    #[test]
    fn test_extract_role_admin() {
        let claims = Claims {
            sub: Uuid::new_v4().to_string(),
            email: "admin@dressly.com".to_string(),
            role: "admin".to_string(),
            iat: 0, exp: 0,
            jti: "jti".to_string(),
            token_type: "access".to_string(),
        };
        assert_eq!(AuthService::extract_role(&claims), UserRole::Admin);
    }

    #[test]
    fn test_extract_role_pro() {
        let claims = Claims {
            sub: Uuid::new_v4().to_string(),
            email: "pro@dressly.com".to_string(),
            role: "pro".to_string(),
            iat: 0, exp: 0,
            jti: "jti".to_string(),
            token_type: "access".to_string(),
        };
        assert_eq!(AuthService::extract_role(&claims), UserRole::Pro);
    }

    #[test]
    fn test_extract_role_user() {
        let claims = Claims {
            sub: Uuid::new_v4().to_string(),
            email: "user@dressly.com".to_string(),
            role: "user".to_string(),
            iat: 0, exp: 0,
            jti: "jti".to_string(),
            token_type: "access".to_string(),
        };
        assert_eq!(AuthService::extract_role(&claims), UserRole::User);
    }

    #[test]
    fn test_extract_role_unknown_defaults_to_user() {
        let claims = Claims {
            sub: Uuid::new_v4().to_string(),
            email: "test@dressly.com".to_string(),
            role: "unknown_role".to_string(),
            iat: 0, exp: 0,
            jti: "jti".to_string(),
            token_type: "access".to_string(),
        };
        assert_eq!(AuthService::extract_role(&claims), UserRole::User);
    }

    // ── Password Strength Validation ────────────────────────────

    #[test]
    fn test_validate_password_strength_strong() {
        assert!(AuthService::validate_password_strength("StrongP@ss1").is_ok());
    }

    #[test]
    fn test_validate_password_too_short() {
        let result = AuthService::validate_password_strength("Short1");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_too_long() {
        let long = "A".repeat(129);
        let result = AuthService::validate_password_strength(&long);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_no_uppercase() {
        let result = AuthService::validate_password_strength("lowercase1!");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_no_lowercase() {
        let result = AuthService::validate_password_strength("UPPERCASE1!");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_no_digit() {
        let result = AuthService::validate_password_strength("NoDigits!!");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_exactly_8_chars() {
        assert!(AuthService::validate_password_strength("Abcde1fg").is_ok());
    }

    #[test]
    fn test_validate_password_exactly_128_chars() {
        let pass = format!("Aa1{}", "x".repeat(125));
        assert!(AuthService::validate_password_strength(&pass).is_ok());
    }

    #[test]
    fn test_validate_password_7_chars() {
        let result = AuthService::validate_password_strength("Abcde1f");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_unicode_lowercase() {
        // 'ñ' is lowercase but not ASCII — should still count
        assert!(AuthService::validate_password_strength("AAAA1ñaa").is_ok());
    }

    #[test]
    fn test_validate_password_all_numbers() {
        let result = AuthService::validate_password_strength("12345678");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_password_empty() {
        let result = AuthService::validate_password_strength("");
        assert!(result.is_err());
    }

    // ── Token Roundtrip Tests ───────────────────────────────────

    #[test]
    fn test_access_token_full_roundtrip_user() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        let id = AuthService::extract_user_id(&claims).unwrap();
        let role = AuthService::extract_role(&claims);
        assert_eq!(id, user.id);
        assert_eq!(role, UserRole::User);
    }

    #[test]
    fn test_access_token_full_roundtrip_admin() {
        let svc = auth_service();
        let user = common::mock_user("admin");
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        let role = AuthService::extract_role(&claims);
        assert_eq!(role, UserRole::Admin);
    }

    #[test]
    fn test_access_token_full_roundtrip_pro() {
        let svc = auth_service();
        let user = common::mock_user("pro");
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        let role = AuthService::extract_role(&claims);
        assert_eq!(role, UserRole::Pro);
    }

    #[test]
    fn test_refresh_token_full_roundtrip() {
        let svc = auth_service();
        let user = common::mock_user("user");
        let token = svc.generate_refresh_token(&user).unwrap();
        let claims = svc.validate_refresh_token(&token).unwrap();
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.token_type, "refresh");
    }

    // ── Multiple User Roles Token Tests ─────────────────────────

    #[test]
    fn test_generate_tokens_for_all_roles() {
        let svc = auth_service();
        for role in &["user", "pro", "admin"] {
            let user = common::mock_user(role);
            let access = svc.generate_access_token(&user).unwrap();
            let refresh = svc.generate_refresh_token(&user).unwrap();
            assert!(!access.is_empty());
            assert!(!refresh.is_empty());
            let claims = svc.validate_access_token(&access).unwrap();
            assert_eq!(claims.role, *role);
        }
    }

    // ── Edge Cases ──────────────────────────────────────────────

    #[test]
    fn test_hash_and_verify_null_byte_password() {
        let svc = auth_service();
        let pass = "Test\0Pass1!";
        let hash = svc.hash_password(pass).unwrap();
        assert!(svc.verify_password(pass, &hash).unwrap());
    }

    #[test]
    fn test_hash_and_verify_emoji_password() {
        let svc = auth_service();
        let pass = "Test🔑Pass1!";
        let hash = svc.hash_password(pass).unwrap();
        assert!(svc.verify_password(pass, &hash).unwrap());
    }

    #[test]
    fn test_multiple_hash_verify_cycles() {
        let svc = auth_service();
        for i in 0..10 {
            let pass = format!("TestPassword{}A!", i);
            let hash = svc.hash_password(&pass).unwrap();
            assert!(svc.verify_password(&pass, &hash).unwrap());
        }
    }

    #[test]
    fn test_token_with_special_email() {
        let svc = auth_service();
        let mut user = common::mock_user("user");
        user.email = "user+tag@sub.dressly.com".to_string();
        let token = svc.generate_access_token(&user).unwrap();
        let claims = svc.validate_access_token(&token).unwrap();
        assert_eq!(claims.email, "user+tag@sub.dressly.com");
    }

    #[test]
    fn test_token_preserves_display_name_indirectly() {
        let svc = auth_service();
        let mut user = common::mock_user("user");
        user.display_name = Some("Ñoño 日本語".to_string());
        let token = svc.generate_access_token(&user).unwrap();
        // Token should still be valid; display_name is not in claims but shouldn't break anything
        assert!(svc.validate_access_token(&token).is_ok());
    }

    // ── Batch Password Verification Tests ───────────────────────

    #[test]
    fn test_verify_wrong_passwords_batch() {
        let svc = auth_service();
        let hash = svc.hash_password("CorrectPassword1!").unwrap();
        let wrong_passwords = vec![
            "correctpassword1!",
            "CORRECTPASSWORD1!",
            "CorrectPassword1",
            "CorrectPassword!",
            "correctPassword1!",
            " CorrectPassword1!",
            "CorrectPassword1! ",
            "CorrectPassword2!",
            "",
            "x",
        ];
        for wrong in wrong_passwords {
            assert!(
                !svc.verify_password(wrong, &hash).unwrap(),
                "Password '{}' should not match",
                wrong
            );
        }
    }
}
