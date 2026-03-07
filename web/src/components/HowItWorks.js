import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const steps = [
  {
    number: '01',
    title: 'Upload Your Wardrobe',
    description:
      'Take photos of your clothing items or upload from your gallery. Our AI automatically categorizes each piece by type, color, and style.',
  },
  {
    number: '02',
    title: 'Tell Us the Occasion',
    description:
      'Going to a business meeting? A casual brunch? A wedding? Select the occasion and let our AI understand the dress code requirements.',
  },
  {
    number: '03',
    title: 'AI Generates Outfits',
    description:
      'Google Gemini analyzes your wardrobe and creates multiple outfit combinations with style scores, color harmony analysis, and fit suggestions.',
  },
  {
    number: '04',
    title: 'Wear with Confidence',
    description:
      'Pick your favourite generated outfit, save it for later, or share it with friends. Build your style profile over time for even better recommendations.',
  },
];

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: 'easeOut' },
  }),
};

const HowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works-header">
        <span className="section-tag">🚀 How It Works</span>
        <h2 className="section-title">
          Get styled in <span className="gradient-text">4 easy steps</span>
        </h2>
        <p className="section-subtitle">
          From wardrobe upload to the perfect outfit — it takes less than a minute.
        </p>
      </div>

      <div className="steps-container" ref={ref}>
        {steps.map((step, i) => (
          <motion.div
            className="step"
            key={step.number}
            custom={i}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stepVariants}
          >
            <div className="step-number">{step.number}</div>
            <div className="step-content">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
