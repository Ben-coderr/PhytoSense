"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Leaf,
  Camera,
  Search,
  Droplets,
  HeartPulse,
  BookOpen,
  Sparkles,
  ChevronRight,
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Thermometer,
  Sun,
  ShieldCheck,
  Compass,
  ArrowRight,
  Info,
  Maximize2,
  Smartphone,
  ExternalLink,
  Sliders,
  Check,
  Globe,
} from "lucide-react";

// Specimen Data for Local Demo & Interactive Exploration
const SPECIMENS = [
  {
    id: 1,
    scientific: "Thymus vulgaris L.",
    arabic: "الزعتر البري (Zaatar)",
    french: "Thym Commun",
    family: "Lamiaceae",
    category: "respiratory",
    grade: "Grade A",
    image: "/specimens/thyme.jpg",
    bioactive: "Thymol (45-55%), Carvacrol (5-10%), Acide rosmarinique",
    indication: "Antiseptique bronchique, toux grasse, désinfection des voies respiratoires",
    preparation: "Infusion: 2g de sommités fleuries séchées dans 200ml d'eau frémissante (90°C) pendant 10 minutes à couvert.",
    dosage: "2 à 3 tasses par jour après les repas.",
    contraindications: "Déconseillé aux personnes souffrant d'insuffisance hépatique sévère. Prudence chez la femme enceinte.",
    fao: {
      soilPh: "6.0 - 8.2",
      rainfall: "300 - 650 mm/an",
      tempRange: "5°C - 35°C",
      kc: 0.75,
    },
    ethno: "Traditionnellement cueilli dans les monts de l'Atlas tellien pour traiter les affections hivernales et la dyspepsie.",
  },
  {
    id: 2,
    scientific: "Rosmarinus officinalis L.",
    arabic: "إكليل الجبل (Iklil Al-Jabal)",
    french: "Romarin Officinal",
    family: "Lamiaceae",
    category: "digestion",
    grade: "Grade A",
    image: "/specimens/rosemary.jpg",
    bioactive: "1,8-Cinéole, Carnosol, Acide carnosique, Camphre",
    indication: "Insuffisance biliaire, fatigue cérébrale, microcirculation, antioxydant majeur",
    preparation: "Décoction légère: Faire bouillir 3g de feuilles pendant 3 minutes, puis laisser infuser 10 minutes.",
    dosage: "1 tasse le matin et 1 tasse à midi avant les repas.",
    contraindications: "Éviter le soir (effet stimulant). Contre-indiqué en cas d'obstruction des voies biliaires.",
    fao: {
      soilPh: "6.5 - 8.5",
      rainfall: "250 - 600 mm/an",
      tempRange: "8°C - 38°C",
      kc: 0.70,
    },
    ethno: "Consommé en Algérie en synergie avec l'huile d'olive pour soulager les courbatures et stimuler la mémoire.",
  },
  {
    id: 3,
    scientific: "Nigella sativa L.",
    arabic: "السانوج • حبة البركة (Sanouj)",
    french: "Cumin Noir / Nigelle",
    family: "Ranunculaceae",
    category: "immunity",
    grade: "Grade A",
    image: "/specimens/nigella.jpg",
    bioactive: "Thymoquinone (30-48%), Nigellone, Acide linoléique (56%)",
    indication: "Stimulation immunitaire, asthme allergique, régulation glycémique",
    preparation: "Graines broyées fraîches mélangées à du miel pur de montagne ou huile pressée à froid.",
    dosage: "1 cuillère à café rase de graines moulues par jour le matin à jeun.",
    contraindications: "Usage culinaire sécurisé. Éviter les doses massives chez la femme enceinte (effet emménagogue).",
    fao: {
      soilPh: "6.0 - 7.8",
      rainfall: "350 - 700 mm/an",
      tempRange: "10°C - 32°C",
      kc: 0.85,
    },
    ethno: "Remède panacée emblématique du Maghreb, cité pour ses vertus respiratoires et anti-inflammatoires globales.",
  },
  {
    id: 4,
    scientific: "Artemisia herba-alba Asso",
    arabic: "الشيح الأبيض (Chih)",
    french: "Armoise Blanche",
    family: "Asteraceae",
    category: "digestion",
    grade: "Grade A",
    image: "/specimens/chih.jpg",
    bioactive: "Santonine, Thujone, Camphre, Chrysanthénone",
    indication: "Antispasmodique gastro-intestinal, vermifuge, adjuvant hypoglycémiant",
    preparation: "Infusion courte: 1g de sommités fleuries séchées dans 250ml d'eau chaude (8 minutes max).",
    dosage: "1 tasse par jour, cures limitées à 7 jours consécutifs maximum.",
    contraindications: "Neurotoxique à forte dose (présence de thujone). Strictement interdit chez la femme enceinte.",
    fao: {
      soilPh: "7.0 - 8.8",
      rainfall: "100 - 350 mm/an (Hauts-Plateaux steppiques)",
      tempRange: "-2°C - 42°C",
      kc: 0.50,
    },
    ethno: "Plante reine de la steppe algérienne (Djelfa, Naâma, Biskra), régulatrice des troubles gastriques traditionnels.",
  },
];

