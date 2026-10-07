"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Leaf,
  Camera,
  Search,
  Sparkles,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Layers,
  Zap,
  Globe,
  User,
  X,
  Droplets,
  HeartPulse,
  AlertTriangle,
  Compass,
  BookOpen,
  CheckCircle2,
  Upload,
  RefreshCw,
  ChevronRight,
  Sliders,
  Check,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
} from "lucide-react";
import styles from "./InteractiveAppSimulator.module.css";

// 🌿 Curated Endemic Flora Data matching mobile Expo database
const FLORA_DATABASE = [
  {
    id: 1,
    scientific: "Nigella sativa L.",
    arabic: "السانوج • حبة البركة (Sanouj)",
    french: "Cumin Noir / Nigelle",
    family: "Ranunculaceae",
    grade: "Grade A",
    category: "immunity",
    image: "/specimens/nigella.jpg",
    bioactive: "Thymoquinone (30-48%), Nigellone, Acide linoléique",
    efficacy: "Bronchodilator & Immune Defense",
    indication: "Asthme allergique, modulation immunitaire, régulation glycémique",
    preparation: "1 cuillère à café de graines fraîches broyées dans du miel pur de montagne.",
    dosage: "1 prise par jour le matin à jeun.",
    contraindications: "Usage culinaire sécurisé. Éviter les fortes doses chez la femme enceinte.",
    fao: { soilPh: "6.0 - 7.8", rainfall: "350 - 700 mm/an", tempRange: "10°C - 32°C", kc: 0.85 },
  },
  {
    id: 2,
    scientific: "Artemisia herba-alba Asso",
    arabic: "الشيح الأبيض (Chih)",
    french: "Armoise Blanche",
    family: "Asteraceae",
    grade: "Grade A",
    category: "digestion",
    image: "/specimens/chih.jpg",
    bioactive: "Santonine, Thujone, Camphre, Chrysanthénone",
    efficacy: "Hypoglycemic & Visceral Spasmolytic",
    indication: "Spasmes gastro-intestinaux, vermifuge, adjuvant hypoglycémiant",
    preparation: "Infusion courte: 1g de sommités fleuries séchées dans 250ml d'eau frémissante (8 min max).",
    dosage: "1 tasse par jour, cures limitées à 7 jours consécutifs.",
    contraindications: "Neurotoxique à forte dose (présence de thujone). Interdit chez la femme enceinte.",
    fao: { soilPh: "7.0 - 8.8", rainfall: "100 - 350 mm/an", tempRange: "-2°C - 42°C", kc: 0.50 },
  },
  {
    id: 3,
    scientific: "Rosmarinus officinalis L.",
    arabic: "إكليل الجبل (Iklil Al-Jabal)",
    french: "Romarin Officinal",
    family: "Lamiaceae",
    grade: "Grade A",
    category: "memory",
    image: "/specimens/rosemary.jpg",
    bioactive: "1,8-Cinéole, Carnosol, Acide carnosique",
    efficacy: "Microcirculation & Cellular Defense",
    indication: "Insuffisance biliaire, microcirculation cérébrale, antioxydant majeur",
    preparation: "Décoction légère: 3g de feuilles bouillies 3 min, infuser 10 min.",
    dosage: "1 tasse le matin et 1 tasse à midi avant les repas.",
    contraindications: "Éviter le soir (effet stimulant). Déconseillé en cas d'obstruction biliaire.",
    fao: { soilPh: "6.5 - 8.5", rainfall: "250 - 600 mm/an", tempRange: "8°C - 38°C", kc: 0.70 },
  },
  {
    id: 4,
    scientific: "Thymus vulgaris L.",
    arabic: "الزعتر الجبلي (Zaatar)",
    french: "Thym Commun",
    family: "Lamiaceae",
    grade: "Grade A",
    category: "respiratory",
    image: "/specimens/thyme.jpg",
    bioactive: "Thymol (45-55%), Carvacrol, Acide rosmarinique",
    efficacy: "Antimicrobial & Biofilm Disruption",
    indication: "Antiseptique bronchique, toux productive, affections ORL",
    preparation: "Infusion: 2g de sommités fleuries dans 200ml d'eau à 90°C pendant 10 min à couvert.",
    dosage: "2 à 3 tasses par jour après les repas.",
    contraindications: "Prudence en cas d'insuffisance hépatique sévère. Déconseillé chez la femme enceinte.",
    fao: { soilPh: "6.0 - 8.2", rainfall: "300 - 650 mm/an", tempRange: "5°C - 35°C", kc: 0.75 },
  },
];

// 🌍 Algerian Bioclimatic Regions (Exact Agro Data)
const REGIONS_DATA = [
  { name: "Alger", title: "Alger (Littoral Tellien)", et0Base: 3.2, irrigation: "8.8 L/m²", soilPh: "7.4 pH", climate: "Subhumide Méditerranéen" },
  { name: "Oran", title: "Oran (Façade Ouest)", et0Base: 3.6, irrigation: "10.2 L/m²", soilPh: "7.6 pH", climate: "Semi-aride Côtier" },
  { name: "Constantine", title: "Constantine (Hautes Plaines)", et0Base: 3.1, irrigation: "8.5 L/m²", soilPh: "7.2 pH", climate: "Continental Méditerranéen" },
  { name: "Batna", title: "Batna (Massif Aurès)", et0Base: 3.4, irrigation: "9.4 L/m²", soilPh: "7.5 pH", climate: "Semi-aride d'Altitude" },
  { name: "Biskra", title: "Biskra (Porte du Sahara)", et0Base: 5.1, irrigation: "14.2 L/m²", soilPh: "7.8 pH", climate: "Aride Saharien / Oasis" },
];

