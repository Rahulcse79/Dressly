import React from 'react';
import { motion } from 'framer-motion';
import { IoSparkles, IoSearch } from 'react-icons/io5';
import { HiOutlineArrowRight } from 'react-icons/hi';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-inner">
        {/* Left — Content */}
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Powered by Google Gemini AI
          </div>

          <h1 className="hero-title">
            Your Personal
            <br />
            <span className="gradient-text">AI Fashion</span>
            <br />
            Advisor
          </h1>

          <p className="hero-description">
            Upload your wardrobe, and let our AI create perfect outfit
            combinations for any occasion — from casual outings to formal
            events, weddings to interviews.
          </p>

          <div className="hero-cta">
            <a
              href="http://localhost:3001/register"
              className="btn btn-primary btn-large"
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Styling Free
              <HiOutlineArrowRight className="btn-icon" />
            </a>
            <a href="#how-it-works" className="btn btn-outline btn-large">
              See How It Works
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">50K+</span>
              <span className="hero-stat-label">Outfits Generated</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">10K+</span>
              <span className="hero-stat-label">Happy Users</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">4.8★</span>
              <span className="hero-stat-label">App Store Rating</span>
            </div>
          </div>
        </motion.div>

        {/* Right — Phone Mockup */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <div className="phone-mockup">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-header">
                <div className="phone-greeting">Hey, Rahul 👋</div>
                <div className="phone-avatar">RS</div>
              </div>

              <div className="phone-search">
                <IoSearch />
                Search your wardrobe...
              </div>

              <div className="phone-cards">
                <div className="phone-card">
                  <div
                    className="phone-card-img"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                  />
                  <div className="phone-card-info">
                    <span className="phone-card-title">Business Meeting</span>
                    <span className="phone-card-sub">Navy blazer + white shirt</span>
                  </div>
                  <span
                    className="phone-card-score"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                  >
                    96%
                  </span>
                </div>

                <div className="phone-card">
                  <div
                    className="phone-card-img"
                    style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                  />
                  <div className="phone-card-info">
                    <span className="phone-card-title">Casual Weekend</span>
                    <span className="phone-card-sub">Denim jacket + chinos</span>
                  </div>
                  <span
                    className="phone-card-score"
                    style={{ background: 'rgba(108,99,255,0.15)', color: '#8B83FF' }}
                  >
                    92%
                  </span>
                </div>

                <div className="phone-card">
                  <div
                    className="phone-card-img"
                    style={{ background: 'linear-gradient(135deg, #EC4899, #BE185D)' }}
                  />
                  <div className="phone-card-info">
                    <span className="phone-card-title">Evening Party</span>
                    <span className="phone-card-sub">Black turtleneck + slacks</span>
                  </div>
                  <span
                    className="phone-card-score"
                    style={{ background: 'rgba(255,107,157,0.15)', color: '#FF6B9D' }}
                  >
                    89%
                  </span>
                </div>
              </div>

              <div className="phone-ai-btn">
                <IoSparkles style={{ marginRight: 6 }} />
                Generate New Outfit
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="float-element top-right">
            <IoSparkles style={{ color: '#8B83FF', marginRight: 6 }} />
            AI Styled
          </div>
          <div className="float-element mid-left">
            🎯 Occasion Match
          </div>
          <div className="float-element bottom-right">
            ⭐ Style Score: 96%
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
