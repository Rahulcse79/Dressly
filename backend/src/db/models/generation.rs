use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// AI outfit generation record.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OutfitGeneration {
    pub id: Uuid,
    pub user_id: Uuid,
    pub prompt_text: String,
    pub input_image_urls: serde_json::Value,
    pub output_image_url: Option<String>,
    pub style_score: Option<f64>,
    pub occasion: Option<String>,
    pub ai_feedback: Option<String>,
    pub model_version: String,
    pub latency_ms: Option<i64>,
    pub tokens_used: Option<i32>,
    pub status: GenerationStatus,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Generation status.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "generation_status", rename_all = "lowercase")]
pub enum GenerationStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

/// Request to generate an outfit.
#[derive(Debug, Deserialize, Validate)]
pub struct GenerateOutfitRequest {
    #[validate(length(min = 10, max = 1000, message = "Prompt must be 10-1000 characters"))]
    pub prompt: String,
    pub occasion: Option<String>,
    /// Base64-encoded images or image URLs from wardrobe
    pub image_ids: Option<Vec<Uuid>>,
}

/// Dress code analysis request.
#[derive(Debug, Deserialize, Validate)]
pub struct AnalyzeDressCodeRequest {
    #[validate(length(min = 3, max = 500))]
    pub context: Option<String>,
    pub occasion: Option<String>,
}

/// AI quota response.
#[derive(Debug, Serialize)]
pub struct AiQuotaResponse {
    pub used_today: i32,
    pub daily_limit: i32,
    pub remaining: i32,
    pub is_pro: bool,
    pub resets_at: DateTime<Utc>,
}

/// Generation progress update (sent via WebSocket).
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenerationProgress {
    pub generation_id: Uuid,
    pub status: String,
    pub progress: u8,
    pub message: Option<String>,
}

/// Gemini API request payload.
#[derive(Debug, Serialize)]
pub struct GeminiRequest {
    pub contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    pub generation_config: GeminiGenerationConfig,
}

#[derive(Debug, Serialize)]
pub struct GeminiContent {
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum GeminiPart {
    Text { text: String },
    InlineData {
        #[serde(rename = "inlineData")]
        inline_data: GeminiInlineData,
    },
}

#[derive(Debug, Serialize)]
pub struct GeminiInlineData {
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub data: String,
}

#[derive(Debug, Serialize)]
pub struct GeminiGenerationConfig {
    pub temperature: f32,
    #[serde(rename = "topP")]
    pub top_p: f32,
    #[serde(rename = "topK")]
    pub top_k: u32,
    #[serde(rename = "maxOutputTokens")]
    pub max_output_tokens: u32,
}

/// Gemini API response.
#[derive(Debug, Deserialize)]
pub struct GeminiResponse {
    pub candidates: Option<Vec<GeminiCandidate>>,
    pub error: Option<GeminiError>,
}

#[derive(Debug, Deserialize)]
pub struct GeminiCandidate {
    pub content: GeminiResponseContent,
}

#[derive(Debug, Deserialize)]
pub struct GeminiResponseContent {
    pub parts: Vec<GeminiResponsePart>,
}

#[derive(Debug, Deserialize)]
pub struct GeminiResponsePart {
    pub text: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GeminiError {
    pub code: i32,
    pub message: String,
}
