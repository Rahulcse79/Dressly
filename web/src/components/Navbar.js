import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { IoSparkles } from 'react-icons/io5';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'About', href: '/about' },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      const id = href.replace('/#', '');
      if (location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = href;
      }
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <IoSparkles />
            </div>
            Dressly
          </Link>

          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            <a
              href="http://localhost:3001"
              className="btn btn-ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign In
            </a>
            <a
              href="http://localhost:3001/register"
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started Free
            </a>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.label}
            to={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
          >
            {link.label}
          </Link>
        ))}
        <a href="http://localhost:3001" className="btn btn-outline" style={{ marginTop: 8 }}>
          Sign In
        </a>
        <a href="http://localhost:3001/register" className="btn btn-primary">
          Get Started Free
        </a>
      </div>
    </>
  );
};

export default Navbar;
