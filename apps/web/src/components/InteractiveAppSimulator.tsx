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

const QUICK_FILTERS = [
  { label: "Thyme (Zaatar)", query: "Thymus" },
  { label: "Lavender", query: "Lavandula" },
  { label: "Chih (Wormwood)", query: "Artemisia" },
  { label: "Rosemary (Iklil)", query: "Rosmarinus" },
  { label: "Black Seed", query: "Nigella" },
];

const REGIONS_DATA = [
  { name: "Algiers", title: "Algiers (Coastal Tell)", et0: "3.2 mm/d", irrigation: "8.8 L/m²", soilPh: "7.4 pH", climate: "Sub-humid Mediterranean", et0Base: 3.2 },
  { name: "Oran", title: "Oran (Western Coast)", et0: "3.6 mm/d", irrigation: "10.2 L/m²", soilPh: "7.6 pH", climate: "Semi-arid Coastal", et0Base: 3.6 },
  { name: "Constantine", title: "Constantine (High Plain)", et0: "3.1 mm/d", irrigation: "8.5 L/m²", soilPh: "7.2 pH", climate: "Continental Mediterranean", et0Base: 3.1 },
  { name: "Batna", title: "Batna (Aurès)", et0: "3.4 mm/d", irrigation: "9.4 L/m²", soilPh: "7.5 pH", climate: "Semi-arid Highland", et0Base: 3.4 },
  { name: "Biskra", title: "Biskra (Saharan Gateway)", et0: "5.1 mm/d", irrigation: "14.2 L/m²", soilPh: "7.8 pH", climate: "Arid Oasis Ecosystem", et0Base: 5.1 },
];

const AILMENTS_PRESETS = [
  {
    id: "respiratory",
    label: "Cough & Respiration",
    labelFr: "Toux & Voies Respiratoires",
    labelAr: "السعال والتنفس",
    icon: "🫁",
    plantId: 4,
    protocol: "Infusion de Thymus vulgaris avec miel pur d'eucalyptus, 3 fois par jour après les repas.",
  },
  {
    id: "digestion",
    label: "Bloating & Spasms",
    labelFr: "Spasmes & Ballonnements",
    labelAr: "المغص والانتفاخ",
    icon: "🍵",
    plantId: 2,
    protocol: "Infusion d'Artemisia herba-alba (Chih) après le repas principal, cure de 5 à 7 jours.",
  },
  {
    id: "immunity",
    label: "Immune System Defense",
    labelFr: "Renforcement Immunitaire",
    labelAr: "المناعة العامة والوقاية",
    icon: "🛡️",
    plantId: 1,
    protocol: "Graines de Nigella sativa finement broyées avec miel tiède le matin à jeun.",
  },
  {
    id: "memory",
    label: "Memory & Circulation",
    labelFr: "Mémoire & Microcirculation",
    labelAr: "الذاكرة والدورة الدموية",
    icon: "🧠",
    plantId: 3,
    protocol: "Infusion matinale de Rosmarinus officinalis (Romarin) pour tonifier la circulation cérébrale.",
  },
];

interface SimulatorProps {
  compact?: boolean;
}

