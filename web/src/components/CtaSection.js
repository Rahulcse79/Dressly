import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { IoLogoApple, IoLogoGooglePlaystore } from 'react-icons/io5';

const CtaSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="cta-section">
      <motion.div
        className="cta-inner"
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <span className="section-tag">📲 Download Now</span>
        <h2 className="cta-title">
          Ready to transform your <span className="gradient-text">style</span>?
        </h2>
        <p className="cta-subtitle">
          Download Dressly today and experience the future of AI-powered fashion.
          Available on iOS and Android.
        </p>
        <div className="cta-buttons">
          <a
            href="https://apps.apple.com/app/dressly"
            className="store-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IoLogoApple className="store-btn-icon" />
            <div className="store-btn-text">
              <span className="store-btn-label">Download on the</span>
              <span className="store-btn-name">App Store</span>
            </div>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.dressly.dressly"
            className="store-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IoLogoGooglePlaystore className="store-btn-icon" />
            <div className="store-btn-text">
              <span className="store-btn-label">Get it on</span>
              <span className="store-btn-name">Google Play</span>
            </div>
          </a>
        </div>
      </motion.div>
    </section>
  );
};

export default CtaSection;