const QUICK_FILTERS = [
  { label: "Thyme (Zaatar)", query: "Thymus" },
  { label: "Lavender", query: "Lavandula" },
  { label: "Chih", query: "Artemisia" },
  { label: "Rosemary", query: "Rosmarinus" },
  { label: "Black Seed", query: "Nigella" },
];

const AILMENTS_PRESETS = [
  {
    id: 1,
    plantId: 4,
    label: "Toux & Affections Respiratoires",
    labelFr: "Toux & Affections Respiratoires",
    labelAr: "السعال وأمراض الجهاز التنفسي",
    icon: "🫁",
    protocol: "Infusion de Thymus vulgaris L. (2g dans 200ml) 3 fois par jour après les repas.",
  },
  {
    id: 2,
    plantId: 2,
    label: "Spasmes Digestifs & Ballonements",
    labelFr: "Spasmes Digestifs & Ballonements",
    labelAr: "تشنجات المعدة واضطرابات الهضم",
    icon: "🫀",
    protocol: "Infusion courte d'Artemisia herba-alba Asso (1g dans 250ml) avant le repas principal.",
  },
  {
    id: 3,
    plantId: 1,
    label: "Renforcement Immunitaire & Allergies",
    labelFr: "Renforcement Immunitaire & Allergies",
    labelAr: "تقوية المناعة ومقاومة الحساسية",
    icon: "🛡️",
    protocol: "1 cuillère à café de Nigella sativa L. moulue à froid dans du miel d'oranger chaque matin.",
  },
  {
    id: 4,
    plantId: 3,
    label: "Fatigue Cérébrale & Microcirculation",
    labelFr: "Fatigue Cérébrale & Microcirculation",
    labelAr: "تنشيط الذاكرة والدورة الدموية",
    icon: "🧠",
    protocol: "Décoction légère de Rosmarinus officinalis L. le matin pour stimuler la concentration.",
  },
];

interface InteractiveAppSimulatorProps {
  compact?: boolean;
  initialMode?: "mobile" | "web";
}

