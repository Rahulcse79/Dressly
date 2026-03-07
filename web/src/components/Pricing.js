import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started with AI styling.',
    featured: false,
    features: [
      { text: '5 AI outfit generations / day', included: true },
      { text: 'Basic wardrobe management', included: true },
      { text: 'Occasion-based styling', included: true },
      { text: 'Community support', included: true },
      { text: 'Unlimited generations', included: false },
      { text: 'Advanced AI models', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaStyle: 'btn btn-outline btn-large pricing-cta',
  },
  {
    name: 'Pro',
    price: '₹199',
    period: '/month',
    description: 'For fashion-forward users who want the best AI styling.',
    featured: true,
    features: [
      { text: 'Unlimited AI generations', included: true },
      { text: 'Full wardrobe management', included: true },
      { text: 'All occasion styles', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced Gemini AI models', included: true },
      { text: 'Style analytics & trends', included: true },
      { text: 'Early access to features', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: 'btn btn-primary btn-large pricing-cta',
  },
];

const Pricing = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="pricing" id="pricing">
      <div className="pricing-header">
        <span className="section-tag">💎 Pricing</span>
        <h2 className="section-title">
          Simple, <span className="gradient-text">transparent</span> pricing
        </h2>
        <p className="section-subtitle">
          Start free and upgrade when you're ready. Pro pricing is dynamically
          managed by our admin panel.
        </p>
      </div>

      <div className="pricing-grid" ref={ref}>
        {plans.map((plan, i) => (
          <motion.div
            className={`pricing-card ${plan.featured ? 'featured' : ''}`}
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            {plan.featured && (
              <span className="pricing-popular">MOST POPULAR</span>
            )}
            <h3 className="pricing-name">{plan.name}</h3>
            <div className="pricing-price">
              <span className="pricing-amount">{plan.price}</span>
              <span className="pricing-period">{plan.period}</span>
            </div>
            <p className="pricing-desc">{plan.description}</p>

            <div className="pricing-features">
              {plan.features.map((f) => (
                <div
                  className={`pricing-feature ${!f.included ? 'disabled' : ''}`}
                  key={f.text}
                >
                  <span className="pricing-feature-icon">
                    {f.included ? <IoCheckmarkCircle /> : <IoCloseCircle />}
                  </span>
                  {f.text}
                </div>
              ))}
            </div>

            <a
              href="https://app.dressly.app/register"
              className={plan.ctaStyle}
              target="_blank"
              rel="noopener noreferrer"
            >
              {plan.cta}
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