const WILAYAS = [
  { name: "Alger (Littoral)", et0Base: 3.4, rain: 600, climate: "Subhumide côtier" },
  { name: "Oran (Tell Ouest)", et0Base: 3.6, rain: 420, climate: "Semi-aride maritime" },
  { name: "Constantine (Est)", et0Base: 3.2, rain: 550, climate: "Continental subhumide" },
  { name: "Batna (Aurès)", et0Base: 3.8, rain: 350, climate: "Semi-aride d'altitude" },
  { name: "Biskra (Ziban)", et0Base: 5.2, rain: 150, climate: "Aride présaharien" },
  { name: "Tlemcen (Plateaux)", et0Base: 3.5, rain: 480, climate: "Méditerranéen d'altitude" },
  { name: "Ghardaïa (Mzab)", et0Base: 5.8, rain: 90, climate: "Saharien hyper-aride" },
];

const AILMENTS = [
  {
    id: "respiratory",
    labelEn: "Cough & Respiration",
    labelFr: "Toux & Voies Respiratoires",
    labelAr: "السعال والتنفس",
    icon: "🫁",
    plantId: 1,
    advice: "Infusion de Thymus vulgaris + cuillère de miel de montagne matin et soir.",
  },
  {
    id: "digestion",
    labelEn: "Bloating & Spasms",
    labelFr: "Ballonnements & Spasmes",
    labelAr: "الانتفاخ والمغص الهضمي",
    icon: "🍵",
    plantId: 4,
    advice: "Infusion légère d'Artemisia herba-alba après le repas principal (cure de 5 jours).",
  },
  {
    id: "immunity",
    labelEn: "Immunity Boost",
    labelFr: "Défense Immunitaire",
    labelAr: "المناعة العامة والوقاية",
    icon: "🛡️",
    plantId: 3,
    advice: "Graines de Nigella sativa finement broyées avec miel tiède le matin à jeun.",
  },
  {
    id: "memory",
    labelEn: "Memory & Focus",
    labelFr: "Concentration & Fatigue",
    labelAr: "الذاكرة والتركيز الذهني",
    icon: "🧠",
    plantId: 2,
    advice: "Infusion matinale de Rosmarinus officinalis pour tonifier le tonus cérébral.",
  },
];

interface SimulatorProps {
  compact?: boolean;
}

