// ─── Utility & Helper Tests ─────────────────────────────────────────────────
// Extended tests for helper functions, config loading, and API response.

#[cfg(test)]
mod helpers_tests {
    use dressly_backend::utils::helpers::*;

    // ── generate_otp ────────────────────────────────────────────

    #[test]
    fn test_otp_length_is_6() {
        let otp = generate_otp();
        assert_eq!(otp.len(), 6);
    }

    #[test]
    fn test_otp_is_numeric() {
        let otp = generate_otp();
        assert!(otp.chars().all(|c| c.is_ascii_digit()));
    }

    #[test]
    fn test_otp_uniqueness_100_iterations() {
        let mut otps = std::collections::HashSet::new();
        for _ in 0..100 {
            let otp = generate_otp();
            otps.insert(otp);
        }
        // With 6-digit OTPs (899999 possibilities), 100 should virtually all be unique
        assert!(otps.len() > 90, "Expected most OTPs to be unique");
    }

    #[test]
    fn test_otp_within_range() {
        for _ in 0..200 {
            let otp: u32 = generate_otp().parse().unwrap();
            assert!(otp >= 100000 && otp < 999999);
        }
    }

    // ── sanitize_email ──────────────────────────────────────────

    #[test]
    fn test_sanitize_email_lowercase() {
        assert_eq!(sanitize_email("USER@DRESSLY.COM"), "user@dressly.com");
    }

    #[test]
    fn test_sanitize_email_trim() {
        assert_eq!(sanitize_email("  user@dressly.com  "), "user@dressly.com");
    }

    #[test]
    fn test_sanitize_email_mixed() {
        assert_eq!(sanitize_email("  Test.User@Gmail.COM  "), "test.user@gmail.com");
    }

    #[test]
    fn test_sanitize_email_empty() {
        assert_eq!(sanitize_email(""), "");
    }

    #[test]
    fn test_sanitize_email_only_spaces() {
        assert_eq!(sanitize_email("   "), "");
    }

    #[test]
    fn test_sanitize_email_already_clean() {
        assert_eq!(sanitize_email("user@dressly.com"), "user@dressly.com");
    }

    #[test]
    fn test_sanitize_email_tabs_and_newlines() {
        assert_eq!(sanitize_email("\tuser@test.com\n"), "user@test.com");
    }

    #[test]
    fn test_sanitize_email_unicode() {
        assert_eq!(sanitize_email("Ñoño@DRESSLY.com"), "ñoño@dressly.com");
    }

    #[test]
    fn test_sanitize_email_plus_tag() {
        assert_eq!(sanitize_email("User+Tag@GMAIL.com"), "user+tag@gmail.com");
    }

    #[test]
    fn test_sanitize_email_dots_preserved() {
        assert_eq!(sanitize_email("first.last@sub.domain.com"), "first.last@sub.domain.com");
    }

    // ── truncate ────────────────────────────────────────────────

    #[test]
    fn test_truncate_shorter_than_max() {
        assert_eq!(truncate("Hi", 10), "Hi");
    }

    #[test]
    fn test_truncate_exact_length() {
        assert_eq!(truncate("Hello", 5), "Hello");
    }

    #[test]
    fn test_truncate_longer_than_max() {
        assert_eq!(truncate("Hello World", 8), "Hello...");
    }

    #[test]
    fn test_truncate_empty_string() {
        assert_eq!(truncate("", 5), "");
    }

    #[test]
    fn test_truncate_max_zero() {
        assert_eq!(truncate("Hello", 0), "...");
    }

    #[test]
    fn test_truncate_max_one() {
        assert_eq!(truncate("Hello", 1), "...");
    }

    #[test]
    fn test_truncate_max_two() {
        assert_eq!(truncate("Hello", 2), "...");
    }

    #[test]
    fn test_truncate_max_three() {
        assert_eq!(truncate("Hello", 3), "...");
    }

    #[test]
    fn test_truncate_max_four() {
        assert_eq!(truncate("Hello", 4), "H...");
    }

