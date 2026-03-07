import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPage = () => {
  return (
    <>
      <section className="page-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">🔒 Legal</span>
          <h1 className="section-title">Privacy Policy</h1>
          <p className="section-subtitle">
            Last updated: March 7, 2026
          </p>
        </motion.div>
      </section>

      <section className="legal-content">
        <div className="legal-inner">
          <h2>1. Introduction</h2>
          <p>
            Dressly Inc. ("we", "our", or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our mobile application
            and website (collectively, the "Service").
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>
            When you create an account, we collect your name, email address, and
            profile photo. If you subscribe to our Pro plan, we collect payment
            information through our payment processor (Razorpay).
          </p>
          <h3>Wardrobe Data</h3>
          <p>
            When you upload photos of clothing items, these images are stored
            securely and processed by our AI to generate outfit suggestions.
            Images are encrypted at rest and in transit.
          </p>
          <h3>Usage Data</h3>
          <p>
            We automatically collect device information, app usage analytics,
            and crash reports to improve our Service.
          </p>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Generate AI-powered outfit recommendations</li>
            <li>Process payments and subscriptions</li>
            <li>Send push notifications (with your consent)</li>
            <li>Improve and personalize your experience</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>

          <h2>4. AI Processing</h2>
          <p>
            Your wardrobe images are processed by Google's Gemini AI to generate
            outfit combinations. Images are sent to Google's API securely and
            are not used for training purposes. We retain AI-generated results
            linked to your account.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures including TLS 1.3
            encryption, JWT authentication, rate limiting, and encrypted data
            storage. Your passwords are hashed using bcrypt and never stored in
            plain text.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you
            delete your account, all personal data and wardrobe images are
            permanently deleted within 30 days.
          </p>

          <h2>7. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li>Google Gemini API — AI outfit generation</li>
            <li>Razorpay — Payment processing</li>
            <li>Firebase Cloud Messaging — Push notifications</li>
            <li>Cloudflare — CDN and DDoS protection</li>
          </ul>

          <h2>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at{' '}
            <a href="mailto:privacy@dressly.app" style={{ color: 'var(--primary-light)' }}>
              privacy@dressly.app
            </a>.
          </p>
        </div>
      </section>
    </>
  );
};

export default PrivacyPage;
