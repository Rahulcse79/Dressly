use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// Clothing category enumeration.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "clothing_category", rename_all = "lowercase")]
pub enum ClothingCategory {
    Top,
    Bottom,
    Dress,
    Outerwear,
    Shoes,
    Accessory,
    Bag,
    Jewelry,
    Other,
}

/// Season enumeration for wardrobe items.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "season_type", rename_all = "lowercase")]
pub enum Season {
    Spring,
    Summer,
    Autumn,
    Winter,
    AllSeason,
}

/// Wardrobe item model.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WardrobeItem {
    pub id: Uuid,
    pub user_id: Uuid,
    pub image_url: String,
    pub category: ClothingCategory,
    pub color: Option<String>,
    pub brand: Option<String>,
    pub occasion_tags: Option<serde_json::Value>,
    pub season: Option<Season>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to add a wardrobe item.
#[derive(Debug, Deserialize, Validate)]
pub struct AddWardrobeItemRequest {
    pub category: ClothingCategory,
    #[validate(length(max = 50))]
    pub color: Option<String>,
    #[validate(length(max = 100))]
    pub brand: Option<String>,
    pub occasion_tags: Option<Vec<String>>,
    pub season: Option<Season>,
    pub metadata: Option<serde_json::Value>,
}

/// Request to update a wardrobe item.
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateWardrobeItemRequest {
    pub category: Option<ClothingCategory>,
    #[validate(length(max = 50))]
    pub color: Option<String>,
    #[validate(length(max = 100))]
    pub brand: Option<String>,
    pub occasion_tags: Option<Vec<String>>,
    pub season: Option<Season>,
    pub metadata: Option<serde_json::Value>,
}

/// Paginated list query parameters.
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub category: Option<ClothingCategory>,
    pub season: Option<Season>,
}

/// Paginated response wrapper.
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub page: u32,
    pub per_page: u32,
    pub total: i64,
    pub total_pages: u32,
}