export default function InteractiveAppSimulator({ compact = false }: SimulatorProps) {
  // Simulator State
  const [activeTab, setActiveTab] = useState<"catalog" | "scanner" | "garden" | "remedies" | "info">("catalog");
  const [selectedPlant, setSelectedPlant] = useState<(typeof SPECIMENS)[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [simLang, setSimLang] = useState<"fr" | "ar" | "en">("fr");
  const [currentTime, setCurrentTime] = useState("09:41");

  // Scanner State
  const [scannedSpecimen, setScannedSpecimen] = useState<(typeof SPECIMENS)[0]>(SPECIMENS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<(typeof SPECIMENS)[0] | null>(SPECIMENS[0]);
  const [selectedOrgan, setSelectedOrgan] = useState("Feuille");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agronomic Irrigation Calculator State
  const [selectedWilaya, setSelectedWilaya] = useState(WILAYAS[0]);
  const [selectedCrop, setSelectedCrop] = useState(SPECIMENS[0]);
  const [ambientTemp, setAmbientTemp] = useState(24);
  const [sunHours, setSunHours] = useState(8);
  const [soilMoisture, setSoilMoisture] = useState(45);

  // Field Journal State
  const [journalEntries, setJournalEntries] = useState([
    {
      id: "j1",
      plant: "Thymus vulgaris L.",
      location: "Djebel Ouarsenis (35.88°N, 1.95°E)",
      date: "Aujourd'hui",
      waterDays: 2,
    },
    {
      id: "j2",
      plant: "Rosmarinus officinalis L.",
      location: "Col des Oliviers (36.42°N, 2.81°E)",
      date: "Hier",
      waterDays: 4,
    },
  ]);

  // Digital Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Plants in Catalog
  const filteredPlants = SPECIMENS.filter((p) => {
    const matchesSearch =
      p.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.french.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.arabic.includes(searchQuery);
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Precision Irrigation ($ET_c$)
  // FAO-56 Penman-Monteith approximation formula
  const tempCorrection = (ambientTemp - 20) * 0.08;
  const solarFactor = (sunHours / 8) * 0.9;
  const et0 = Math.max(1.8, Number((selectedWilaya.et0Base + tempCorrection + (solarFactor - 0.9)).toFixed(2)));
  const etc = Number((et0 * selectedCrop.fao.kc).toFixed(2));
  // Plant canopy area approximation (0.5 m²) converted to Litres/day
  const waterNeedLiters = Number(((etc * 0.5 * (100 - soilMoisture)) / 50).toFixed(1));

  // Run Simulated Scan
  const handleScanAction = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(scannedSpecimen);
    }, 1400);
  };

  // Upload Custom Specimen
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setIsScanning(true);
        setTimeout(() => {
          setIsScanning(false);
          setScanResult(SPECIMENS[0]); // Best AI match
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const isRtl = simLang === "ar";

  return (
    <div className={`app-simulator-wrapper ${compact ? "compact-mode" : ""}`}>
      {/* Top Simulator Controls Toolbar */}
      <div className="simulator-toolbar">
        <div className="toolbar-left">
          <span className="live-badge">
            <span className="pulse-dot"></span>
            LIVE IPHONE DEMO
          </span>
          <span className="device-tag">iPhone 16 Pro • Expo SDK 57</span>
        </div>

        <div className="toolbar-right">
          <div className="sim-lang-picker">
            <Globe size={14} />
            <button
              className={`lang-chip ${simLang === "fr" ? "active" : ""}`}
              onClick={() => setSimLang("fr")}
            >
              FR
            </button>
            <button
              className={`lang-chip ${simLang === "ar" ? "active" : ""}`}
              onClick={() => setSimLang("ar")}
            >
              عربي
            </button>
            <button
              className={`lang-chip ${simLang === "en" ? "active" : ""}`}
              onClick={() => setSimLang("en")}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Realistic iPhone Chassis */}
      <div className="iphone-chassis">
        {/* Hardware Bezel & Glass Reflection */}
        <div className="iphone-inner-frame">
          {/* iOS Dynamic Island & Status Bar */}
          <div className="ios-status-bar">
            <span className="ios-time">{currentTime}</span>

            {/* Dynamic Island */}
            <div className="dynamic-island">
              <span className="island-dot"></span>
              <span className="island-text">
                {isScanning ? "Analyse IA..." : "🌿 PhytoSense"}
              </span>
            </div>

            <div className="ios-icons">
              <span className="signal-bars">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
              <span className="wifi-icon">5G</span>
              <span className="battery-pill">
                <span className="battery-fill"></span>
              </span>
            </div>
          </div>

          {/* Interactive Screen Viewport */}
          <div className={`iphone-screen-content ${isRtl ? "sim-rtl" : ""}`}>
            {/* TAB 1: HERBARIUM & CATALOG */}
            {activeTab === "catalog" && (
              <div className="sim-screen catalog-view">
                <div className="sim-header">
                  <div className="header-top">
                    <div>
                      <span className="header-tag">
                        {simLang === "ar"
                          ? "الفلورا الطبية للجزائر"
                          : simLang === "fr"
                          ? "Flore Médicinale d'Algérie"
                          : "Medicinal Algerian Flora"}
                      </span>
                      <h2 className="header-title">
                        {simLang === "ar" ? "معشبة فيتوسنس" : "PhytoSense Herbier"}
                      </h2>
                    </div>
                    <div className="offline-pill">
                      <ShieldCheck size={12} />
                      <span>{simLang === "ar" ? "دون إنترنت" : "Hors-Ligne"}</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="sim-search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder={
                        simLang === "ar"
                          ? "ابحث بالاسم العلمي، العربي أو الفرنسي..."
                          : simLang === "fr"
                          ? "Rechercher une plante, famille..."
                          : "Search scientific or vernacular..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="clear-search">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Categories Chips */}
                  <div className="sim-chips-scroll">
                    {[
                      { id: "all", fr: "Toutes", ar: "الكل", en: "All" },
                      { id: "respiratory", fr: "Respiratoire", ar: "تنفسي", en: "Respiratory" },
                      { id: "digestion", fr: "Digestif", ar: "هضمي", en: "Digestive" },
                      { id: "immunity", fr: "Immunité", ar: "مناعة", en: "Immunity" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        className={`sim-chip ${selectedCategory === cat.id ? "active" : ""}`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat[simLang]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plant Cards List */}
                <div className="sim-plants-list">
                  {filteredPlants.map((plant) => (
                    <div
                      key={plant.id}
                      className="sim-plant-card"
                      onClick={() => setSelectedPlant(plant)}
                    >
                      <div className="plant-card-thumb">
                        <Image
                          src={plant.image}
                          alt={plant.scientific}
                          width={80}
                          height={80}
                          className="thumb-img"
                        />
                        <span className="card-grade-badge">{plant.grade}</span>
                      </div>
                      <div className="plant-card-info">
                        <span className="card-family">{plant.family}</span>
                        <h4 className="card-name">{plant.scientific}</h4>
                        <p className="card-vernacular">
                          {simLang === "ar" ? plant.arabic : plant.french}
                        </p>
                        <div className="card-molecule-pill">
                          <Sparkles size={11} />
                          <span>{plant.bioactive.split(",")[0]}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="card-chevron" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: AI BOTANICAL SCANNER */}
            {activeTab === "scanner" && (
              <div className="sim-screen scanner-view">
                {/* Camera Viewfinder Header */}
                <div className="scanner-hud-header">
                  <div>
                    <span className="hud-badge">IA VISION MULTIMODALE</span>
                    <h3>{simLang === "ar" ? "ماسح النباتات الذكي" : "Scanner Botanique"}</h3>
                  </div>
                  <span className="hud-status">
                    <span className="green-live"></span>
                    {simLang === "ar" ? "مفعل" : "Capteur Actif"}
                  </span>
                </div>

                {/* Live Viewfinder Frame */}
                <div className="camera-viewfinder">
                  <Image
                    src={customImage || scannedSpecimen.image}
                    alt="Current Specimen"
                    fill
                    className="viewfinder-specimen-img"
                  />

                  {/* Laser Scan Animation */}
                  <div className={`scan-reticle ${isScanning ? "scanning-active" : ""}`}>
                    <div className="corner corner-tl"></div>
                    <div className="corner corner-tr"></div>
                    <div className="corner corner-bl"></div>
                    <div className="corner corner-br"></div>
                    <div className="laser-sweep"></div>
                    <div className="center-target">
                      <Sparkles size={24} />
                    </div>
                  </div>

                  {/* Specimen Presets Carousel */}
                  <div className="viewfinder-presets">
                    <span className="presets-label">
                      {simLang === "ar" ? "اختر عينة تجريبية:" : "Spécimens Test:"}
                    </span>
                    <div className="presets-row">
                      {SPECIMENS.map((s) => (
                        <button
                          key={s.id}
                          className={`preset-btn ${scannedSpecimen.id === s.id && !customImage ? "active" : ""}`}
                          onClick={() => {
                            setCustomImage(null);
                            setScannedSpecimen(s);
                            setScanResult(null);
                          }}
                        >
                          <Image src={s.image} alt={s.scientific} width={34} height={34} />
                        </button>
                      ))}
                      {/* Upload Photo Button */}
                      <button
                        className="preset-btn upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Importer une photo"
                      >
                        <Upload size={16} />
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Organ Selector */}
                <div className="organ-selector-row">
                  {["Auto", "Feuille", "Fleur", "Fruit"].map((org) => (
                    <button
                      key={org}
                      className={`organ-btn ${selectedOrgan === org ? "active" : ""}`}
                      onClick={() => setSelectedOrgan(org)}
                    >
                      {org}
                    </button>
                  ))}
                </div>

                {/* Trigger Scan Button */}
                <button
                  className={`trigger-scan-btn ${isScanning ? "is-busy" : ""}`}
                  onClick={handleScanAction}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={18} className="spin-icon" />
                      <span>
                        {simLang === "ar" ? "جارِ التحليل البيوكيميائي..." : "Extraction des descripteurs IA..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      <span>
                        {simLang === "ar" ? "التعرف على النبات الآن" : "Identifier le Spécimen"}
                      </span>
                    </>
                  )}
                </button>

                {/* Scan Result Card */}
                {scanResult && !isScanning && (
                  <div className="scan-result-card">
                    <div className="result-header">
                      <div>
                        <span className="match-score">98.4% Match Pl@ntNet & Vision</span>
                        <h4 className="result-species">{scanResult.scientific}</h4>
                        <p className="result-common">
                          {simLang === "ar" ? scanResult.arabic : scanResult.french}
                        </p>
                      </div>
                      <span className="result-badge-verified">
                        <CheckCircle2 size={16} />
                      </span>
                    </div>

                    <div className="diagnostic-trace">
                      <div className="trace-item">
                        <span className="trace-dot ok"></span>
                        <span>Tier 1: Pl@ntNet API (98.4%)</span>
                      </div>
                      <div className="trace-item">
                        <span className="trace-dot ok"></span>
                        <span>Tier 2: Kindwise Vision (Confirmé)</span>
                      </div>
                      <div className="trace-item">
                        <span className="trace-dot ok"></span>
                        <span>Tier 3: Cache FTS5 Local (Synchronisé)</span>
                      </div>
                    </div>

                    <button
                      className="view-monograph-btn"
                      onClick={() => setSelectedPlant(scanResult)}
                    >
                      <span>
                        {simLang === "ar" ? "فتح البطاقة الطبية الكاملة" : "Ouvrir la Monographie Clinique"}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SMART GARDEN & IRRIGATION */}
            {activeTab === "garden" && (
              <div className="sim-screen garden-view">
                <div className="sim-header">
                  <span className="header-tag">CALCULATEUR AGRONOMIQUE FAO-56</span>
                  <h2 className="header-title">
                    {simLang === "ar" ? "الري الدقيق والطقس" : "Jardin & Irrigation"}
                  </h2>
                </div>

                <div className="garden-content-scroll">
                  {/* Location Selector */}
                  <div className="agri-control-box">
                    <div className="control-label">
                      <MapPin size={15} />
                      <span>{simLang === "ar" ? "الولاية / المنطقة:" : "Wilaya & Étage Bioclimatique:"}</span>
                    </div>
                    <select
                      value={selectedWilaya.name}
                      onChange={(e) => {
                        const found = WILAYAS.find((w) => w.name === e.target.value);
                        if (found) setSelectedWilaya(found);
                      }}
                      className="sim-select"
                    >
                      {WILAYAS.map((w) => (
                        <option key={w.name} value={w.name}>
                          {w.name} — {w.climate}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Crop Selector */}
                  <div className="agri-control-box">
                    <div className="control-label">
                      <Leaf size={15} />
                      <span>{simLang === "ar" ? "المحصول المستهدف:" : "Culture Cible (Kc):"}</span>
                    </div>
                    <select
                      value={selectedCrop.id}
                      onChange={(e) => {
                        const found = SPECIMENS.find((s) => s.id === Number(e.target.value));
                        if (found) setSelectedCrop(found);
                      }}
                      className="sim-select"
                    >
                      {SPECIMENS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.scientific} ({s.french}) — Kc: {s.fao.kc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Interactive Sliders */}
                  <div className="slider-card">
                    <div className="slider-row">
                      <div className="slider-header">
                        <span>
                          <Thermometer size={14} /> Température: <strong>{ambientTemp}°C</strong>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="45"
                        value={ambientTemp}
                        onChange={(e) => setAmbientTemp(Number(e.target.value))}
                        className="sim-range"
                      />
                    </div>

                    <div className="slider-row">
                      <div className="slider-header">
                        <span>
                          <Sun size={14} /> Ensoleillement: <strong>{sunHours} h/jour</strong>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="14"
                        value={sunHours}
                        onChange={(e) => setSunHours(Number(e.target.value))}
                        className="sim-range"
                      />
                    </div>

                    <div className="slider-row">
                      <div className="slider-header">
                        <span>
                          <Droplets size={14} /> Humidité du Sol: <strong>{soilMoisture}%</strong>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={soilMoisture}
                        onChange={(e) => setSoilMoisture(Number(e.target.value))}
                        className="sim-range"
                      />
                    </div>
                  </div>

                  {/* Real-time Calculation Result */}
                  <div className="irrigation-result-card">
                    <div className="water-header">
                      <div>
                        <span className="water-tag">BESOIN EN EAU DU JOUR (ETc)</span>
                        <div className="water-value">
                          {waterNeedLiters} <small>L / plant / jour</small>
                        </div>
                      </div>
                      <div className="water-icon-circle">
                        <Droplets size={26} />
                      </div>
                    </div>

                    <div className="agri-metrics-grid">
                      <div className="metric-cell">
                        <span>ET₀ Penman</span>
                        <strong>{et0} mm/j</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Coeff. Kc</span>
                        <strong>{selectedCrop.fao.kc}</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Statut Sol</span>
                        <strong className={soilMoisture < 35 ? "status-alert" : "status-ok"}>
                          {soilMoisture < 35 ? "Déficit" : "Optimal"}
                        </strong>
                      </div>
                    </div>

                    <div className="agri-advice-box">
                      <Info size={14} />
                      <p>
                        {simLang === "ar"
                          ? "يوصى بالري بالتنقيط في الصباح الباكر لتقليل التبخر السطحي."
                          : "Privilégier le goutte-à-goutte à l'aube pour optimiser l'efficience hydrique."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: THERAPEUTIC REMEDIES & NEEDS */}
            {activeTab === "remedies" && (
              <div className="sim-screen remedies-view">
                <div className="sim-header">
                  <span className="header-tag">SYNERGIE & PHARMACOLOGIE</span>
                  <h2 className="header-title">
                    {simLang === "ar" ? "استشارة المعشبة" : "Besoins & Remèdes"}
                  </h2>
                </div>

                <div className="remedies-content-scroll">
                  <p className="remedies-sub">
                    {simLang === "ar"
                      ? "اختر العارض الصحي لعرض البروتوكول الطبيعي المناسب:"
                      : "Sélectionnez votre symptôme pour découvrir la synergie botanique recommandée :"}
                  </p>

                  <div className="ailments-list">
                    {AILMENTS.map((item) => {
                      const matchedPlant = SPECIMENS.find((p) => p.id === item.plantId)!;
                      return (
                        <div
                          key={item.id}
                          className="ailment-card"
                          onClick={() => setSelectedPlant(matchedPlant)}
                        >
                          <div className="ailment-header">
                            <span className="ailment-icon">{item.icon}</span>
                            <div className="ailment-text">
                              <h4>
                                {simLang === "ar"
                                  ? item.labelAr
                                  : simLang === "fr"
                                  ? item.labelFr
                                  : item.labelEn}
                              </h4>
                              <p className="matched-plant-label">
                                🌿 {matchedPlant.scientific} ({matchedPlant.french})
                              </p>
                            </div>
                            <ChevronRight size={16} />
                          </div>
                          <div className="ailment-protocol">
                            <strong>Protocole: </strong>
                            <span>{item.advice}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: JOURNAL & ABOUT */}
            {activeTab === "info" && (
              <div className="sim-screen info-view">
                <div className="sim-header">
                  <span className="header-tag">SYSTÈME & MONOGRAPHIER</span>
                  <h2 className="header-title">
                    {simLang === "ar" ? "دفتر الميدان والمعلومات" : "Journal & À Propos"}
                  </h2>
                </div>

                <div className="info-content-scroll">
                  {/* Field Journal Log */}
                  <div className="journal-section">
                    <div className="journal-header-row">
                      <h4>{simLang === "ar" ? "عينات ميدانية مسجلة" : "Herbier de Terrain"}</h4>
                      <span className="badge-count">{journalEntries.length}</span>
                    </div>

                    {journalEntries.map((entry) => (
                      <div key={entry.id} className="journal-entry-card">
                        <div className="entry-dot"></div>
                        <div className="entry-info">
                          <h5>{entry.plant}</h5>
                          <span className="entry-loc">{entry.location}</span>
                          <span className="entry-time">{entry.date}</span>
                        </div>
                        <div className="entry-water-badge">
                          <Droplets size={12} />
                          <span>Dans {entry.waterDays}j</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Architecture & Thesis Credits */}
                  <div className="academic-credits-card">
                    <div className="credits-badge">PFE MASTER 2026</div>
                    <h4>PhytoSense Autonomous Botanical Ecosystem</h4>
                    <p className="author-line">
                      Réalisé par <strong>Benkorich Abdenour</strong>
                      <br />
                      Faculté des Sciences Exactes & Informatique
                      <br />
                      Université Abdelhamid Ibn Badis de Mostaganem (UMAB)
                    </p>

                    <div className="tech-stack-chips">
                      <span>Next.js 16</span>
                      <span>Expo SDK 57</span>
                      <span>FastAPI</span>
                      <span>SQLite FTS5</span>
                      <span>Offline First</span>
                    </div>

                    <a
                      href="https://github.com/Ben-coderr/PhytoSense/releases/download/v2.0.0/PhytoSense-v2.0.0.apk"
                      className="download-apk-sim-btn"
                      download
                    >
                      <Smartphone size={16} />
                      <span>Télécharger l'APK Android (v2.0.0)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plant Detail Sheet Modal (Full Monograph) */}
          {selectedPlant && (
            <div className="plant-dossier-overlay">
              <div className="plant-dossier-sheet">
                <button
                  className="close-dossier-btn"
                  onClick={() => setSelectedPlant(null)}
                >
                  <X size={18} />
                </button>

                <div className="dossier-scroll">
                  <div className="dossier-hero">
                    <Image
                      src={selectedPlant.image}
                      alt={selectedPlant.scientific}
                      fill
                      className="dossier-img"
                    />
                    <div className="dossier-hero-gradient"></div>
                    <div className="dossier-hero-text">
                      <span className="dossier-family">{selectedPlant.family}</span>
                      <h3>{selectedPlant.scientific}</h3>
                      <p>
                        {selectedPlant.french} • {selectedPlant.arabic}
                      </p>
                    </div>
                  </div>

                  <div className="dossier-body">
                    {/* Bioactive Compounds */}
                    <div className="dossier-card">
                      <div className="card-heading">
                        <Sparkles size={16} className="icon-green" />
                        <h4>Principes Actifs & Métabolites</h4>
                      </div>
                      <p className="card-text">{selectedPlant.bioactive}</p>
                    </div>

                    {/* Indications */}
                    <div className="dossier-card">
                      <div className="card-heading">
                        <HeartPulse size={16} className="icon-emerald" />
                        <h4>Indications Thérapeutiques</h4>
                      </div>
                      <p className="card-text">{selectedPlant.indication}</p>
                    </div>

                    {/* Preparation & Dosage */}
                    <div className="dossier-card">
                      <div className="card-heading">
                        <Droplets size={16} className="icon-blue" />
                        <h4>Préparation Galénique & Posologie</h4>
                      </div>
                      <p className="card-text">
                        <strong>Mode: </strong> {selectedPlant.preparation}
                      </p>
                      <p className="card-text" style={{ marginTop: "6px" }}>
                        <strong>Dose journalière: </strong> {selectedPlant.dosage}
                      </p>
                    </div>

                    {/* Warnings */}
                    <div className="dossier-card warning-box">
                      <div className="card-heading">
                        <AlertTriangle size={16} className="icon-amber" />
                        <h4>Contre-indications & Sécurité</h4>
                      </div>
                      <p className="card-text">{selectedPlant.contraindications}</p>
                    </div>

                    {/* FAO Ecocrop */}
                    <div className="dossier-card">
                      <div className="card-heading">
                        <Compass size={16} className="icon-purple" />
                        <h4>Exigences Bioclimatiques FAO-ECOCROP</h4>
                      </div>
                      <div className="fao-chips-grid">
                        <div className="fao-chip">
                          <span>pH Sol:</span>
                          <strong>{selectedPlant.fao.soilPh}</strong>
                        </div>
                        <div className="fao-chip">
                          <span>Pluviométrie:</span>
                          <strong>{selectedPlant.fao.rainfall}</strong>
                        </div>
                        <div className="fao-chip">
                          <span>Température:</span>
                          <strong>{selectedPlant.fao.tempRange}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Ethnobotany */}
                    <div className="dossier-card">
                      <div className="card-heading">
                        <BookOpen size={16} className="icon-teal" />
                        <h4>Usage Ethnobotanique Maghrébin</h4>
                      </div>
                      <p className="card-text">{selectedPlant.ethno}</p>
                    </div>

                    {/* Add to Journal Button */}
                    <button
                      className="add-journal-btn"
                      onClick={() => {
                        setJournalEntries((prev) => [
                          {
                            id: `j-${Date.now()}`,
                            plant: selectedPlant.scientific,
                            location: "Relevé GPS Manuel (36.75°N, 3.05°E)",
                            date: "Aujourd'hui",
                            waterDays: 3,
                          },
                          ...prev,
                        ]);
                        setSelectedPlant(null);
                        setActiveTab("info");
                      }}
                    >
                      <Check size={16} />
                      <span>Ajouter à mon Herbier de Terrain</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom iOS Navigation Bar (Tabs) */}
          <div className="ios-tab-bar">
            <button
              className={`tab-btn ${activeTab === "catalog" ? "active" : ""}`}
              onClick={() => setActiveTab("catalog")}
            >
              <BookOpen size={20} />
              <span>{simLang === "ar" ? "معشبة" : "Herbier"}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "scanner" ? "active" : ""}`}
              onClick={() => setActiveTab("scanner")}
            >
              <Camera size={22} className="camera-tab-icon" />
              <span>{simLang === "ar" ? "ماسح" : "Scanner"}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "garden" ? "active" : ""}`}
              onClick={() => setActiveTab("garden")}
            >
              <Droplets size={20} />
              <span>{simLang === "ar" ? "الري" : "Irrigation"}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "remedies" ? "active" : ""}`}
              onClick={() => setActiveTab("remedies")}
            >
              <HeartPulse size={20} />
              <span>{simLang === "ar" ? "علاج" : "Remèdes"}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <Info size={20} />
              <span>{simLang === "ar" ? "المزيد" : "Journal"}</span>
            </button>
          </div>

          {/* iOS Bottom Home Bar */}
          <div className="ios-home-indicator">
            <div className="home-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
