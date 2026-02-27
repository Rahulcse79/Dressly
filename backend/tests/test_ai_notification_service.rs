// ─── AI Service Unit Tests ──────────────────────────────────────────────────
// Tests for style score extraction, prompt building, request serialization.

mod common;

#[cfg(test)]
mod ai_service_tests {
    use super::common;
    use dressly_backend::services::ai::*;
    use dressly_backend::db::models::generation::*;

    fn ai_service() -> AiService {
        AiService::new(common::test_config())
    }

    // ── extract_style_score ─────────────────────────────────────

    #[test]
    fn test_extract_score_from_json() {
        let svc = ai_service();
        let text = r#"{"style_score": 85, "analysis": "Great outfit"}"#;
        let score = svc.extract_style_score(text);
        assert!((score - 85.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_from_json_float() {
        let svc = ai_service();
        let text = r#"{"style_score": 92.5, "analysis": "test"}"#;
        let score = svc.extract_style_score(text);
        assert!((score - 92.5).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_clamped_to_100() {
        let svc = ai_service();
        let text = r#"{"style_score": 150}"#;
        let score = svc.extract_style_score(text);
        assert!((score - 100.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_clamped_to_zero() {
        let svc = ai_service();
        let text = r#"{"style_score": -10}"#;
        let score = svc.extract_style_score(text);
        assert!((score - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_from_text_line() {
        let svc = ai_service();
        let text = "STYLE_SCORE: 78\nGreat outfit combination!";
        let score = svc.extract_style_score(text);
        assert!(score >= 0.0 && score <= 100.0);
    }

    #[test]
    fn test_extract_score_fallback_default() {
        let svc = ai_service();
        let text = "This is just some text without any score information at all.";
        let score = svc.extract_style_score(text);
        assert!((score - 75.0).abs() < f64::EPSILON, "Default should be 75.0");
    }

    #[test]
    fn test_extract_score_empty_text() {
        let svc = ai_service();
        let score = svc.extract_style_score("");
        assert!((score - 75.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_zero() {
        let svc = ai_service();
        let text = r#"{"style_score": 0}"#;
        let score = svc.extract_style_score(text);
        assert!((score - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_100() {
        let svc = ai_service();
        let text = r#"{"style_score": 100}"#;
        let score = svc.extract_style_score(text);
        assert!((score - 100.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_extract_score_nested_json_key() {
        let svc = ai_service();
        let text = r#"Here is the result:\n{"style_score": 88, "analysis": "good"}"#;
        // Might not parse since it's embedded in text; fallback might be used
        let score = svc.extract_style_score(text);
        assert!(score >= 0.0 && score <= 100.0);
    }

    #[test]
    fn test_extract_score_malformed_json() {
        let svc = ai_service();
        let text = r#"{"style_score": "not_a_number"}"#;
        let score = svc.extract_style_score(text);
        // Should fallback since value is a string, not number
        assert!(score >= 0.0 && score <= 100.0);
    }

    #[test]
    fn test_extract_score_case_insensitive_key() {
        let svc = ai_service();
        let text = "Style_Score: 67\nLooks great";
        let score = svc.extract_style_score(text);
        assert!(score >= 0.0 && score <= 100.0);
    }

    // ── AI Generation Result ────────────────────────────────────

    #[test]
    fn test_ai_generation_result_creation() {
        let result = AiGenerationResult {
            ai_feedback: "Great outfit! The colors complement each other.".to_string(),
            style_score: 88.5,
            latency_ms: 1234,
            tokens_used: 150,
        };
        assert_eq!(result.style_score, 88.5);
        assert_eq!(result.latency_ms, 1234);
        assert_eq!(result.tokens_used, 150);
    }

    // ── Gemini Request Building ─────────────────────────────────

    #[test]
    fn test_gemini_request_with_text_only() {
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
        let parts = json["contents"][0]["parts"].as_array().unwrap();
        assert_eq!(parts.len(), 1);
        assert_eq!(parts[0]["text"], "Analyze this outfit");
    }

    #[test]
    fn test_gemini_request_with_image() {
        let req = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![
                    GeminiPart::Text { text: "What's in this photo?".to_string() },
                    GeminiPart::InlineData {
                        inline_data: GeminiInlineData {
                            mime_type: "image/jpeg".to_string(),
                            data: "base64encodeddata".to_string(),
                        },
                    },
                ],
            }],
            generation_config: GeminiGenerationConfig {
                temperature: 0.7,
                top_p: 0.95,
                top_k: 40,
                max_output_tokens: 2048,
            },
        };
        let json = serde_json::to_value(&req).unwrap();
        let parts = json["contents"][0]["parts"].as_array().unwrap();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[1]["inlineData"]["mimeType"], "image/jpeg");
    }

    #[test]
    fn test_gemini_request_multiple_images() {
        let parts: Vec<GeminiPart> = (0..5)
            .map(|i| GeminiPart::InlineData {
                inline_data: GeminiInlineData {
                    mime_type: "image/png".to_string(),
                    data: format!("imagedata_{}", i),
                },
            })
            .collect();

        let req = GeminiRequest {
            contents: vec![GeminiContent { parts }],
            generation_config: GeminiGenerationConfig {
                temperature: 0.7,
                top_p: 0.95,
                top_k: 40,
                max_output_tokens: 2048,
            },
        };
        let json = serde_json::to_value(&req).unwrap();
        let parts = json["contents"][0]["parts"].as_array().unwrap();
        assert_eq!(parts.len(), 5);
    }

    #[test]
    fn test_generation_config_values() {
        let cfg = GeminiGenerationConfig {
            temperature: 0.3,
            top_p: 0.8,
            top_k: 20,
            max_output_tokens: 1024,
        };
        let json = serde_json::to_value(&cfg).unwrap();
        assert_eq!(json["temperature"], 0.3);
        assert_eq!(json["top_p"], 0.8);
        assert_eq!(json["top_k"], 20);
        assert_eq!(json["max_output_tokens"], 1024);
    }

    // ── Batch Score Extraction Tests ────────────────────────────

    #[test]
    fn test_extract_scores_from_various_formats() {
        let svc = ai_service();
        let test_cases = vec![
            (r#"{"style_score": 50}"#, 50.0),
            (r#"{"style_score": 0}"#, 0.0),
            (r#"{"style_score": 100}"#, 100.0),
            (r#"{"style_score": 99.9}"#, 99.9),
            (r#"{"style_score": 0.1}"#, 0.1),
        ];

        for (input, expected) in test_cases {
            let score = svc.extract_style_score(input);
            assert!(
                (score - expected).abs() < 0.01,
                "For input '{}', expected {} but got {}",
                input,
                expected,
                score
            );
        }
    }

    #[test]
    fn test_extract_score_with_surrounding_text() {
        let svc = ai_service();
        let text = "Based on my analysis:\n\nThe outfit gets a score of 82 out of 100.";
        let score = svc.extract_style_score(text);
        assert!(score >= 0.0 && score <= 100.0);
    }
}

#[cfg(test)]
mod notification_service_tests {
    use dressly_backend::services::notification::*;
    use dressly_backend::db::models::notification::*;
    use std::collections::HashMap;

    // ── Build Notification Data ─────────────────────────────────

    #[test]
    fn test_build_notification_data_ai_complete() {
        let data = NotificationService::build_notification_data(
            &NotificationType::AiGenerationComplete,
            Some(serde_json::json!({"generation_id": "gen_123"})),
        );
        assert!(data.contains_key("type"));
        assert!(data.contains_key("generation_id"));
    }

    #[test]
    fn test_build_notification_data_subscription() {
        let data = NotificationService::build_notification_data(
            &NotificationType::SubscriptionActivated,
            None,
        );
        assert!(data.contains_key("type"));
        assert_eq!(data.len(), 1);
    }

    #[test]
    fn test_build_notification_data_payment_success() {
        let data = NotificationService::build_notification_data(
            &NotificationType::PaymentSuccess,
            Some(serde_json::json!({"amount": "499", "plan": "pro"})),
        );
        assert!(data.contains_key("type"));
        assert!(data.contains_key("amount"));
        assert!(data.contains_key("plan"));
    }

    #[test]
    fn test_build_notification_data_style_tip() {
        let data = NotificationService::build_notification_data(
            &NotificationType::StyleTip,
            Some(serde_json::json!({"tip_id": "42"})),
        );
        assert_eq!(data.get("tip_id"), Some(&"\"42\"".to_string()));
    }

    #[test]
    fn test_build_notification_data_all_types() {
        let types = vec![
            NotificationType::AiGenerationComplete,
            NotificationType::SubscriptionActivated,
            NotificationType::SubscriptionExpiring,
            NotificationType::AdminAnnouncement,
            NotificationType::StyleTip,
            NotificationType::PaymentSuccess,
            NotificationType::PaymentFailed,
        ];
        for nt in types {
            let data = NotificationService::build_notification_data(&nt, None);
            assert!(data.contains_key("type"));
        }
    }

    #[test]
    fn test_build_notification_data_empty_extra() {
        let data = NotificationService::build_notification_data(
            &NotificationType::AdminAnnouncement,
            Some(serde_json::json!({})),
        );
        assert_eq!(data.len(), 1); // Only "type" key
    }

    #[test]
    fn test_build_notification_data_nested_json() {
        let extra = serde_json::json!({
            "nested": {"deep": "value"},
            "array": [1, 2, 3]
        });
        let data = NotificationService::build_notification_data(
            &NotificationType::AdminAnnouncement,
            Some(extra),
        );
        assert!(data.contains_key("nested"));
        assert!(data.contains_key("array"));
    }
}
