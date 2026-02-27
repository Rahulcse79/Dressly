// ─── Payment Service Unit Tests ─────────────────────────────────────────────
// Tests for Razorpay integration: signature verification, HMAC, order creation.

mod common;

#[cfg(test)]
mod payment_service_tests {
    use super::common;
    use dressly_backend::services::payment::*;
    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    type HmacSha256 = Hmac<Sha256>;

    fn payment_service() -> PaymentService {
        PaymentService::new(common::test_config())
    }

    // ── Payment Signature Verification ──────────────────────────

    #[test]
    fn test_verify_valid_payment_signature() {
        let svc = payment_service();
        let order_id = "order_test123";
        let payment_id = "pay_test456";

        // Generate correct signature using known secret
        let data = format!("{}|{}", order_id, payment_id);
        let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let signature = hex::encode(mac.finalize().into_bytes());

        assert!(svc.verify_payment_signature(order_id, payment_id, &signature).unwrap());
    }

    #[test]
    fn test_reject_invalid_payment_signature() {
        let svc = payment_service();
        assert!(!svc.verify_payment_signature("order_1", "pay_1", "invalid_signature").unwrap());
    }

    #[test]
    fn test_reject_empty_signature() {
        let svc = payment_service();
        assert!(!svc.verify_payment_signature("order_1", "pay_1", "").unwrap());
    }

    #[test]
    fn test_verify_payment_signature_different_orders() {
        let svc = payment_service();
        let order_id1 = "order_AAA";
        let payment_id = "pay_BBB";
        let order_id2 = "order_CCC";

        let data = format!("{}|{}", order_id1, payment_id);
        let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let sig1 = hex::encode(mac.finalize().into_bytes());

        // Same signature should NOT work for different order
        assert!(!svc.verify_payment_signature(order_id2, payment_id, &sig1).unwrap());
    }

    #[test]
    fn test_verify_payment_signature_tampered_payment_id() {
        let svc = payment_service();
        let order_id = "order_test";
        let payment_id = "pay_original";

        let data = format!("{}|{}", order_id, payment_id);
        let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());

        // Use different payment_id with same signature
        assert!(!svc.verify_payment_signature(order_id, "pay_tampered", &sig).unwrap());
    }

    // ── Webhook Signature Verification ──────────────────────────

    #[test]
    fn test_verify_valid_webhook_signature() {
        let svc = payment_service();
        let body = r#"{"event":"payment.captured","payload":{}}"#;

        let mut mac = HmacSha256::new_from_slice(b"webhook_secret_789").unwrap();
        mac.update(body.as_bytes());
        let signature = hex::encode(mac.finalize().into_bytes());

        assert!(svc.verify_webhook_signature(body, &signature).unwrap());
    }

    #[test]
    fn test_reject_invalid_webhook_signature() {
        let svc = payment_service();
        assert!(!svc.verify_webhook_signature("{}", "bad_sig").unwrap());
    }

    #[test]
    fn test_webhook_signature_body_modification() {
        let svc = payment_service();
        let body = r#"{"event":"payment.captured"}"#;

        let mut mac = HmacSha256::new_from_slice(b"webhook_secret_789").unwrap();
        mac.update(body.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());

        // Modified body should fail
        assert!(!svc.verify_webhook_signature(r#"{"event":"payment.failed"}"#, &sig).unwrap());
    }

    #[test]
    fn test_webhook_signature_empty_body() {
        let svc = payment_service();
        let body = "";
        let mut mac = HmacSha256::new_from_slice(b"webhook_secret_789").unwrap();
        mac.update(body.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());
        assert!(svc.verify_webhook_signature(body, &sig).unwrap());
    }

    #[test]
    fn test_webhook_signature_large_body() {
        let svc = payment_service();
        let body = "x".repeat(100_000);
        let mut mac = HmacSha256::new_from_slice(b"webhook_secret_789").unwrap();
        mac.update(body.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());
        assert!(svc.verify_webhook_signature(&body, &sig).unwrap());
    }

    // ── get_key_id ──────────────────────────────────────────────

    #[test]
    fn test_get_key_id() {
        let svc = payment_service();
        assert_eq!(svc.get_key_id(), "rzp_test_key123");
    }

    #[test]
    fn test_get_key_id_not_empty() {
        let svc = payment_service();
        assert!(!svc.get_key_id().is_empty());
    }

    // ── Signature Consistency Tests ─────────────────────────────

    #[test]
    fn test_same_input_same_signature() {
        let svc = payment_service();
        let order = "order_consistent";
        let payment = "pay_consistent";

        let data = format!("{}|{}", order, payment);
        let mut mac1 = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac1.update(data.as_bytes());
        let sig1 = hex::encode(mac1.finalize().into_bytes());

        let mut mac2 = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac2.update(data.as_bytes());
        let sig2 = hex::encode(mac2.finalize().into_bytes());

        assert_eq!(sig1, sig2);
        assert!(svc.verify_payment_signature(order, payment, &sig1).unwrap());
        assert!(svc.verify_payment_signature(order, payment, &sig2).unwrap());
    }

    #[test]
    fn test_signature_is_hex_encoded() {
        let data = "order_test|pay_test";
        let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());

        // HMAC-SHA256 produces 32 bytes = 64 hex chars
        assert_eq!(sig.len(), 64);
        assert!(sig.chars().all(|c| c.is_ascii_hexdigit()));
    }

    // ── Special Characters in IDs ───────────────────────────────

    #[test]
    fn test_signature_with_special_characters() {
        let svc = payment_service();
        let order = "order_!@#$%^&*()";
        let payment = "pay_<>[]{}|";

        let data = format!("{}|{}", order, payment);
        let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());

        assert!(svc.verify_payment_signature(order, payment, &sig).unwrap());
    }

    #[test]
    fn test_signature_with_unicode_ids() {
        let svc = payment_service();
        let order = "order_日本語";
        let payment = "pay_中文";

        let data = format!("{}|{}", order, payment);
        let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
        mac.update(data.as_bytes());
        let sig = hex::encode(mac.finalize().into_bytes());

        assert!(svc.verify_payment_signature(order, payment, &sig).unwrap());
    }

    // ── Multiple Verifications ──────────────────────────────────

    #[test]
    fn test_batch_payment_verification() {
        let svc = payment_service();
        for i in 0..50 {
            let order = format!("order_{}", i);
            let payment = format!("pay_{}", i);
            let data = format!("{}|{}", order, payment);
            let mut mac = HmacSha256::new_from_slice(b"rzp_test_secret456").unwrap();
            mac.update(data.as_bytes());
            let sig = hex::encode(mac.finalize().into_bytes());
            assert!(
                svc.verify_payment_signature(&order, &payment, &sig).unwrap(),
                "Failed at iteration {}",
                i
            );
        }
    }
}