    #[test]
    fn test_truncate_very_long_string() {
        let long = "a".repeat(10000);
        let result = truncate(&long, 100);
        assert_eq!(result.len(), 100);
        assert!(result.ends_with("..."));
    }

    // ── is_valid_image_type ─────────────────────────────────────

    #[test]
    fn test_valid_image_jpeg() {
        assert!(is_valid_image_type("image/jpeg"));
    }

    #[test]
    fn test_valid_image_png() {
        assert!(is_valid_image_type("image/png"));
    }

    #[test]
    fn test_valid_image_webp() {
        assert!(is_valid_image_type("image/webp"));
    }

    #[test]
    fn test_valid_image_gif() {
        assert!(is_valid_image_type("image/gif"));
    }

    #[test]
    fn test_valid_image_heic() {
        assert!(is_valid_image_type("image/heic"));
    }

    #[test]
    fn test_valid_image_heif() {
        assert!(is_valid_image_type("image/heif"));
    }

    #[test]
    fn test_invalid_image_pdf() {
        assert!(!is_valid_image_type("application/pdf"));
    }

    #[test]
    fn test_invalid_image_json() {
        assert!(!is_valid_image_type("application/json"));
    }

    #[test]
    fn test_invalid_image_text() {
        assert!(!is_valid_image_type("text/plain"));
    }

    #[test]
    fn test_invalid_image_video() {
        assert!(!is_valid_image_type("video/mp4"));
    }

    #[test]
    fn test_invalid_image_empty() {
        assert!(!is_valid_image_type(""));
    }

    #[test]
    fn test_invalid_image_svg() {
        assert!(!is_valid_image_type("image/svg+xml"));
    }

    #[test]
    fn test_invalid_image_bmp() {
        assert!(!is_valid_image_type("image/bmp"));
    }

    #[test]
    fn test_invalid_image_tiff() {
        assert!(!is_valid_image_type("image/tiff"));
    }

    #[test]
    fn test_image_type_case_sensitive() {
        assert!(!is_valid_image_type("IMAGE/JPEG"));
        assert!(!is_valid_image_type("Image/Png"));
    }

    // ── bytes_to_mb ─────────────────────────────────────────────

    #[test]
    fn test_bytes_to_mb_zero() {
        assert!((bytes_to_mb(0) - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_bytes_to_mb_one_mb() {
        assert!((bytes_to_mb(1_048_576) - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_bytes_to_mb_half_mb() {
        assert!((bytes_to_mb(524_288) - 0.5).abs() < f64::EPSILON);
    }

    #[test]
    fn test_bytes_to_mb_ten_mb() {
        assert!((bytes_to_mb(10_485_760) - 10.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_bytes_to_mb_one_kb() {
        let result = bytes_to_mb(1024);
        assert!((result - 0.0009765625).abs() < 1e-10);
    }

    #[test]
    fn test_bytes_to_mb_one_byte() {
        let result = bytes_to_mb(1);
        assert!(result > 0.0 && result < 0.001);
    }

    #[test]
    fn test_bytes_to_mb_large_file() {
        // 1 GB
        let result = bytes_to_mb(1_073_741_824);
        assert!((result - 1024.0).abs() < f64::EPSILON);
    }
}

#[cfg(test)]
mod api_response_tests {
    use dressly_backend::api::response::*;

    #[test]
    fn test_api_response_serialization() {
        let resp = ApiResponse {
            success: true,
            data: Some(serde_json::json!({"id": "test"})),
            message: None,
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert!(json["success"].as_bool().unwrap());
        assert!(json.get("message").is_none() || json["message"].is_null());
    }

    #[test]
    fn test_api_response_with_message() {
        let resp = ApiResponse {
            success: true,
            data: Some("created".to_string()),
            message: Some("Resource created successfully".to_string()),
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert_eq!(json["message"], "Resource created successfully");
    }

    #[test]
    fn test_api_response_without_data() {
        let resp: ApiResponse<()> = ApiResponse {
            success: true,
            data: None,
            message: Some("OK".to_string()),
        };
        let json = serde_json::to_value(&resp).unwrap();
        assert!(json["data"].is_null());
    }
}
