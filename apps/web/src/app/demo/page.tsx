"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Sparkles,
  Download,
  Share2,
  Check,
  Apple,
  Info,
  Leaf,
  Droplets,
  Camera,
  ShieldCheck,
} from "lucide-react";
import InteractiveAppSimulator from "../../components/InteractiveAppSimulator";
import { useLanguage } from "../../i18n/LanguageContext";

export default function DemoPage() {
  const { t, isRtl } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className={`demo-page-wrapper ${isRtl ? "rtl-layout" : ""}`}>
      {/* Top Banner Navigation */}
      <div className="demo-top-bar">
        <div className="container demo-nav-container">
          <Link href="/" className="back-link">
            <ArrowLeft size={18} style={isRtl ? { transform: "scaleX(-1)" } : {}} />
            <span>Retour au Portail</span>
          </Link>

          <div className="top-bar-actions">
            <button className="share-btn" onClick={handleShare}>
              {copied ? <Check size={16} className="text-emerald" /> : <Share2 size={16} />}
              <span>{copied ? "Lien Copié !" : "Partager la Démo iPhone"}</span>
            </button>
            <a
              href="https://github.com/Ben-coderr/PhytoSense/releases/download/v2.0.0/PhytoSense-v2.0.0.apk"
              className="apk-btn-compact"
              download
            >
              <Download size={15} />
              <span>APK Android (v2.0.0)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Demo Section */}
      <main className="container demo-main">
        <div className="demo-intro">
          <div className="demo-badge">
            <Sparkles size={14} />
            <span>TEST MOBILE UNIVERSEL (IPHONE & ANDROID)</span>
          </div>

          <h1 className="demo-title">
            Testez <span className="text-gradient">PhytoSense Mobile</span> en Direct
          </h1>

          <p className="demo-desc">
            Pour les utilisateurs d'iPhone et les évaluateurs : testez toutes les fonctionnalités natives
            de l'application mobile (reconnaissance IA, calcul d'irrigation FAO, herbier trilingue)
            directement dans votre navigateur sans aucune installation.
          </p>

          <div className="iphone-callout-banner">
            <div className="callout-icon">
              <Smartphone size={24} />
            </div>
            <div className="callout-text">
              <h4>Votre ami a un iPhone ?</h4>
              <p>
                Envoyez-lui ce lien : il pourra ouvrir la démo dans Safari sur son iPhone et l'utiliser
                exactement comme une application native installée !
              </p>
            </div>
          </div>
        </div>

        {/* Live Simulator Component */}
        <div className="demo-simulator-container">
          <InteractiveAppSimulator />
        </div>

        {/* Technical Highlights Below Simulator */}
        <section className="demo-specs-grid">
          <div className="spec-card">
            <div className="spec-icon-box green">
              <Camera size={22} />
            </div>
            <h3>Scanner Multimodal IA</h3>
            <p>
              Reconnaissance en temps réel avec tolérance de panne à 4 niveaux : moteur de règles local,
              Pl@ntNet API, Kindwise Vision et IA cloud.
            </p>
          </div>

          <div className="spec-card">
            <div className="spec-icon-box blue">
              <Droplets size={22} />
            </div>
            <h3>Irrigation FAO-56 Penman</h3>
            <p>
              Calculateur agronomique d'évapotranspiration ($ET_0$) et coefficient cultural ($K_c$)
              calibré pour les 7 étages bioclimatiques d'Algérie.
            </p>
          </div>

          <div className="spec-card">
            <div className="spec-icon-box emerald">
              <Leaf size={22} />
            </div>
            <h3>Herbier Trilingue Hors-Ligne</h3>
            <p>
              Indexation SQLite FTS5 de 155 taxons médicinaux endémiques avec monographies complètes,
              posologies et contre-indications.
            </p>
          </div>

          <div className="spec-card">
            <div className="spec-icon-box purple">
              <ShieldCheck size={22} />
            </div>
            <h3>PFE Master UMAB 2026</h3>
            <p>
              Projet de fin d'études réalisé par Benkorich Abdenour sous la supervision académique de
              l'Université de Mostaganem.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
