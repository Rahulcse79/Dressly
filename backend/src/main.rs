use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware};
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use dressly_backend::api::routes::configure_routes;
use dressly_backend::config::AppConfig;
use dressly_backend::db;
use dressly_backend::services::ai::AiService;
use dressly_backend::services::auth::AuthService;
use dressly_backend::services::notification::NotificationService;
use dressly_backend::services::payment::PaymentService;
use dressly_backend::services::redis_service::RedisService;
use dressly_backend::services::websocket::WsManager;
use dressly_backend::workers;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // ── Initialize structured logging ───────────────────────────────
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            EnvFilter::new("dressly_backend=debug,actix_web=info")
        }))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    info!("🚀 Starting Dressly Backend Server...");

    // ── Load configuration ──────────────────────────────────────────
    let config = AppConfig::load().expect("Failed to load configuration");
    info!("✅ Configuration loaded");

    // ── Initialize PostgreSQL connection pool ───────────────────────
    let db_pool = db::init_db_pool(&config)
        .await
        .expect("Failed to initialize database pool");

    // ── Initialize Redis ────────────────────────────────────────────
    let redis_service = RedisService::new(&config)
        .expect("Failed to initialize Redis service");
    info!("✅ Redis service initialized");

    // ── Initialize services ─────────────────────────────────────────
    let auth_service = AuthService::new(config.clone());
    let ai_service = AiService::new(config.clone());
    let payment_service = PaymentService::new(config.clone());
    let notification_service = NotificationService::new(config.clone());
    let ws_manager = WsManager::new(config.clone());

    info!("✅ All services initialized");

    // ── Start background workers ────────────────────────────────────
    let worker_pool = Arc::new(db_pool.clone());
    tokio::spawn(async move {
        workers::start_subscription_worker(worker_pool).await;
    });
    info!("✅ Background workers started");

    // ── Configure and start HTTP server ─────────────────────────────
    let server_host = config.server.host.clone();
    let server_port = config.server.port;
    let server_workers = config.server.workers;

    info!(
        "🌐 Server starting on {}:{}  (workers: {})",
        server_host, server_port, server_workers
    );

    HttpServer::new(move || {
        // CORS configuration
        // Note: allow_any_origin() + supports_credentials() violates CORS spec.
        // In production, use .allowed_origin("https://your-app.com")
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            // Global middleware
            .wrap(cors)
            .wrap(tracing_actix_web::TracingLogger::default())

            // Shared application state
            .app_data(web::Data::new(db_pool.clone()))
            .app_data(web::Data::new(auth_service.clone()))
            .app_data(web::Data::new(redis_service.clone()))
            .app_data(web::Data::new(ai_service.clone()))
            .app_data(web::Data::new(payment_service.clone()))
            .app_data(web::Data::new(notification_service.clone()))
            .app_data(web::Data::new(ws_manager.clone()))
            .app_data(web::Data::from(config.clone()))

            // JSON payload configuration
            .app_data(web::JsonConfig::default().limit(10 * 1024 * 1024)) // 10MB

            // Configure all routes
            .configure(configure_routes)
    })
    .workers(server_workers)
    .bind(format!("{}:{}", server_host, server_port))?
    .run()
    .await
}
