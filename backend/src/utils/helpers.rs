use rand::Rng;

/// Generate a random 6-digit OTP.
pub fn generate_otp() -> String {
    let mut rng = rand::thread_rng();
    let otp: u32 = rng.gen_range(100000..999999);
    otp.to_string()
}

/// Sanitize email by trimming and lowercasing.
pub fn sanitize_email(email: &str) -> String {
    email.trim().to_lowercase()
}

/// Truncate a string to max length with ellipsis.
pub fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len.saturating_sub(3)])
    }
}

/// Validate that a file is an image based on content type.
pub fn is_valid_image_type(content_type: &str) -> bool {
    matches!(
        content_type,
        "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/heic" | "image/heif"
    )
}

/// Calculate file size in MB from bytes.
pub fn bytes_to_mb(bytes: usize) -> f64 {
    bytes as f64 / (1024.0 * 1024.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_otp() {
        let otp = generate_otp();
        assert_eq!(otp.len(), 6);
        assert!(otp.chars().all(|c| c.is_numeric()));
    }

    #[test]
    fn test_sanitize_email() {
        assert_eq!(sanitize_email("  Test@EMAIL.com  "), "test@email.com");
    }

    #[test]
    fn test_truncate() {
        assert_eq!(truncate("Hello World", 5), "He...");
        assert_eq!(truncate("Hi", 5), "Hi");
    }

    #[test]
    fn test_is_valid_image_type() {
        assert!(is_valid_image_type("image/jpeg"));
        assert!(is_valid_image_type("image/png"));
        assert!(!is_valid_image_type("application/pdf"));
    }

    #[test]
    fn test_bytes_to_mb() {
        assert!((bytes_to_mb(1048576) - 1.0).abs() < f64::EPSILON);
    }
}
