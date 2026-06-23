"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Search, Sparkles, BrainCircuit, ScanLine, Sprout, Smartphone } from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { useLanguage } from "../i18n/LanguageContext";

export default function Home() {
  const { t, isRtl } = useLanguage();

  return (
    <div className={`landing-wrapper ${isRtl ? 'rtl-layout' : ''}`}>
      {/* Hero Section */}
      <section className="hero-premium">
        <div className="hero-content">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} className="badge-icon" />
            <span>{t.landing.badge}</span>
          </motion.div>
          
          <motion.h1 
            className="hero-headline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t.landing.heroHeadline1} <br/>
            <span className="text-gradient">{t.landing.heroHeadline2}</span>
          </motion.h1>
          
          <motion.p 
            className="hero-subheadline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.landing.heroSub}
          </motion.p>
          
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/dashboard" className="btn-premium">
              {t.landing.launchBtn} <ArrowRight size={18} style={isRtl ? { transform: 'scaleX(-1)' } : {}} />
            </Link>
            <Link href="#mobile-app" className="btn-secondary">
              {t.landing.getAppBtn} <Smartphone size={18} />
            </Link>
          </motion.div>
        </div>

        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="visual-glow-backdrop"></div>
          <Image 
            src="/hero_imge_v2.png" 
            alt="AI Plant Analysis" 
            width={800} 
            height={800} 
            className="hero-image-premium"
            priority
          />
        </motion.div>
      </section>

      {/* Features: Bento Grid */}
      <section className="bento-section">
        <div className="section-header">
          <h2>{t.landing.bentoTitle}</h2>
          <p>{t.landing.bentoSub}</p>
        </div>

        <div className="bento-grid">
          {/* Large Card */}
          <motion.div className="bento-card col-span-2 bento-primary" whileHover={{ y: -5 }}>
            <div className="bento-content">
              <BrainCircuit size={40} className="bento-icon" />
              <h3>{t.landing.bento1Title}</h3>
              <p>{t.landing.bento1Desc}</p>
            </div>
            <div className="bento-decoration decoration-1"></div>
          </motion.div>

          {/* Small Card 1 */}
          <motion.div className="bento-card" whileHover={{ y: -5 }}>
            <div className="bento-content">
              <ScanLine size={32} className="bento-icon" />
              <h3>{t.landing.bento2Title}</h3>
              <p>{t.landing.bento2Desc}</p>
            </div>
          </motion.div>

          {/* Small Card 2 */}
          <motion.div className="bento-card" whileHover={{ y: -5 }}>
            <div className="bento-content">
              <Search size={32} className="bento-icon" />
              <h3>{t.landing.bento3Title}</h3>
              <p>{t.landing.bento3Desc}</p>
            </div>
          </motion.div>

          {/* Medium Card */}
          <motion.div className="bento-card col-span-2 row-span-1 horizontal-card" whileHover={{ y: -5 }}>
            <div className="bento-content">
              <ShieldCheck size={32} className="bento-icon" />
              <div>
                <h3>{t.landing.bento4Title}</h3>
                <p>{t.landing.bento4Desc}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works: Timeline */}
      <section className="timeline-section">
        <div className="section-header">
          <h2>{t.landing.timelineTitle}</h2>
          <p>{t.landing.timelineSub}</p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>
          
          <div className="timeline-step">
            <div className="step-marker">1</div>
            <div className="step-content">
              <h3>{t.landing.step1Title}</h3>
              <p>{t.landing.step1Desc}</p>
            </div>
          </div>

          <div className="timeline-step">
            <div className="step-marker">2</div>
            <div className="step-content">
              <h3>{t.landing.step2Title}</h3>
              <p>{t.landing.step2Desc}</p>
            </div>
          </div>

          <div className="timeline-step">
            <div className="step-marker">3</div>
            <div className="step-content">
              <h3>{t.landing.step3Title}</h3>
              <p>{t.landing.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section id="mobile-app" className="mobile-app-section">
        <div className="mobile-app-container">
          <motion.div 
            className="mobile-content"
            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="badge-pill">{t.landing.mobileBadge}</div>
            <h2>{t.landing.mobileTitle}</h2>
            <p>
              {t.landing.mobileDesc}
            </p>
            <div className="store-buttons">
              <button className="store-btn">
                <span className="store-icon">
                  <FaApple size={24} />
                </span>
                <div className="store-text">
                  <span className="store-sub">{t.landing.downloadOn}</span>
                  <span className="store-main">App Store</span>
                </div>
              </button>
              <button className="store-btn">
                <span className="store-icon">
                  <FaGooglePlay size={20} />
                </span>
                <div className="store-text">
                  <span className="store-sub">{t.landing.getItOn}</span>
                  <span className="store-main">Google Play</span>
                </div>
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            className="mobile-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="phone-mockup">
              <div className="phone-screen">
                <Leaf size={48} className="phone-icon" />
                <div className="phone-text">PhytoSense Mobile</div>
                <div className="phone-scan-line"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>{t.landing.ctaTitle}</h2>
          <p>{t.landing.ctaDesc}</p>
          <Link href="/dashboard" className="btn-premium btn-large">
            {t.landing.startBtn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-premium">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon-wrapper" style={{ padding: '6px' }}>
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <span>PhytoSense</span>
          </div>
          <div className="footer-links">
            <a href="#">About Us</a>
            <a href="#">Research</a>
            <a href="#mobile-app">Mobile App</a>
            <a href="#">API Docs</a>
            <a href="#">FAQ</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {t.landing.footerRights}</p>
        </div>
      </footer>
    </div>
  );
}
