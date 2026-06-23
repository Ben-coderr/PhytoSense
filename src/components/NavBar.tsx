"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Sparkles, Menu, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { Language } from "../i18n/translations";

export default function NavBar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="logo-icon-wrapper">
            <Leaf size={36} strokeWidth={2.5} />
          </div>
          <span className="navbar-title">PhytoSense</span>
        </Link>
        
        <button 
          className="burger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <select 
            value={language} 
            onChange={(e) => {
              setLanguage(e.target.value as Language);
              setIsMobileMenuOpen(false);
            }} 
            className="lang-select"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>

          <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
            {language === 'ar' ? "الرئيسية" : language === 'fr' ? "Accueil" : "Home"}
          </Link>
          <Link href="/dashboard" className="btn-primary nav-btn" onClick={() => setIsMobileMenuOpen(false)}>
            {pathname === "/dashboard" ? <><Leaf size={18} /> {t.nav.dashboard}</> : <><Sparkles size={18} /> {language === 'ar' ? 'تشغيل التطبيق' : language === 'fr' ? 'Lancer App' : 'Launch App'}</>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
