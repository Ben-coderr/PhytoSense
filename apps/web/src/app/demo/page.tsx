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

import styles from "./demo.module.css";

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
    <div className={`${styles.pageWrapper} ${isRtl ? styles.rtlLayout : ""}`}>
      {/* Top Sub-Bar Navigation */}
      <div className={styles.topBar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} style={isRtl ? { transform: "scaleX(-1)" } : {}} />
            <span>Retour au Portail</span>
          </Link>

          <div className={styles.topBarActions}>
            <button className={styles.shareBtn} onClick={handleShare}>
              {copied ? <Check size={16} color="#059669" /> : <Share2 size={16} />}
              <span>{copied ? "Lien Copié !" : "Partager la Démo iPhone"}</span>
            </button>
            <a
              href="https://github.com/Ben-coderr/PhytoSense/releases/download/v2.0.0/PhytoSense-v2.0.0.apk"
              className={styles.apkBtnCompact}
              download
            >
              <Download size={15} />
              <span>APK Android (v2.0.0)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Demo Section */}
      <main className={styles.mainSection}>
        <div className={styles.introSection}>
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>TEST MOBILE UNIVERSEL (IPHONE & ANDROID)</span>
          </div>

          <h1 className={styles.title}>
            Testez <span className={styles.titleGradient}>PhytoSense Mobile</span> en Direct
          </h1>

          <p className={styles.desc}>
            Pour les utilisateurs d'iPhone et les évaluateurs : testez toutes les fonctionnalités natives
            de l'application mobile (reconnaissance IA, calcul d'irrigation FAO, herbier trilingue)
            directement dans votre navigateur sans aucune installation.
          </p>

          <div className={styles.calloutBanner}>
            <div className={styles.calloutIcon}>
              <Smartphone size={24} />
            </div>
            <div className={styles.calloutText}>
              <h4>Votre ami a un iPhone ?</h4>
              <p>
                Envoyez-lui ce lien : il pourra ouvrir la démo dans Safari sur son iPhone et l'utiliser
                exactement comme une application native installée !
              </p>
            </div>
          </div>
        </div>

        {/* Live Simulator Component */}
        <div className={styles.simulatorContainer}>
          <InteractiveAppSimulator />
        </div>

        {/* Technical Highlights Below Simulator */}
        <section className={styles.specsGrid}>
          <div className={styles.specCard}>
            <div className={`${styles.specIconBox} ${styles.specIconGreen}`}>
              <Camera size={22} />
            </div>
            <h3>Scanner Multimodal IA</h3>
            <p>
              Reconnaissance en temps réel avec tolérance de panne à 4 niveaux : moteur de règles local,
              Pl@ntNet API, Kindwise Vision et IA cloud.
            </p>
          </div>

          <div className={styles.specCard}>
            <div className={`${styles.specIconBox} ${styles.specIconBlue}`}>
              <Droplets size={22} />
            </div>
            <h3>Irrigation FAO-56 Penman</h3>
            <p>
              Calculateur agronomique d'évapotranspiration ($ET_0$) et coefficient cultural ($K_c$)
              calibré pour les 7 étages bioclimatiques d'Algérie.
            </p>
          </div>

          <div className={styles.specCard}>
            <div className={`${styles.specIconBox} ${styles.specIconEmerald}`}>
              <Leaf size={22} />
            </div>
            <h3>Herbier Trilingue Hors-Ligne</h3>
            <p>
              Indexation SQLite FTS5 de 155 taxons médicinaux endémiques avec monographies complètes,
              posologies et contre-indications.
            </p>
          </div>

          <div className={styles.specCard}>
            <div className={`${styles.specIconBox} ${styles.specIconPurple}`}>
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
