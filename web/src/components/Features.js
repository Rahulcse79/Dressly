import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  IoSparkles,
  IoShirt,
  IoCalendar,
  IoNotifications,
  IoShield,
  IoFlash,
} from 'react-icons/io5';

const features = [
  {
    icon: <IoSparkles />,
    color: 'purple',
    title: 'AI Outfit Generation',
    description:
      'Upload photos of your clothes and let Google Gemini AI create stunning outfit combinations tailored to your style.',
  },
  {
    icon: <IoShirt />,
    color: 'pink',
    title: 'Smart Wardrobe',
    description:
      'Digitize your entire wardrobe. Categorize, search, and organize all your clothing items in one place.',
  },
  {
    icon: <IoCalendar />,
    color: 'green',
    title: 'Occasion Matching',
    description:
      'Get AI-powered suggestions for any occasion — formal meetings, casual outings, weddings, or interviews.',
  },
  {
    icon: <IoFlash />,
    color: 'yellow',
    title: 'Real-Time Styling',
    description:
      'Get instant outfit feedback with live WebSocket updates. See style scores and improvement tips in real time.',
  },
  {
    icon: <IoNotifications />,
    color: 'blue',
    title: 'Smart Notifications',
    description:
      'Receive personalized style tips, trend alerts, and outfit reminders based on your calendar and weather.',
  },
  {
    icon: <IoShield />,
    color: 'red',
    title: 'Secure & Private',
    description:
      'Your data is encrypted end-to-end. JWT authentication, rate limiting, and zero-trust security architecture.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const Features = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="features" id="features">
      <div className="features-header">
        <span className="section-tag">✨ Features</span>
        <h2 className="section-title">
          Everything you need to
          <br />
          <span className="gradient-text">look your best</span>
        </h2>
        <p className="section-subtitle">
          Dressly combines cutting-edge AI with an intuitive wardrobe manager to
          revolutionize how you dress every day.
        </p>
      </div>

      <div className="features-grid" ref={ref}>
        {features.map((feature, i) => (
          <motion.div
            className="feature-card"
            key={feature.title}
            custom={i}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={cardVariants}
          >
            <div className={`feature-icon ${feature.color}`}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Features;
