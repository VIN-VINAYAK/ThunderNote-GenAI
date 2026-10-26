import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiArrowDown,
  FiArrowUpRight,
  FiCheck,
  FiFileText,
  FiLayers,
  FiLock,
  FiZap,
} from "react-icons/fi";

const features = [
  {
    icon: FiZap,
    title: "Made for momentum",
    description: "Capture an idea in seconds, then get straight back to what matters.",
  },
  {
    icon: FiLayers,
    title: "Everything in its place",
    description: "Keep your notes together in a quiet, considered workspace.",
  },
  {
    icon: FiLock,
    title: "Yours by design",
    description: "A personal space for the thoughts and plans you want to keep.",
  },
];

const enter = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <div className="landing-glow landing-glow-one" aria-hidden="true" />
      <div className="landing-glow landing-glow-two" aria-hidden="true" />

      <section className="landing-hero">
        <motion.div
          className="landing-copy"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div className="eyebrow" variants={enter}>
            <span className="eyebrow-mark"><FiZap /></span>
            A little more room to think
          </motion.div>

          <motion.h1 variants={enter}>
            Make space for
            <span> your next big idea.</span>
          </motion.h1>

          <motion.p className="landing-description" variants={enter}>
            A calm, beautifully simple home for your notes, plans, and passing
            thoughts. Keep what matters close and let the rest find its place.
          </motion.p>

          <motion.div className="landing-actions" variants={enter}>
            <button className="button-primary" onClick={() => navigate("/register")}>
              Create your free account <FiArrowUpRight />
            </button>
            <button className="button-secondary" onClick={() => navigate("/login")}>
              Sign in
            </button>
          </motion.div>

          <motion.div className="landing-assurance" variants={enter}>
            <span className="assurance-icon"><FiCheck /></span>
            Simple by design. Ready when you are.
          </motion.div>
        </motion.div>

        <motion.div
          className="workspace-preview"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          aria-label="Preview of the Thunder Notes workspace"
        >
          <div className="preview-topbar">
            <div className="preview-brand">
              <span className="preview-brand-mark"><FiZap /></span>
              <span>your workspace</span>
            </div>
            <span className="preview-status"><i /> just for you</span>
          </div>
          <div className="preview-content">
            <div className="preview-overline">A FRESH PAGE</div>
            <h2>Good thoughts<br />start somewhere.</h2>
            <p>Give your ideas a place to land. You can always shape them later.</p>
            <div className="preview-note">
              <span className="preview-note-icon"><FiFileText /></span>
              <span>
                <strong>One thing at a time</strong>
                <small>A note to come back to</small>
              </span>
              <FiArrowUpRight className="preview-note-arrow" />
            </div>
            <div className="preview-footer">
              <span>YOUR NOTES, IN FOCUS</span>
              <span className="preview-dots" aria-hidden="true"><i /><i /><i /></span>
            </div>
          </div>
          <div className="preview-accent" aria-hidden="true" />
        </motion.div>
      </section>

      <section className="feature-section" aria-label="Why Thunder Notes">
        <div className="feature-intro">
          <span className="section-kicker">LESS FRICTION, MORE FLOW</span>
          <h2>Thoughtful tools for everyday thinking.</h2>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description }, index) => (
            <motion.article
              className="feature-card"
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <span className="feature-icon"><Icon /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <div className="landing-bottom">
        <span>THUNDER NOTES</span>
        <span>Made for the ideas that stay with you.</span>
        <FiArrowDown aria-hidden="true" />
      </div>
    </main>
  );
}
