"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { Language } from "../i18n/translations";

export default function NavBar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          <div className="logo-icon-wrapper">
            <Leaf size={36} strokeWidth={2.5} />
          </div>
          <span className="navbar-title">PhytoSense</span>
        </Link>
        <div className="navbar-links">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)} 
            className="lang-select"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>

          <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
            {language === 'ar' ? "الرئيسية" : language === 'fr' ? "Accueil" : "Home"}
          </Link>
          <Link href="/dashboard" className="btn-primary nav-btn">
            {pathname === "/dashboard" ? <><Leaf size={18} /> {t.nav.dashboard}</> : <><Sparkles size={18} /> {language === 'ar' ? 'تشغيل التطبيق' : language === 'fr' ? 'Lancer App' : 'Launch App'}</>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
