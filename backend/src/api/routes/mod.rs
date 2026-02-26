use actix_web::web;

use crate::api::handlers::*;
use crate::api::middleware::AuthMiddleware;

/// Configure all API routes.
/// Organized by resource with proper middleware guards.
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Health checks (no auth)
        .route("/health", web::get().to(health_handler::health_check))
        .route("/health/ready", web::get().to(health_handler::readiness_check))

        // WebSocket (auth via query param)
        .route("/ws", web::get().to(ws_handler::ws_connect))

        // API v1
        .service(
            web::scope("/v1")
                // Auth routes (no auth middleware)
                .service(
                    web::scope("/auth")
                        .route("/register", web::post().to(auth_handler::register))
                        .route("/login", web::post().to(auth_handler::login))
                        .route("/refresh", web::post().to(auth_handler::refresh_token))
                        .route("/logout", web::post().to(auth_handler::logout))
                )

                // User routes (requires auth)
                .service(
                    web::scope("/users")
                        .wrap(AuthMiddleware::any())
                        .route("/me", web::get().to(user_handler::get_me))
                        .route("/me", web::patch().to(user_handler::update_me))
                        .route("/me", web::delete().to(user_handler::delete_me))
                )

                // Wardrobe routes (requires auth)
                .service(
                    web::scope("/wardrobe")
                        .wrap(AuthMiddleware::any())
                        .route("", web::get().to(wardrobe_handler::list_items))
                        .route("", web::post().to(wardrobe_handler::add_item))
                        .route("/{id}", web::get().to(wardrobe_handler::get_item))
                        .route("/{id}", web::patch().to(wardrobe_handler::update_item))
                        .route("/{id}", web::delete().to(wardrobe_handler::delete_item))
                )

                // AI routes (requires auth)
                .service(
                    web::scope("/ai")
                        .wrap(AuthMiddleware::any())
                        .route("/generate", web::post().to(ai_handler::generate_outfit))
                        .route("/generations", web::get().to(ai_handler::list_generations))
                        .route("/generations/{id}", web::get().to(ai_handler::get_generation))
                        .route("/quota", web::get().to(ai_handler::get_quota))
                )

                // Subscription routes (requires auth)
                .service(
                    web::scope("/subscription")
                        .wrap(AuthMiddleware::any())
                        .route("", web::get().to(subscription_handler::get_subscription))
                        .route("/checkout", web::post().to(subscription_handler::checkout))
                        .route("/verify", web::post().to(subscription_handler::verify_payment))
                        .route("/cancel", web::post().to(subscription_handler::cancel_subscription))
                )

                // Notification routes (requires auth)
                .service(
                    web::scope("/notifications")
                        .wrap(AuthMiddleware::any())
                        .route("", web::get().to(notification_handler::list_notifications))
                        .route("/{id}/read", web::patch().to(notification_handler::mark_read))
                        .route("/token", web::post().to(notification_handler::register_token))
                )

                // Admin routes (requires admin role)
                .service(
                    web::scope("/admin")
                        .wrap(AuthMiddleware::admin())
                        .route("/users", web::get().to(admin_handler::list_users))
                        .route("/users/{id}", web::patch().to(admin_handler::update_user))
                        .route("/config", web::get().to(admin_handler::get_config))
                        .route("/config", web::patch().to(admin_handler::update_config))
                        .route("/analytics", web::get().to(admin_handler::get_analytics))
                        .route("/subscriptions", web::get().to(admin_handler::list_subscriptions))
                )
        );
}