export default function InteractiveAppSimulator({ compact = false }: SimulatorProps) {
  // Navigation: matches Expo (tabs): index | scan | search | recommend | garden
  const [activeTab, setActiveTab] = useState<"home" | "scan" | "search" | "recommend" | "garden">("home");
  const [selectedPlant, setSelectedPlant] = useState<(typeof FLORA_DATABASE)[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [simLang, setSimLang] = useState<"en" | "fr" | "ar">("en");
  const [currentTime, setCurrentTime] = useState("09:41");
  const [selectedRegionIdx, setSelectedRegionIdx] = useState(0);

  // Scanner State
  const [selectedSpecimen, setSelectedSpecimen] = useState(FLORA_DATABASE[3]); // Thymus
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<(typeof FLORA_DATABASE)[0] | null>(FLORA_DATABASE[3]);
  const [selectedOrgan, setSelectedOrgan] = useState("Leaf");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  // Garden / Agronomic Calculator State
  const [gardenWilayaIdx, setGardenWilayaIdx] = useState(0);
  const [gardenCropIdx, setGardenCropIdx] = useState(3);
  const [ambientTemp, setAmbientTemp] = useState(25);
  const [sunHours, setSunHours] = useState(8);
  const [soilMoisture, setSoilMoisture] = useState(40);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className={styles.wrapper}>
      {/* Simulator Top Controls */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.liveBadge}>
            <span className={styles.liveDot}></span>
            EXPO SDK 57 NATIVE
          </span>
          <span className={styles.deviceTag}>iPhone 16 Pro</span>
        </div>

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
      </div>

      {/* iPhone 16 Pro Chassis */}
      <div className={styles.chassis}>
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

          {/* Native Expo Top Brand Header (Matches _layout.tsx) */}
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
            {/* ================================================================ */}
            {/* TAB 1: HOME SCREEN (Exact Expo index.tsx Replica) */}
            {/* ================================================================ */}
            {activeTab === "home" && (
              <div className={styles.homeContainer}>
                {/* 1. Immersive Botanical Mountain Hero Card */}
                <div className={styles.heroCard}>
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
                      <h2 className={styles.heroMainTitle}>
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
                    <div className={styles.heroSearchBar}>
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

                {/* 2. Visual Statistics Cards (4 Columns) */}
                <div className={styles.statsGrid}>
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

                {/* 3. Essential Modules Section (2x2 Grid) */}
                <div className={styles.sectionTitleRow}>
                  <h3 className={styles.sectionTitle}>Essential Modules</h3>
                  <p className={styles.sectionSubtitle}>Select a tool to launch</p>
                </div>

                <div className={styles.actionGrid}>
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
                      <strong>{REGIONS_DATA[selectedRegionIdx].et0}</strong>
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
            )}

            {/* ================================================================ */}
            {/* TAB 2: SCANNER (Exact Expo scan.tsx Replica) */}
            {/* ================================================================ */}
            {activeTab === "scan" && (
              <div className={styles.scannerContainer}>
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
                <div className={styles.viewfinderCard}>
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

                {/* Scan Result */}
                {scanResult && !isScanning && (
                  <div className={styles.scanResultCard}>
                    <div className={styles.scanResultHeader}>
                      <div>
                        <span className={styles.confidenceBadge}>98.4% Match Pl@ntNet & Vision</span>
                        <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: "4px 0 2px 0" }}>
                          {scanResult.scientific}
                        </h4>
                        <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>
                          {scanResult.french} • {scanResult.arabic}
                        </p>
                      </div>
                      <CheckCircle2 size={22} color="#059669" />
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

                    <button
                      className={styles.openMonographBtn}
                      onClick={() => setSelectedPlant(scanResult)}
                    >
                      <span>View Clinical Monograph</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================ */}
            {/* TAB 3: SEARCH / CATALOG (Exact Expo search.tsx Replica) */}
            {/* ================================================================ */}
            {activeTab === "search" && (
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

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
            )}

            {/* ================================================================ */}
            {/* TAB 4: NEEDS & REMEDIES (Exact Expo recommend.tsx Replica) */}
            {/* ================================================================ */}
            {activeTab === "recommend" && (
              <div className={styles.remediesContainer}>
                <div className={styles.sectionTitleRow}>
                  <h3 className={styles.sectionTitle}>Botanical Recommendations</h3>
                  <p className={styles.sectionSubtitle}>Targeted pharmacological synergies</p>
                </div>

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
            )}

            {/* ================================================================ */}
            {/* TAB 5: GARDEN & IRRIGATION (Exact Expo garden.tsx Replica) */}
            {/* ================================================================ */}
            {activeTab === "garden" && (
              <div className={styles.gardenContainer}>
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

                {/* Calculation Output */}
                <div className={styles.waterResultCard}>
                  <div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#059669", letterSpacing: "0.04em" }}>
                      DAILY WATER REQUIREMENT (ETc)
                    </span>
                    <h2 className={styles.waterValueBig}>
                      {waterNeedLiters} <small>L / plant / day</small>
                    </h2>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    <div style={{ background: "#ffffff", padding: "6px", borderRadius: "10px", textAlign: "center", border: "1px solid #d1fae5" }}>
                      <span style={{ fontSize: "0.6rem", color: "#64748B", display: "block" }}>ET₀ Penman</span>
                      <strong style={{ fontSize: "0.8rem", color: "#0F172A" }}>{et0} mm/j</strong>
                    </div>
                    <div style={{ background: "#ffffff", padding: "6px", borderRadius: "10px", textAlign: "center", border: "1px solid #d1fae5" }}>
                      <span style={{ fontSize: "0.6rem", color: "#64748B", display: "block" }}>Coeff. Kc</span>
                      <strong style={{ fontSize: "0.8rem", color: "#0F172A" }}>{currentCrop.fao.kc}</strong>
                    </div>
                    <div style={{ background: "#ffffff", padding: "6px", borderRadius: "10px", textAlign: "center", border: "1px solid #d1fae5" }}>
                      <span style={{ fontSize: "0.6rem", color: "#64748B", display: "block" }}>Hydration</span>
                      <strong style={{ fontSize: "0.8rem", color: soilMoisture < 35 ? "#D97706" : "#059669" }}>
                        {soilMoisture < 35 ? "Deficit" : "Optimal"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* SLIDE-UP MONOGRAPH MODAL */}
          {/* ================================================================ */}
          {selectedPlant && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalSheet}>
                <button className={styles.modalCloseBtn} onClick={() => setSelectedPlant(null)}>
                  <X size={18} />
                </button>

                <div className={styles.modalScroll}>
                  <div className={styles.modalHeroImg}>
                    <Image src={selectedPlant.image} alt={selectedPlant.scientific} fill style={{ objectFit: "cover" }} />
                  </div>

                  <div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>
                      {selectedPlant.family} • {selectedPlant.grade}
                    </span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0F172A", margin: "2px 0" }}>
                      {selectedPlant.scientific}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0 }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
                        <span style={{ color: "#64748B" }}>pH du sol:</span>
                        <strong>{selectedPlant.fao.soilPh}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
                        <span style={{ color: "#64748B" }}>Pluviométrie:</span>
                        <strong>{selectedPlant.fao.rainfall}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
                        <span style={{ color: "#64748B" }}>Température:</span>
                        <strong>{selectedPlant.fao.tempRange}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* FLOATING BOTTOM TAB BAR (Exact Expo _layout.tsx Replica) */}
          {/* ================================================================ */}
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
    </div>
  );
}
