import React from 'react';
import { Link } from 'react-router-dom';
import { IoSparkles } from 'react-icons/io5';
import {
  IoLogoTwitter,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoLogoGithub,
} from 'react-icons/io5';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="navbar-logo" style={{ fontSize: 22 }}>
              <div className="navbar-logo-icon" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 16 }}>
                <IoSparkles />
              </div>
              Dressly
            </Link>
            <p>
              AI-powered fashion advisor that helps you look your best every day.
              Powered by Google Gemini multimodal AI.
            </p>
            <div className="footer-social">
              <a href="https://twitter.com/dresslyapp" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <IoLogoTwitter />
              </a>
              <a href="https://instagram.com/dresslyapp" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <IoLogoInstagram />
              </a>
              <a href="https://linkedin.com/company/dressly" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <IoLogoLinkedin />
              </a>
              <a href="https://github.com/Rahulcse79/Dressly" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <IoLogoGithub />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="footer-column">
            <h4>Product</h4>
            <a href="/#features">Features</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="https://app.dressly.app" target="_blank" rel="noopener noreferrer">Web App</a>
          </div>

          {/* Company */}
          <div className="footer-column">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <a href="mailto:contact@dressly.app">Contact</a>
            <a href="https://github.com/Rahulcse79/Dressly" target="_blank" rel="noopener noreferrer">Open Source</a>
          </div>

          {/* Legal */}
          <div className="footer-column">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} Dressly Inc. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="mailto:support@dressly.app">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
