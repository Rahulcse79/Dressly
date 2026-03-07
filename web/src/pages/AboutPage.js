import React from 'react';
import { motion } from 'framer-motion';
import {
  IoLogoReact,
  IoServer,
  IoPhonePortrait,
  IoCloud,
  IoSparkles,
  IoShield,
} from 'react-icons/io5';

const techStack = [
  {
    icon: <IoServer />,
    name: 'Rust + Actix-Web',
    desc: 'Backend API',
  },
  {
    icon: <IoPhonePortrait />,
    name: 'Flutter + Dart',
    desc: 'Cross-platform Mobile',
  },
  {
    icon: <IoLogoReact />,
    name: 'React.js',
    desc: 'Marketing Website',
  },
  {
    icon: <IoSparkles />,
    name: 'Google Gemini',
    desc: 'Multimodal AI Engine',
  },
  {
    icon: <IoCloud />,
    name: 'PostgreSQL + Redis',
    desc: 'Database & Cache',
  },
  {
    icon: <IoShield />,
    name: 'Kubernetes',
    desc: 'Container Orchestration',
  },
];

const AboutPage = () => {
  return (
    <>
      <section className="page-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">🏢 About Us</span>
          <h1 className="section-title">
            The story behind <span className="gradient-text">Dressly</span>
          </h1>
          <p className="section-subtitle">
            We're building the future of personal styling with AI — making
            fashion accessible, intelligent, and fun.
          </p>
        </motion.div>
      </section>

      <section className="about-content">
        <div className="about-grid">
          <motion.div
            className="about-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2>Our Mission</h2>
            <p>
              Dressly was born from a simple frustration: the daily dilemma of
              "what should I wear?" We believe that everyone deserves access to
              intelligent fashion advice without the cost of a personal stylist.
            </p>
            <p>
              By harnessing the power of Google's Gemini multimodal AI, we
              analyze your wardrobe photos and generate outfit combinations that
              consider color harmony, occasion appropriateness, seasonal trends,
              and your personal style preferences.
            </p>
          </motion.div>

          <motion.div
            className="about-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>What Makes Us Different</h2>
            <p>
              Unlike generic fashion apps, Dressly works with <strong>your
              actual clothes</strong>. We don't just suggest outfits from a
              catalog — we analyze the real items in your wardrobe and create
              combinations you can actually wear today.
            </p>
            <p>
              Our AI understands nuances like fabric textures, pattern matching,
              color coordination, and dress codes for different occasions. The
              more you use Dressly, the smarter it gets at understanding your
              unique style.
            </p>
          </motion.div>

          <motion.div
            className="about-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2>Built for Scale</h2>
            <p>
              Dressly is engineered to handle 1–3 million concurrent users with
              a production-grade architecture. Our backend is written in Rust
              for blazing-fast performance, the mobile app uses Flutter for true
              cross-platform native experience, and everything is deployed on
              Kubernetes with full observability.
            </p>
          </motion.div>

          <motion.div
            className="about-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2>Tech Stack</h2>
            <p>
              We use best-in-class technologies for every layer of the platform.
            </p>
            <div className="tech-stack-grid">
              {techStack.map((tech) => (
                <div className="tech-item" key={tech.name}>
                  <span className="tech-icon">{tech.icon}</span>
                  <div className="tech-info">
                    <h4>{tech.name}</h4>
                    <p>{tech.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="about-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2>Open Source</h2>
            <p>
              Dressly is proudly open source. We believe in transparency and
              community-driven development. Check out our code, contribute, or
              fork it for your own projects.
            </p>
            <p>
              <a
                href="https://github.com/Rahulcse79/Dressly"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ marginTop: 12, display: 'inline-flex' }}
              >
                View on GitHub →
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
