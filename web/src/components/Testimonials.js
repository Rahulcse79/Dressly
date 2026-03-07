import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { IoStar } from 'react-icons/io5';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Fashion Blogger',
    avatar: 'PS',
    avatarBg: 'linear-gradient(135deg, #FF6B9D, #FF8FB3)',
    rating: 5,
    text: "Dressly completely changed how I plan outfits for my shoots. The AI suggestions are shockingly accurate — it even considers color theory and seasonal trends!",
  },
  {
    name: 'Arjun Mehta',
    role: 'Product Manager',
    avatar: 'AM',
    avatarBg: 'linear-gradient(135deg, #6C63FF, #8B83FF)',
    rating: 5,
    text: "As someone who hates spending time on outfit choices, this app is a game-changer. I just open it every morning and follow the AI's recommendation. Done in 30 seconds.",
  },
  {
    name: 'Sneha Patel',
    role: 'UX Designer',
    avatar: 'SP',
    avatarBg: 'linear-gradient(135deg, #00D9A5, #00F5BB)',
    rating: 5,
    text: "The wardrobe management feature alone is worth it. But combined with AI styling? It's like having a personal stylist in your pocket. The Pro plan is a steal.",
  },
];

const Testimonials = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="testimonials">
      <div className="testimonials-header">
        <span className="section-tag">💬 Testimonials</span>
        <h2 className="section-title">
          Loved by <span className="gradient-text">thousands</span>
        </h2>
        <p className="section-subtitle">
          See what our users are saying about their Dressly experience.
        </p>
      </div>

      <div className="testimonials-grid" ref={ref}>
        {testimonials.map((t, i) => (
          <motion.div
            className="testimonial-card"
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="testimonial-stars">
              {Array.from({ length: t.rating }).map((_, j) => (
                <IoStar key={j} />
              ))}
            </div>
            <p className="testimonial-text">"{t.text}"</p>
            <div className="testimonial-author">
              <div
                className="testimonial-avatar"
                style={{ background: t.avatarBg }}
              >
                {t.avatar}
              </div>
              <div className="testimonial-info">
                <h4>{t.name}</h4>
                <p>{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