export default function InteractiveAppSimulator({
  compact = false,
  initialMode = "mobile",
}: InteractiveAppSimulatorProps = {}) {
  // Navigation & View Mode State
  const [activeTab, setActiveTab] = useState<"home" | "scan" | "search" | "recommend" | "garden">("home");
  const [viewMode, setViewMode] = useState<"mobile" | "web">(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simLang, setSimLang] = useState<"en" | "fr" | "ar">("fr");
  const [currentTime, setCurrentTime] = useState("21:28");

  // Interactive Tab States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgan, setSelectedOrgan] = useState("Auto");
  const [selectedSpecimen, setSelectedSpecimen] = useState(FLORA_DATABASE[3]); // Default Thyme
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<typeof FLORA_DATABASE[0] | null>(FLORA_DATABASE[3]);
  const [selectedPlant, setSelectedPlant] = useState<typeof FLORA_DATABASE[0] | null>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  // Precision Garden States
  const [gardenWilayaIdx, setGardenWilayaIdx] = useState(0);
  const [gardenCropIdx, setGardenCropIdx] = useState(3);
  const [ambientTemp, setAmbientTemp] = useState(24);
  const [sunHours, setSunHours] = useState(8.5);
  const [soilMoisture, setSoilMoisture] = useState(48);

  // Dynamic Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard & Fullscreen Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      setViewMode("web");
      if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Filtered plants for search tab
  const filteredTaxa = FLORA_DATABASE.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.scientific.toLowerCase().includes(q) ||
      p.french.toLowerCase().includes(q) ||
      p.arabic.includes(searchQuery) ||
      p.family.toLowerCase().includes(q)
    );
  });

  // Calculate Precision Irrigation
  const currentWilaya = REGIONS_DATA[gardenWilayaIdx];
  const currentCrop = FLORA_DATABASE[gardenCropIdx];
  const tempCorrection = (ambientTemp - 20) * 0.08;
  const solarFactor = (sunHours / 8) * 0.9;
  const et0 = Math.max(1.8, Number((currentWilaya.et0Base + tempCorrection + (solarFactor - 0.9)).toFixed(2)));
  const etc = Number((et0 * currentCrop.fao.kc).toFixed(2));
  const waterNeedLiters = Number(((etc * 0.5 * (100 - soilMoisture)) / 50).toFixed(1));

  // Run AI Scanner Action
  const handleScanAction = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(selectedSpecimen);
    }, 1300);
  };

  // Upload Custom Photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomPhoto(event.target?.result as string);
        setIsScanning(true);
        setTimeout(() => {
          setIsScanning(false);
          setScanResult(FLORA_DATABASE[3]);
        }, 1400);
      };
      reader.readAsDataURL(file);
    }
  };

  const isRtl = simLang === "ar";

  // ==========================================================================
  // 1. HOME SCREEN CONTENT
  // ==========================================================================
  const renderHomeContent = (isWeb: boolean) => (
    <div className={styles.homeContainer}>
      {/* 1. Immersive Botanical Mountain Hero Card */}
      <div className={`${styles.heroCard} ${isWeb ? styles.webHeroCard : ""}`}>
        <div className={styles.heroGradient}></div>
        <div className={styles.heroContent}>
          {/* Badge Row */}
          <div className={styles.heroBadgesRow}>
            <div className={styles.brandEmblemPill}>
              <Leaf size={12} strokeWidth={2.5} />
              <span>PhytoSense</span>
            </div>
            <div className={styles.badgeOffline}>
              <ShieldCheck size={12} />
              <span>100% Offline SQLite</span>
            </div>
          </div>

          {/* Headline */}
          <div className={styles.heroHeadlineBlock}>
            <h2 className={styles.heroMainTitle} style={isWeb ? { fontSize: "1.85rem", lineHeight: 1.25 } : {}}>
              {simLang === "ar"
                ? "اكتشف كيمياء الطبيعة"
                : simLang === "fr"
                ? "Explorez la Chimie Botanique"
                : "Decode Nature's Chemistry"}
            </h2>
            <p className={styles.heroSubtitle}>
              {simLang === "ar"
                ? "ذكاء اصطناعي نباتي • 155 نوعاً مستوطناً"
                : "AI Botanical Intelligence • 155 Curated Taxa"}
            </p>
          </div>

          {/* Search Bar */}
          <div className={styles.heroSearchBar} style={isWeb ? { maxWidth: "600px" } : {}}>
            <Search size={16} color="#059669" />
            <input
              type="text"
              placeholder={
                simLang === "ar"
                  ? "ابحث بالاسم العلمي، العربي أو الفرنسي..."
                  : "Search Latin, French, or Arabic name..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setActiveTab("search");
              }}
              className={styles.heroSearchInput}
            />
            <button
              className={styles.heroSearchBtn}
              onClick={() => setActiveTab("search")}
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Popular Filters */}
          <div className={styles.popularRow}>
            <span className={styles.popularLabel}>
              {simLang === "ar" ? "الشائع:" : "Popular:"}
            </span>
            {QUICK_FILTERS.map((f, i) => (
              <button
                key={i}
                className={styles.popularChip}
                onClick={() => {
                  setSearchQuery(f.query);
                  setActiveTab("search");
                }}
              >
                <Leaf size={10} color="#059669" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Visual Statistics Cards */}
      <div className={`${styles.statsGrid} ${isWeb ? styles.webStatsGrid : ""}`}>
        <div className={styles.statCard} style={{ borderColor: "#D1FAE5" }}>
          <div className={styles.statIconBox} style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
            <Leaf size={14} />
          </div>
          <span className={styles.statValue} style={{ color: "#059669" }}>155</span>
          <span className={styles.statLabel}>Curated Taxa</span>
        </div>

        <div className={styles.statCard} style={{ borderColor: "#DBEAFE" }}>
          <div className={styles.statIconBox} style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
            <Layers size={14} />
          </div>
          <span className={styles.statValue} style={{ color: "#2563EB" }}>69</span>
          <span className={styles.statLabel}>Families</span>
        </div>

        <div className={styles.statCard} style={{ borderColor: "#FEF3C7" }}>
          <div className={styles.statIconBox} style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
            <Zap size={14} />
          </div>
          <span className={styles.statValue} style={{ color: "#D97706" }}>FTS5</span>
          <span className={styles.statLabel}>Instant Search</span>
        </div>

        <div className={styles.statCard} style={{ borderColor: "#F3E8FF" }}>
          <div className={styles.statIconBox} style={{ backgroundColor: "#FAF5FF", color: "#7C3AED" }}>
            <Sprout size={14} />
          </div>
          <span className={styles.statValue} style={{ color: "#7C3AED" }}>FAO</span>
          <span className={styles.statLabel}>ECOCROP</span>
        </div>
      </div>

      {/* 3. Essential Modules Section */}
      <div className={styles.sectionTitleRow}>
        <h3 className={styles.sectionTitle}>Essential Modules</h3>
        <p className={styles.sectionSubtitle}>Select a tool to launch</p>
      </div>

      <div className={`${styles.actionGrid} ${isWeb ? styles.webActionGrid : ""}`}>
        {/* Module 1: Scan & Identify */}
        <div
          className={styles.actionCard}
          style={{ borderColor: "#D1FAE5" }}
          onClick={() => setActiveTab("scan")}
        >
          <div className={styles.actionCardHeader}>
            <div className={styles.actionIconBox} style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
              <Camera size={18} />
            </div>
            <span className={styles.actionBadge} style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
              AI Vision
            </span>
          </div>
          <div>
            <h4 className={styles.actionTitle}>Scan & Identify</h4>
            <p className={styles.actionDesc}>Real-time leaf, flower & bark recognition</p>
          </div>
          <div className={styles.actionFooter} style={{ color: "#059669" }}>
            <span>Launch Camera</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Module 2: Botanical Catalog */}
        <div
          className={styles.actionCard}
          style={{ borderColor: "#DBEAFE" }}
          onClick={() => setActiveTab("search")}
        >
          <div className={styles.actionCardHeader}>
            <div className={styles.actionIconBox} style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              <Search size={18} />
            </div>
            <span className={styles.actionBadge} style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              FTS5 Index
            </span>
          </div>
          <div>
            <h4 className={styles.actionTitle}>Botanical Catalog</h4>
            <p className={styles.actionDesc}>Browse 155 endemic Algerian taxa</p>
          </div>
          <div className={styles.actionFooter} style={{ color: "#2563EB" }}>
            <span>Browse Flora</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Module 3: Precision Garden */}
        <div
          className={styles.actionCard}
          style={{ borderColor: "#FEF3C7" }}
          onClick={() => setActiveTab("garden")}
        >
          <div className={styles.actionCardHeader}>
            <div className={styles.actionIconBox} style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <Droplets size={18} />
            </div>
            <span className={styles.actionBadge} style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              FAO-56
            </span>
          </div>
          <div>
            <h4 className={styles.actionTitle}>Precision Garden</h4>
            <p className={styles.actionDesc}>Daily evapotranspiration & irrigation</p>
          </div>
          <div className={styles.actionFooter} style={{ color: "#D97706" }}>
            <span>Calculate Water</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Module 4: Clinical Needs */}
        <div
          className={styles.actionCard}
          style={{ borderColor: "#F3E8FF" }}
          onClick={() => setActiveTab("recommend")}
        >
          <div className={styles.actionCardHeader}>
            <div className={styles.actionIconBox} style={{ backgroundColor: "#FAF5FF", color: "#7C3AED" }}>
              <Sparkles size={18} />
            </div>
            <span className={styles.actionBadge} style={{ backgroundColor: "#FAF5FF", color: "#7C3AED" }}>
              Clinical AI
            </span>
          </div>
          <div>
            <h4 className={styles.actionTitle}>Needs & Remedies</h4>
            <p className={styles.actionDesc}>Targeted symptom & ailment synergies</p>
          </div>
          <div className={styles.actionFooter} style={{ color: "#7C3AED" }}>
            <span>Explore Remedies</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* 4. Endemic Flora Spotlight */}
      <div className={styles.sectionTitleRow}>
        <h3 className={styles.sectionTitle}>Endemic Flora Spotlight</h3>
        <p className={styles.sectionSubtitle}>Verified pharmacological monographs</p>
      </div>

      <div className={isWeb ? styles.webSpotlightGrid : undefined}>
        {FLORA_DATABASE.map((plant) => (
          <div
            key={plant.id}
            className={styles.spotlightCard}
            onClick={() => setSelectedPlant(plant)}
          >
            <div className={styles.spotlightThumb}>
              <Image src={plant.image} alt={plant.scientific} fill style={{ objectFit: "cover" }} />
            </div>
            <div className={styles.spotlightInfo}>
              <span className={styles.spotlightFamily}>{plant.family}</span>
              <h4 className={styles.spotlightName}>{plant.scientific}</h4>
              <p className={styles.spotlightVernacular}>
                {simLang === "ar" ? plant.arabic : plant.french}
              </p>
              <div className={styles.spotlightMoleculePill}>
                <Sparkles size={10} color="#059669" />
                <span>{plant.bioactive.split(",")[0]}</span>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </div>
        ))}
      </div>

      {/* 5. Bioclimatic Agronomy Card */}
      <div className={styles.sectionTitleRow}>
        <h3 className={styles.sectionTitle}>Bioclimatic Agronomy</h3>
        <p className={styles.sectionSubtitle}>Real-time FAO regional coefficients</p>
      </div>

      <div className={styles.regionCard}>
        <div className={styles.regionChips}>
          {REGIONS_DATA.map((reg, idx) => (
            <button
              key={idx}
              className={`${styles.regionChip} ${selectedRegionIdx === idx ? styles.regionChipActive : ""}`}
              onClick={() => setSelectedRegionIdx(idx)}
            >
              {reg.name}
            </button>
          ))}
        </div>

        <div className={styles.regionMetrics}>
          <div className={styles.regionMetricBox}>
            <span>ET₀ Penman</span>
            <strong>{REGIONS_DATA[selectedRegionIdx].et0Base} mm/d</strong>
          </div>
          <div className={styles.regionMetricBox}>
            <span>Irrigation</span>
            <strong>{REGIONS_DATA[selectedRegionIdx].irrigation}</strong>
          </div>
          <div className={styles.regionMetricBox}>
            <span>Soil pH</span>
            <strong>{REGIONS_DATA[selectedRegionIdx].soilPh}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // 2. SCANNER CONTENT
  // ==========================================================================
  const renderScanContent = (isWeb: boolean) => (
    <div className={`${styles.scannerContainer} ${isWeb ? styles.webTwoColLayout : ""}`}>
      {/* Left Column: Viewfinder & Controls */}
      <div>
        {/* Organ Selector Row */}
        <div className={styles.organSelectorRow}>
          {["Auto", "Leaf", "Flower", "Fruit", "Bark"].map((org) => (
            <button
              key={org}
              className={`${styles.organBtn} ${selectedOrgan === org ? styles.organBtnActive : ""}`}
              onClick={() => setSelectedOrgan(org)}
            >
              {org}
            </button>
          ))}
        </div>

        {/* Camera Viewfinder */}
        <div className={styles.viewfinderCard} style={isWeb ? { height: "300px" } : {}}>
          <Image
            src={customPhoto || selectedSpecimen.image}
            alt="Specimen"
            fill
            className={styles.viewfinderImg}
          />

          {/* Targeting Reticle */}
          <div className={styles.reticleOverlay}>
            <div className={`${styles.reticleCorner} ${styles.cornerTL}`}></div>
            <div className={`${styles.reticleCorner} ${styles.cornerTR}`}></div>
            <div className={`${styles.reticleCorner} ${styles.cornerBL}`}></div>
            <div className={`${styles.reticleCorner} ${styles.cornerBR}`}></div>
            {isScanning && <div className={styles.laserSweep}></div>}
          </div>

          {/* Preset Specimen Switcher */}
          <div className={styles.viewfinderPresetsBar}>
            {FLORA_DATABASE.map((s) => (
              <button
                key={s.id}
                className={`${styles.presetThumbBtn} ${selectedSpecimen.id === s.id && !customPhoto ? styles.presetThumbBtnActive : ""}`}
                onClick={() => {
                  setCustomPhoto(null);
                  setSelectedSpecimen(s);
                  setScanResult(null);
                }}
              >
                <Image src={s.image} alt={s.scientific} width={38} height={38} style={{ objectFit: "cover" }} />
              </button>
            ))}
            <button
              className={styles.presetThumbBtn}
              style={{ background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => filePickerRef.current?.click()}
              title="Upload photo"
            >
              <Upload size={16} />
              <input
                type="file"
                ref={filePickerRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </button>
          </div>
        </div>

        {/* Primary Scan Button */}
        <button
          className={styles.scanActionBtn}
          onClick={handleScanAction}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span>Extracting Biochemical Features...</span>
            </>
          ) : (
            <>
              <Camera size={18} />
              <span>Identify Specimen</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Diagnostic Result */}
      <div>
        {scanResult && !isScanning && (
          <div className={styles.scanResultCard}>
            <div className={styles.scanResultHeader}>
              <div>
                <span className={styles.confidenceBadge}>98.4% Match Pl@ntNet & Vision</span>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", margin: "4px 0 2px 0" }}>
                  {scanResult.scientific}
                </h4>
                <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0 }}>
                  {scanResult.french} • {scanResult.arabic}
                </p>
              </div>
              <CheckCircle2 size={24} color="#059669" />
            </div>

            <div className={styles.diagnosticTraceBox}>
              <div className={styles.traceRow}>
                <span className={styles.traceDot}></span>
                <span>Tier 1: Pl@ntNet Multi-Organ API (98.4%)</span>
              </div>
              <div className={styles.traceRow}>
                <span className={styles.traceDot}></span>
                <span>Tier 2: Kindwise Vision AI (Confirmed)</span>
              </div>
              <div className={styles.traceRow}>
                <span className={styles.traceDot}></span>
                <span>Tier 3: SQLite FTS5 Herbarium (Synced)</span>
              </div>
            </div>

            <div style={{ marginTop: "12px", background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#059669", display: "block", marginBottom: "4px" }}>
                BIOACTIVE COMPOUNDS
              </span>
              <p style={{ fontSize: "0.78rem", color: "#334155", margin: 0 }}>
                {scanResult.bioactive}
              </p>
            </div>

            <button
              className={styles.openMonographBtn}
              onClick={() => setSelectedPlant(scanResult)}
              style={{ marginTop: "14px" }}
            >
              <span>View Clinical Monograph</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================================================
  // 3. SEARCH / CATALOG CONTENT
  // ==========================================================================
  const renderSearchContent = (isWeb: boolean) => (
    <div className={styles.searchContainer}>
      <span className={styles.searchHeaderPill}>
        <ShieldCheck size={12} />
        Embedded SQLite FTS5 • 155 Taxa
      </span>

      <div className={styles.catalogSearchBar}>
        <Search size={18} color="#059669" />
        <input
          type="text"
          placeholder="Search scientific, French or Arabic name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.catalogSearchInput}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={isWeb ? styles.webCatalogGrid : undefined} style={!isWeb ? { display: "flex", flexDirection: "column", gap: "10px" } : undefined}>
        {filteredTaxa.map((plant) => (
          <div
            key={plant.id}
            className={styles.spotlightCard}
            onClick={() => setSelectedPlant(plant)}
          >
            <div className={styles.spotlightThumb}>
              <Image src={plant.image} alt={plant.scientific} fill style={{ objectFit: "cover" }} />
            </div>
            <div className={styles.spotlightInfo}>
              <span className={styles.spotlightFamily}>{plant.family}</span>
              <h4 className={styles.spotlightName}>{plant.scientific}</h4>
              <p className={styles.spotlightVernacular}>
                {simLang === "ar" ? plant.arabic : plant.french}
              </p>
              <div className={styles.spotlightMoleculePill}>
                <Sparkles size={10} color="#059669" />
                <span>{plant.bioactive.split(",")[0]}</span>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </div>
        ))}
      </div>
    </div>
  );

  // ==========================================================================
  // 4. NEEDS & REMEDIES CONTENT
  // ==========================================================================
  const renderNeedsContent = (isWeb: boolean) => (
    <div className={styles.remediesContainer}>
      <div className={styles.sectionTitleRow}>
        <h3 className={styles.sectionTitle}>Botanical Recommendations</h3>
        <p className={styles.sectionSubtitle}>Targeted pharmacological synergies</p>
      </div>

      <div className={isWeb ? styles.webNeedsGrid : undefined}>
        {AILMENTS_PRESETS.map((item) => {
          const matched = FLORA_DATABASE.find((p) => p.id === item.plantId)!;
          return (
            <div
              key={item.id}
              className={styles.ailmentCard}
              onClick={() => setSelectedPlant(matched)}
            >
              <div className={styles.ailmentCardHeader}>
                <span className={styles.ailmentIcon}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <h4 className={styles.ailmentCardTitle}>
                    {simLang === "ar" ? item.labelAr : simLang === "fr" ? item.labelFr : item.label}
                  </h4>
                  <p className={styles.ailmentPlantMatch}>
                    🌿 {matched.scientific} ({matched.french})
                  </p>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </div>
              <div className={styles.ailmentProtocolBox}>
                <strong>Protocol: </strong> {item.protocol}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==========================================================================
  // 5. GARDEN & IRRIGATION CONTENT
  // ==========================================================================
  const renderGardenContent = (isWeb: boolean) => (
    <div className={`${styles.gardenContainer} ${isWeb ? styles.webTwoColLayout : ""}`}>
      {/* Left Column: Config & Sliders */}
      <div>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Precision Garden</h3>
          <p className={styles.sectionSubtitle}>FAO-56 Penman Evapotranspiration Calculator</p>
        </div>

        <div className={styles.agriCard}>
          <span className={styles.agriLabel}>Wilaya & Bioclimatic Zone</span>
          <select
            className={styles.agriSelect}
            value={gardenWilayaIdx}
            onChange={(e) => setGardenWilayaIdx(Number(e.target.value))}
          >
            {REGIONS_DATA.map((r, i) => (
              <option key={i} value={i}>
                {r.title} — {r.climate}
              </option>
            ))}
          </select>

          <span className={styles.agriLabel} style={{ marginTop: "10px" }}>
            Target Crop (Kc)
          </span>
          <select
            className={styles.agriSelect}
            value={gardenCropIdx}
            onChange={(e) => setGardenCropIdx(Number(e.target.value))}
          >
            {FLORA_DATABASE.map((c, i) => (
              <option key={i} value={i}>
                {c.scientific} ({c.french}) — Kc: {c.fao.kc}
              </option>
            ))}
          </select>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Ambient Temperature</span>
              <strong>{ambientTemp}°C</strong>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              className={styles.sliderInput}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Solar Radiation</span>
              <strong>{sunHours} h/day</strong>
            </div>
            <input
              type="range"
              min="4"
              max="14"
              value={sunHours}
              onChange={(e) => setSunHours(Number(e.target.value))}
              className={styles.sliderInput}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Soil Moisture</span>
              <strong>{soilMoisture}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className={styles.sliderInput}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Agronomic Telemetry Output */}
      <div>
        <div className={styles.waterResultCard} style={isWeb ? { marginTop: "42px" } : {}}>
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#059669", letterSpacing: "0.04em" }}>
              DAILY WATER REQUIREMENT (ETc)
            </span>
            <h2 className={styles.waterValueBig}>
              {waterNeedLiters} <small>L / plant / day</small>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <div style={{ background: "#ffffff", padding: "10px", borderRadius: "12px", textAlign: "center", border: "1px solid #d1fae5" }}>
              <span style={{ fontSize: "0.65rem", color: "#64748B", display: "block" }}>ET₀ Penman</span>
              <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>{et0} mm/j</strong>
            </div>
            <div style={{ background: "#ffffff", padding: "10px", borderRadius: "12px", textAlign: "center", border: "1px solid #d1fae5" }}>
              <span style={{ fontSize: "0.65rem", color: "#64748B", display: "block" }}>Coeff. Kc</span>
              <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>{currentCrop.fao.kc}</strong>
            </div>
            <div style={{ background: "#ffffff", padding: "10px", borderRadius: "12px", textAlign: "center", border: "1px solid #d1fae5" }}>
              <span style={{ fontSize: "0.65rem", color: "#64748B", display: "block" }}>Hydration</span>
              <strong style={{ fontSize: "0.9rem", color: soilMoisture < 35 ? "#D97706" : "#059669" }}>
                {soilMoisture < 35 ? "Deficit" : "Optimal"}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: "14px", background: "#f0fdf4", padding: "12px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", display: "block" }}>
              FAO-56 Dual Kc Irrigation Advisory:
            </span>
            <p style={{ fontSize: "0.75rem", color: "#15803d", margin: "4px 0 0 0", lineHeight: 1.45 }}>
              Calculated based on {currentWilaya.title} microclimatic station coefficients with localized evapotranspiration calibrated for {currentCrop.scientific}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // 6. CLINICAL MONOGRAPH MODAL
  // ==========================================================================
  const renderMonographModal = (isWeb: boolean) => {
    if (!selectedPlant) return null;
    return (
      <div className={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
        <div className={isWeb ? styles.webModalSheet : styles.modalSheet}>
          <button className={styles.modalCloseBtn} onClick={() => setSelectedPlant(null)}>
            <X size={18} />
          </button>

          <div className={styles.modalScroll}>
            <div className={styles.modalHeroImg} style={isWeb ? { height: "220px" } : {}}>
              <Image src={selectedPlant.image} alt={selectedPlant.scientific} fill style={{ objectFit: "cover" }} />
            </div>

            <div>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>
                {selectedPlant.family} • {selectedPlant.grade}
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0F172A", margin: "2px 0" }}>
                {selectedPlant.scientific}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>
                {selectedPlant.french} • {selectedPlant.arabic}
              </p>
            </div>

            <div className={styles.monographCard}>
              <div className={styles.monographHeading}>
                <Sparkles size={16} color="#059669" />
                <span>Principes Actifs & Métabolites</span>
              </div>
              <p className={styles.monographText}>{selectedPlant.bioactive}</p>
            </div>

            <div className={styles.monographCard}>
              <div className={styles.monographHeading}>
                <HeartPulse size={16} color="#0284C7" />
                <span>Indications Thérapeutiques</span>
              </div>
              <p className={styles.monographText}>{selectedPlant.indication}</p>
            </div>

            <div className={styles.monographCard}>
              <div className={styles.monographHeading}>
                <Droplets size={16} color="#059669" />
                <span>Préparation Galénique & Posologie</span>
              </div>
              <p className={styles.monographText}>
                <strong>Mode: </strong>{selectedPlant.preparation}
              </p>
              <p className={styles.monographText} style={{ marginTop: "4px" }}>
                <strong>Dose: </strong>{selectedPlant.dosage}
              </p>
            </div>

            <div className={styles.monographCard} style={{ backgroundColor: "#FFFBEB", borderColor: "#FEF3C7" }}>
              <div className={styles.monographHeading} style={{ color: "#D97706" }}>
                <AlertTriangle size={16} color="#D97706" />
                <span>Contre-indications & Précautions</span>
              </div>
              <p className={styles.monographText}>{selectedPlant.contraindications}</p>
            </div>

            <div className={styles.monographCard}>
              <div className={styles.monographHeading}>
                <Compass size={16} color="#7C3AED" />
                <span>Exigences Bioclimatiques FAO</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isWeb ? "repeat(3, 1fr)" : "1fr", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ color: "#64748B" }}>pH du sol:</span>
                  <strong>{selectedPlant.fao.soilPh}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ color: "#64748B" }}>Pluviométrie:</span>
                  <strong>{selectedPlant.fao.rainfall}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ color: "#64748B" }}>Température:</span>
                  <strong>{selectedPlant.fao.tempRange}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const selectedRegionIdx = gardenWilayaIdx;
  const setSelectedRegionIdx = setGardenWilayaIdx;

  // ==========================================================================
  // RENDER MAIN COMPONENT
  // ==========================================================================
  return (
    <div className={`${styles.wrapper} ${viewMode === "web" ? styles.wrapperWeb : ""}`}>
      {/* Simulator Top Controls (Visible in Both Modes) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.viewModeSwitcher}>
            <button
              className={`${styles.viewModeBtn} ${viewMode === "mobile" ? styles.viewModeBtnActive : ""}`}
              onClick={() => setViewMode("mobile")}
              title="Affichage Application Mobile (iPhone 16 Pro)"
            >
              <Smartphone size={14} />
              <span>Mobile (iPhone)</span>
            </button>
            <button
              className={`${styles.viewModeBtn} ${viewMode === "web" ? styles.viewModeBtnActive : ""}`}
              onClick={() => setViewMode("web")}
              title="Affichage Application Web Plein Écran"
            >
              <Monitor size={14} />
              <span>Vue Web Normale</span>
            </button>
          </div>

          <span className={styles.liveBadge}>
            <span className={styles.liveDot}></span>
            {viewMode === "mobile" ? "EXPO SDK 57" : "WEB APP PLEIN ÉCRAN"}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.langPicker}>
            <Globe size={13} color="#64748B" />
            <button
              className={`${styles.langBtn} ${simLang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => setSimLang("en")}
            >
              EN
            </button>
            <button
              className={`${styles.langBtn} ${simLang === "fr" ? styles.langBtnActive : ""}`}
              onClick={() => setSimLang("fr")}
            >
              FR
            </button>
            <button
              className={`${styles.langBtn} ${simLang === "ar" ? styles.langBtnActive : ""}`}
              onClick={() => setSimLang("ar")}
            >
              عربي
            </button>
          </div>

          <button
            className={styles.fullscreenBtn}
            onClick={toggleFullScreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran complet"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? "Quitter" : "Plein Écran"}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODE 1: MOBILE VIEW (Authentic iPhone 16 Pro Mockup) */}
      {/* ==================================================================== */}
      {viewMode === "mobile" ? (
        <div className={styles.chassis}>
          {/* Physical Hardware Buttons */}
          <div className={styles.sideBtnAction} title="Action Button"></div>
          <div className={styles.sideBtnVolUp} title="Volume Up"></div>
          <div className={styles.sideBtnVolDown} title="Volume Down"></div>
          <div className={styles.sideBtnPower} title="Side Power Button"></div>

          <div className={styles.innerFrame}>
            {/* iOS Top Status Bar */}
            <div className={styles.statusBar}>
              <span className={styles.statusTime}>{currentTime}</span>
              <div className={styles.dynamicIsland}>
                <span className={styles.islandDot}></span>
                <span>{isScanning ? "Scanning..." : "PhytoSense"}</span>
              </div>
              <div className={styles.statusIcons}>
                <span>5G</span>
                <div className={styles.batteryPill}>
                  <div className={styles.batteryLevel}></div>
                </div>
              </div>
            </div>

            {/* Native Expo Top Brand Header */}
            <div className={styles.appHeader}>
              <div className={styles.brandBlock}>
                <div className={styles.brandIconSquare}>
                  <Leaf size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className={styles.brandTitle}>PhytoSense</h1>
                  <p className={styles.brandTagline}>AI for a Greener Tomorrow</p>
                </div>
              </div>

              <div className={styles.headerRight}>
                <button
                  className={styles.headerWebToggleBtn}
                  onClick={() => setViewMode("web")}
                  title="Basculer vers la vue Web Plein Écran"
                >
                  <Monitor size={12} />
                  <span>Vue Web</span>
                </button>

                <div
                  className={styles.headerPill}
                  onClick={() => setSimLang(simLang === "en" ? "fr" : simLang === "fr" ? "ar" : "en")}
                >
                  <Globe size={13} color="#059669" />
                  <span>{simLang.toUpperCase()}</span>
                </div>
                <div className={styles.profileBtn}>
                  <User size={16} />
                </div>
              </div>
            </div>

            {/* Screen Content Body */}
            <div className={`${styles.screenBody} ${isRtl ? styles.rtlLayout : ""}`}>
              {activeTab === "home" && renderHomeContent(false)}
              {activeTab === "scan" && renderScanContent(false)}
              {activeTab === "search" && renderSearchContent(false)}
              {activeTab === "recommend" && renderNeedsContent(false)}
              {activeTab === "garden" && renderGardenContent(false)}
            </div>

            {/* Slide-up Clinical Monograph Modal */}
            {selectedPlant && renderMonographModal(false)}

            {/* Floating Bottom Tab Bar */}
            <div className={styles.floatingTabBar}>
              {/* Tab 1: Home */}
              <button
                className={`${styles.tabItem} ${activeTab === "home" ? styles.tabItemActive : ""}`}
                onClick={() => setActiveTab("home")}
              >
                <Leaf size={22} color={activeTab === "home" ? "#059669" : "#64748B"} />
                <span className={styles.tabLabel}>{simLang === "ar" ? "الرئيسية" : "Home"}</span>
                {activeTab === "home" && <div className={styles.tabDotActive}></div>}
              </button>

              {/* Tab 2: Identify */}
              <button
                className={`${styles.tabItem} ${activeTab === "scan" ? styles.tabItemActive : ""}`}
                onClick={() => setActiveTab("scan")}
              >
                <Camera size={22} color={activeTab === "scan" ? "#059669" : "#64748B"} />
                <span className={styles.tabLabel}>{simLang === "ar" ? "التعرف" : "Identify"}</span>
                {activeTab === "scan" && <div className={styles.tabDotActive}></div>}
              </button>

              {/* Tab 3: Search */}
              <button
                className={`${styles.tabItem} ${activeTab === "search" ? styles.tabItemActive : ""}`}
                onClick={() => setActiveTab("search")}
              >
                <Search size={22} color={activeTab === "search" ? "#059669" : "#64748B"} />
                <span className={styles.tabLabel}>{simLang === "ar" ? "البحث" : "Search"}</span>
                {activeTab === "search" && <div className={styles.tabDotActive}></div>}
              </button>

              {/* Tab 4: Needs */}
              <button
                className={`${styles.tabItem} ${activeTab === "recommend" ? styles.tabItemActive : ""}`}
                onClick={() => setActiveTab("recommend")}
              >
                <Sparkles size={22} color={activeTab === "recommend" ? "#059669" : "#64748B"} />
                <span className={styles.tabLabel}>{simLang === "ar" ? "العلاج" : "Needs"}</span>
                {activeTab === "recommend" && <div className={styles.tabDotActive}></div>}
              </button>

              {/* Tab 5: Garden */}
              <button
                className={`${styles.tabItem} ${activeTab === "garden" ? styles.tabItemActive : ""}`}
                onClick={() => setActiveTab("garden")}
              >
                <Sprout size={22} color={activeTab === "garden" ? "#059669" : "#64748B"} />
                <span className={styles.tabLabel}>{simLang === "ar" ? "الحديقة" : "Garden"}</span>
                {activeTab === "garden" && <div className={styles.tabDotActive}></div>}
              </button>
            </div>

            {/* iOS Bottom Home Indicator */}
            <div className={styles.homeIndicator}></div>
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* MODE 2: WEB APPLICATION VIEW (Responsive Desktop & Fullscreen) */
        /* ==================================================================== */
        <div className={`${styles.webChassis} ${isFullscreen ? styles.webChassisFullscreen : ""}`}>
          {/* Desktop Web App Top Navigation Bar */}
          <header className={styles.webTopNav}>
            <div className={styles.webBrandBlock}>
              <div className={styles.brandIconSquare}>
                <Leaf size={22} strokeWidth={2.5} color="#10B981" />
              </div>
              <div>
                <h2 className={styles.brandTitle} style={{ fontSize: "1.25rem", margin: 0 }}>PhytoSense</h2>
                <p className={styles.brandTagline} style={{ fontSize: "0.75rem", margin: 0 }}>AI Botanical Intelligence • Web View</p>
              </div>
            </div>

            {/* Desktop Tabs */}
            <nav className={styles.webNavTabs}>
              <button
                className={`${styles.webTabBtn} ${activeTab === "home" ? styles.webTabBtnActive : ""}`}
                onClick={() => setActiveTab("home")}
              >
                <Leaf size={15} />
                <span>{simLang === "ar" ? "الرئيسية" : "Accueil"}</span>
              </button>
              <button
                className={`${styles.webTabBtn} ${activeTab === "scan" ? styles.webTabBtnActive : ""}`}
                onClick={() => setActiveTab("scan")}
              >
                <Camera size={15} />
                <span>{simLang === "ar" ? "التعرف" : "Scanner IA"}</span>
              </button>
              <button
                className={`${styles.webTabBtn} ${activeTab === "search" ? styles.webTabBtnActive : ""}`}
                onClick={() => setActiveTab("search")}
              >
                <Search size={15} />
                <span>{simLang === "ar" ? "الفهرس" : "Herbier SQLite"}</span>
              </button>
              <button
                className={`${styles.webTabBtn} ${activeTab === "recommend" ? styles.webTabBtnActive : ""}`}
                onClick={() => setActiveTab("recommend")}
              >
                <Sparkles size={15} />
                <span>{simLang === "ar" ? "العلاج" : "Remèdes"}</span>
              </button>
              <button
                className={`${styles.webTabBtn} ${activeTab === "garden" ? styles.webTabBtnActive : ""}`}
                onClick={() => setActiveTab("garden")}
              >
                <Sprout size={15} />
                <span>{simLang === "ar" ? "الحديقة" : "Jardin FAO-56"}</span>
              </button>
            </nav>

            {/* Desktop Controls */}
            <div className={styles.webNavControls}>
              <button
                className={styles.switchToMobileBtn}
                onClick={() => setViewMode("mobile")}
                title="Basculer vers la vue iPhone Mobile"
              >
                <Smartphone size={14} />
                <span>Vue Mobile (iPhone)</span>
              </button>

              <button
                className={styles.fullscreenBtn}
                onClick={toggleFullScreen}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isFullscreen ? "Réduire" : "Plein Écran"}</span>
              </button>

              <div
                className={styles.headerPill}
                onClick={() => setSimLang(simLang === "en" ? "fr" : simLang === "fr" ? "ar" : "en")}
              >
                <Globe size={13} color="#059669" />
                <span>{simLang.toUpperCase()}</span>
              </div>

              <div className={styles.profileBtn}>
                <User size={16} />
              </div>
            </div>
          </header>

          {/* Web Screen Body */}
          <div className={`${styles.webScreenBody} ${isRtl ? styles.rtlLayout : ""}`}>
            {activeTab === "home" && renderHomeContent(true)}
            {activeTab === "scan" && renderScanContent(true)}
            {activeTab === "search" && renderSearchContent(true)}
            {activeTab === "recommend" && renderNeedsContent(true)}
            {activeTab === "garden" && renderGardenContent(true)}
          </div>

          {/* Centered Desktop Modal for Monograph */}
          {selectedPlant && renderMonographModal(true)}
        </div>
      )}
    </div>
  );
}
