use crate::config::AppConfig;
use crate::db::models::generation::*;
use crate::errors::{AppError, AppResult};
use base64::Engine;
use reqwest::Client;
use std::sync::Arc;
use std::time::Instant;
use tracing::{info, error, instrument};

/// AI service for Gemini API integration.
/// Handles outfit generation, dress code analysis, and image processing.
pub struct AiService {
    config: Arc<AppConfig>,
    http_client: Client,
}

impl AiService {
    pub fn new(config: Arc<AppConfig>) -> Self {
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .pool_max_idle_per_host(10)
            .build()
            .expect("Failed to build HTTP client");

        Self { config, http_client }
    }

    /// Generate outfit recommendation using Gemini multimodal API.
    /// Takes text prompt + multiple images → returns AI analysis with style score.
    #[instrument(skip(self, image_data), fields(prompt_len = prompt.len(), image_count = image_data.len()))]
    pub async fn generate_outfit(
        &self,
        prompt: &str,
        image_data: Vec<(String, Vec<u8>)>, // (mime_type, bytes)
        occasion: Option<&str>,
    ) -> AppResult<AiGenerationResult> {
        let start = Instant::now();

        // Build Gemini request with multimodal parts
        let mut parts: Vec<GeminiPart> = Vec::new();

        // Add system prompt for fashion advisory
        let system_prompt = format!(
            "You are Dressly, an expert AI fashion advisor. Analyze the provided clothing items \
             and create the perfect outfit combination. Consider color theory, style matching, \
             body proportions, and the occasion '{}'.\n\n\
             User request: {}\n\n\
             Provide:\n\
             1. STYLE_SCORE (0-100): Rate the outfit combination\n\
             2. OUTFIT_ANALYSIS: Detailed analysis of why items work together\n\
             3. IMPROVEMENTS: Suggestions for improvement\n\
             4. OCCASION_FIT: How well it fits the occasion\n\
             5. COLOR_HARMONY: Analysis of color combinations\n\n\
             Format response as JSON with keys: style_score, analysis, improvements, \
             occasion_fit, color_harmony",
            occasion.unwrap_or("casual"),
            prompt
        );

        parts.push(GeminiPart::Text { text: system_prompt });

        // Add images as inline data
        for (mime_type, bytes) in &image_data {
            let base64_data = base64::engine::general_purpose::STANDARD.encode(bytes);
            parts.push(GeminiPart::InlineData {
                inline_data: GeminiInlineData {
                    mime_type: mime_type.clone(),
                    data: base64_data,
                },
            });
        }

        let request = GeminiRequest {
            contents: vec![GeminiContent { parts }],
            generation_config: GeminiGenerationConfig {
                temperature: 0.7,
                top_p: 0.95,
                top_k: 40,
                max_output_tokens: 2048,
            },
        };

        // Call Gemini API
        let url = format!(
            "{}/models/{}:generateContent?key={}",
            self.config.gemini.api_url,
            self.config.gemini.model,
            self.config.gemini.api_key
        );

        let response = self.http_client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                error!("Gemini API request failed: {}", e);
                AppError::AiServiceError(format!("Failed to contact AI service: {}", e))
            })?;

        let status = response.status();
        if !status.is_success() {
            let error_body = response.text().await.unwrap_or_default();
            error!("Gemini API error ({}): {}", status, error_body);
            return Err(AppError::AiServiceError(format!("AI service returned error: {}", status)));
        }

        let gemini_response: GeminiResponse = response.json().await.map_err(|e| {
            error!("Failed to parse Gemini response: {}", e);
            AppError::AiServiceError("Failed to parse AI response".into())
        })?;

        let latency_ms = start.elapsed().as_millis() as i64;

        // Extract AI response
        let ai_text = gemini_response
            .candidates
            .as_ref()
            .and_then(|c| c.first())
            .and_then(|c| c.content.parts.first())
            .and_then(|p| p.text.as_ref())
            .ok_or_else(|| AppError::AiServiceError("Empty AI response".into()))?;

        // Parse style score from response
        let style_score = self.extract_style_score(ai_text);

        info!(
            style_score = style_score,
            latency_ms = latency_ms,
            "AI generation completed"
        );

        Ok(AiGenerationResult {
            ai_feedback: ai_text.clone(),
            style_score,
            latency_ms,
            tokens_used: 0, // Gemini doesn't always return token count in the same way
        })
    }

    /// Analyze a dress code from a photo.
    #[instrument(skip(self, image_data))]
    pub async fn analyze_dress_code(
        &self,
        image_data: (String, Vec<u8>),
        context: Option<&str>,
        occasion: Option<&str>,
    ) -> AppResult<AiGenerationResult> {
        let prompt = format!(
            "Analyze this outfit photo for dress code compliance. \
             Context: {}. Occasion: {}. \
             Provide: 1) Current dress code rating (0-100), \
             2) What works well, 3) What to improve, \
             4) Alternative suggestions. Format as JSON.",
            context.unwrap_or("general style check"),
            occasion.unwrap_or("everyday")
        );

        self.generate_outfit(&prompt, vec![image_data], occasion).await
    }

    /// Extract numeric style score from AI text response.
    fn extract_style_score(&self, text: &str) -> f64 {
        // Try to parse JSON and extract style_score
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
            if let Some(score) = json.get("style_score").and_then(|v| v.as_f64()) {
                return score.min(100.0).max(0.0);
            }
        }

        // Fallback: look for patterns like "STYLE_SCORE: 85" or "style_score": 85
        for line in text.lines() {
            if line.to_lowercase().contains("style_score") || line.to_lowercase().contains("score") {
                if let Some(num) = line
                    .chars()
                    .filter(|c| c.is_numeric() || *c == '.')
                    .collect::<String>()
                    .parse::<f64>()
                    .ok()
                {
                    return num.min(100.0).max(0.0);
                }
            }
        }

        // Default score
        75.0
    }
}

/// Result from AI generation.
pub struct AiGenerationResult {
    pub ai_feedback: String,
    pub style_score: f64,
    pub latency_ms: i64,
    pub tokens_used: i32,
}
