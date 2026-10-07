"use client";

import { useState, useRef } from "react";
import {
  Camera,
  Sparkles,
  BrainCircuit,
  Search,
  Database,
  Fingerprint,
  Activity,
  Zap,
  Upload,
  CloudSun,
  Stethoscope,
  FileText,
  Printer,
  Check,
  X,
  ShieldAlert,
  Droplets,
  MapPin,
  Calendar,
  AlertTriangle,
  Leaf,
  Thermometer,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

type Plant = {
  id: number;
  scientific_name: string;
  french_name: string;
  arabic_name: string;
  family: string;
  composition: string;
  composition_tags: string;
  biological_activity: string;
  activity_tags: string;
  region: string;
  part_used: string;
  similarity_score?: number;
};

type Prediction = {
  predicted_activities: string[];
  reasoning: string;
};

type SimilarPlantResult = {
  name: string;
  shared_compounds: string[];
  match_reason: string;
};

type ResearchResult = {
  scientific_name: string;
  region: string;
  researched_compounds: string[];
  similar_local_plants: SimilarPlantResult[];
  predicted_activities: string[];
};

const ALGERIA_LOCATIONS = [
  { name: "Alger (Littoral)", lat: 36.75, lon: 3.06 },
  { name: "Oran (Ouest)", lat: 35.69, lon: -0.63 },
  { name: "Constantine (Est)", lat: 36.36, lon: 6.61 },
  { name: "Batna (Aurès)", lat: 35.55, lon: 6.17 },
  { name: "Biskra (Ziban)", lat: 34.85, lon: 5.73 },
  { name: "Ghardaïa (Mzab)", lat: 32.49, lon: 3.67 },
];

const AVAILABLE_NEEDS = [
  { id: "sommeil", label: "Sommeil & Insomnie", icon: "🌙" },
  { id: "stress", label: "Stress & Anxiété", icon: "🧘" },
  { id: "digestion", label: "Digestion & Ballonnements", icon: "🍵" },
  { id: "peau", label: "Soins Cutanés & Acné", icon: "✨" },
  { id: "douleur", label: "Douleurs Articulaires", icon: "🌿" },
  { id: "toux", label: "Toux & Voies Respiratoires", icon: "🫁" },
  { id: "immunite", label: "Défenses Immunitaires", icon: "🛡️" },
  { id: "metabolisme", label: "Glycémie & Métabolisme", icon: "⚖️" },
];

const OBSERVABLE_SYMPTOMS = [
  { id: "yellowing", label: "Jaunissement des feuilles (Chlorose)" },
  { id: "leaf_spots", label: "Taches foliaires brunes ou nécrotiques" },
  { id: "powdery_mildew", label: "Duvet blanc farineux (Oïdium)" },
  { id: "wilting", label: "Flétrissement rapide malgré l'arrosage" },
  { id: "leaf_curl", label: "Enroulement et déformation des feuilles" },
  { id: "insect_damage", label: "Morsures ou feuilles perforées" },
  { id: "whiteflies", label: "Mouches blanches / Aleurodes sous feuilles" },
  { id: "aphids", label: "Pucerons / miellat collant sur tiges" },
];

export default function Home() {
  const { t, isRtl } = useLanguage();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"catalog" | "recommend" | "agronomy" | "diagnose">("catalog");

  // Catalogue State
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [monographOpen, setMonographOpen] = useState(false);

  // Deep Research State
  const [researchingPlant, setResearchingPlant] = useState(false);
  const [aiGeneratedResults, setAiGeneratedResults] = useState<ResearchResult[]>([]);
  const [selectedAIResult, setSelectedAIResult] = useState<ResearchResult | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recommender State
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [excludePregnancy, setExcludePregnancy] = useState(false);
  const [pediatricSafe, setPediatricSafe] = useState(false);
  const [recommendedPlants, setRecommendedPlants] = useState<any[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);

  // Agronomy State
  const [selectedCrop, setSelectedCrop] = useState("Nigella sativa L.");
  const [cropLat, setCropLat] = useState("36.75");
  const [cropLon, setCropLon] = useState("3.06");
  const [agronomyResult, setAgronomyResult] = useState<any>(null);
  const [agronomyLoading, setAgronomyLoading] = useState(false);

  // Diagnosis State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [diagnoseLoading, setDiagnoseLoading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err: any) {
      setError(t.dashboard.errorDenied + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
              stopCamera();
              handleFileUpload(file);
            }
          },
          "image/jpeg",
          0.9
        );
      }
    }
  };

  const clearState = () => {
    setQuery("");
    setLastQuery("");
    setResults([]);
    setAiGeneratedResults([]);
    setSelectedPlant(null);
    setSelectedAIResult(null);
    setError("");
    stopCamera();
  };

  const handleDeepResearch = async (scientificName: string) => {
    setResearchingPlant(true);
    try {
      const res = await fetch(`/api/plants/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scientific_name: scientificName }),
      });
      if (!res.ok) throw new Error("Deep research failed.");
      const data = await res.json();
      setAiGeneratedResults((prev) => [...prev, data]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResearchingPlant(false);
    }
  };

  const processPlantResponse = (data: any, originalQuery: string) => {
    if (data.found_local === false) {
      setResults([]);
      handleDeepResearch(data.scientific_name);
    } else if (data.found_local === true) {
      setResults(data.results);
      setLastQuery(originalQuery);
    } else {
      setResults(data);
      setLastQuery(originalQuery);
    }
  };

  const searchPlants = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    setAiGeneratedResults([]);
    setSelectedPlant(null);
    setSelectedAIResult(null);
    setResearchingPlant(false);

    try {
      const res = await fetch(`/api/plants/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error(t.dashboard.errorNotFound);
        throw new Error("Failed to search plants.");
      }
      const data = await res.json();
      processPlantResponse(data, query);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const predictProperties = async (plantId: number) => {
    setPredicting(true);
    setPrediction(null);
    try {
      const res = await fetch(`/api/plants/${plantId}/predict`);
      if (!res.ok) throw new Error("Prediction failed.");
      const data = await res.json();
      setPrediction(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPredicting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setResults([]);
    setAiGeneratedResults([]);
    setSelectedPlant(null);
    setSelectedAIResult(null);
    setResearchingPlant(false);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/plants/identify`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || t.dashboard.errorUpload);
      }

      const data = await res.json();
      processPlantResponse(data, data.results?.[0]?.scientific_name || "Image Upload");
      setQuery("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Recommender Handler
  const handleToggleNeed = (needId: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(needId) ? prev.filter((id) => id !== needId) : [...prev, needId]
    );
  };

  const handleFetchRecommendations = async () => {
    if (selectedNeeds.length === 0) return;
    setRecommendLoading(true);
    try {
      const res = await fetch("/v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          needs: selectedNeeds,
          exclude_pregnancy: excludePregnancy,
          pediatric_safe: pediatricSafe,
          limit: 6,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendedPlants(data.recommendations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecommendLoading(false);
    }
  };

  // Agronomy Handler
  const handleCalculateSuitability = async () => {
    setAgronomyLoading(true);
    try {
      const res = await fetch("/v1/cultivation/suitability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_name: selectedCrop,
          latitude: parseFloat(cropLat),
          longitude: parseFloat(cropLon),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAgronomyResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAgronomyLoading(false);
    }
  };

  // Diagnosis Handler
  const handleToggleSymptom = (symId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symId) ? prev.filter((id) => id !== symId) : [...prev, symId]
    );
  };

  const handleRunDiagnosis = async () => {
    if (selectedSymptoms.length === 0) return;
    setDiagnoseLoading(true);
    try {
      const res = await fetch("/v1/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          plant_type: "medicinal",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosisResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDiagnoseLoading(false);
    }
  };

  return (
    <div className={`dashboard-container ${isRtl ? "rtl-layout" : ""}`}>
      <header className="dashboard-header">
        <h1>{t.dashboard.title}</h1>
        <p>{t.dashboard.subtitle}</p>
      </header>

      {/* Main Module Tabs */}
      <div className="module-tabs no-print">
        <button
          className={`module-tab-btn ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("catalog");
            setSelectedPlant(null);
            setSelectedAIResult(null);
          }}
        >
          <Leaf size={18} />
          {t.dashboard.tabCatalog}
        </button>

        <button
          className={`module-tab-btn ${activeTab === "recommend" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("recommend");
            setSelectedPlant(null);
            setSelectedAIResult(null);
          }}
        >
          <Sparkles size={18} />
          {t.dashboard.tabRecommend}
        </button>

        <button
          className={`module-tab-btn ${activeTab === "agronomy" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("agronomy");
            setSelectedPlant(null);
            setSelectedAIResult(null);
          }}
        >
          <CloudSun size={18} />
          {t.dashboard.tabAgronomy}
        </button>

        <button
          className={`module-tab-btn ${activeTab === "diagnose" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("diagnose");
            setSelectedPlant(null);
            setSelectedAIResult(null);
          }}
        >
          <Stethoscope size={18} />
          {t.dashboard.tabDiagnose}
        </button>
      </div>

      <main>
        {/* ========================================================= */}
        {/* TAB 1: CATALOG & EXPLORATION                              */}
        {/* ========================================================= */}
        {activeTab === "catalog" && !selectedPlant && !selectedAIResult && (
          <>
            {!results.length && !aiGeneratedResults.length && !researchingPlant && (
              <div className="dashboard-action-grid">
                <div className="search-box-card">
                  <h2>
                    <Search size={24} /> {t.dashboard.searchTitle}
                  </h2>
                  <p style={{ marginBottom: "24px", color: "var(--text-secondary)" }}>
                    {t.dashboard.searchDesc}
                  </p>
                  <form
                    className="dashboard-form"
                    onSubmit={searchPlants}
                    style={{ display: "flex", gap: "12px", width: "100%" }}
                  >
                    <input
                      type="text"
                      className="input-field"
                      placeholder={t.dashboard.searchPlaceholder}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <div className="loader" /> : t.dashboard.searchBtn}
                    </button>
                  </form>
                </div>

                <div className="upload-dropzone" style={{ cursor: "default" }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={onFileChange}
                  />

                  {uploading ? (
                    <div style={{ padding: "40px" }}>
                      <div className="loader" style={{ margin: "0 auto 16px" }} />
                      <p style={{ fontWeight: 500 }}>{t.dashboard.analyzing}</p>
                    </div>
                  ) : showCamera ? (
                    <div style={{ position: "relative", width: "100%" }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: "100%", maxHeight: "300px", borderRadius: "12px", objectFit: "cover" }}
                      />
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
                        <button className="btn-primary" onClick={capturePhoto} style={{ padding: "10px 20px" }}>
                          <Camera size={16} /> {t.dashboard.snapPhoto}
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            padding: "10px 20px",
                            borderRadius: "12px",
                            cursor: "pointer",
                          }}
                          onClick={stopCamera}
                        >
                          {t.dashboard.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2>
                        <Camera size={24} /> {t.dashboard.identifyTitle}
                      </h2>
                      <p style={{ marginBottom: "24px", color: "var(--text-secondary)" }}>
                        {t.dashboard.identifyDesc}
                      </p>
                      <div className="photo-actions" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <button className="btn-primary" onClick={startCamera}>
                          <Camera size={18} /> {t.dashboard.takePhoto}
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ background: "white", color: "#0f172a" }}
                        >
                          <Upload size={18} /> {t.dashboard.uploadFile}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clear Button */}
            {(results.length > 0 || aiGeneratedResults.length > 0 || lastQuery) && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <p style={{ color: "var(--text-secondary)" }}>
                  Résultats pour : <strong style={{ color: "var(--text-primary)" }}>{lastQuery || query}</strong>
                </p>
                <button
                  onClick={clearState}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {t.dashboard.clearBtn}
                </button>
              </div>
            )}

            {error && <p style={{ color: "#ef4444", textAlign: "center", marginBottom: "20px" }}>{error}</p>}

            {/* Results Grid */}
            {(results.length > 0 || aiGeneratedResults.length > 0) && (
              <div className="results-grid">
                {results.map((plant) => (
                  <div key={`local-${plant.id}`} className="result-card" onClick={() => setSelectedPlant(plant)}>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "#0f172a" }}>
                      {plant.scientific_name}
                    </h3>
                    <p style={{ fontSize: "0.9rem", marginBottom: "12px", color: "var(--text-secondary)" }}>
                      {plant.french_name && <span>FR: {plant.french_name}<br /></span>}
                      {plant.arabic_name && <span>AR: {plant.arabic_name}</span>}
                    </p>
                    <div style={{ marginTop: "auto" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500 }}>
                        {t.dashboard.family}: {plant.family}
                      </p>
                      <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500 }}>
                        {t.dashboard.region}: {plant.region || "Algérie"}
                      </p>
                      {plant.similarity_score && (
                        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "8px" }}>
                          {t.dashboard.match}: {plant.similarity_score.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {aiGeneratedResults.map((aiResult, idx) => (
                  <div
                    key={`ai-${idx}`}
                    className="result-card"
                    style={{
                      border: "2px solid rgba(16, 185, 129, 0.4)",
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(2, 132, 199, 0.05) 100%)",
                    }}
                    onClick={() => setSelectedAIResult(aiResult)}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "var(--primary)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        marginBottom: "12px",
                      }}
                    >
                      <Sparkles size={12} /> {t.dashboard.aiGenerated}
                    </div>
                    <h3 style={{ fontSize: "1.3rem", marginBottom: "4px", color: "var(--primary)" }}>
                      {aiResult.scientific_name}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500, marginBottom: "8px" }}>
                      {t.dashboard.region}: {aiResult.region || "Inconnu"}
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {aiResult.predicted_activities.slice(0, 3).map((act) => (
                        <span
                          key={act}
                          className="tag"
                          style={{
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "var(--primary)",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                          }}
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Deep Research On-Demand */}
            {results.length > 0 && !researchingPlant && !aiGeneratedResults.find((r) => r.scientific_name.toLowerCase() === lastQuery.toLowerCase()) && (
              <div style={{ textAlign: "center", padding: "40px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "24px" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--text-secondary)" }}>
                  {t.dashboard.deepResearchTitle}
                </p>
                <button
                  className="btn-primary"
                  onClick={() => handleDeepResearch(lastQuery || query)}
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #0284c7 100%)", border: "none", display: "inline-flex", gap: "8px" }}
                >
                  <Zap size={18} /> {t.dashboard.deepResearchBtn} "{lastQuery || query}"
                </button>
              </div>
            )}

            {/* Deep Research Loading */}
            {researchingPlant && (
              <div className="glass-panel" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "60px 20px", border: "2px solid rgba(16, 185, 129, 0.3)" }}>
                <div className="loader" style={{ width: "60px", height: "60px", margin: "0 auto 30px", borderWidth: "4px" }} />
                <h2 style={{ fontSize: "1.8rem", marginBottom: "16px", color: "var(--primary)" }}>
                  <Sparkles size={24} style={{ display: "inline", verticalAlign: "middle", marginRight: "8px" }} />
                  {t.dashboard.deepResearchInitiated}
                </h2>
                <p style={{ opacity: 0.8 }}>{t.dashboard.deepResearching}</p>
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RECOMMENDER MODULE                                 */}
        {/* ========================================================= */}
        {activeTab === "recommend" && !selectedPlant && !selectedAIResult && (
          <div className="glass-panel" style={{ padding: "36px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.8rem", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={28} color="#10b981" /> {t.dashboard.recommendTitle}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
                {t.dashboard.recommendDesc}
              </p>
            </div>

            {/* Need Selection Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px", marginBottom: "28px" }}>
              {AVAILABLE_NEEDS.map((n) => {
                const active = selectedNeeds.includes(n.id);
                const needLabel = (t.dashboard.needs as Record<string, string>)?.[n.id] || n.label;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleToggleNeed(n.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "14px 18px",
                      borderRadius: "12px",
                      border: active ? "2px solid #10b981" : "1px solid var(--border)",
                      background: active ? "rgba(16, 185, 129, 0.1)" : "white",
                      color: active ? "#064e3b" : "var(--text-primary)",
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>{n.icon}</span>
                    <span>{needLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Safety Toggles */}
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "20px", borderRadius: "14px", marginBottom: "28px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.95rem" }}>
                <input
                  type="checkbox"
                  checked={excludePregnancy}
                  onChange={(e) => setExcludePregnancy(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981" }}
                />
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.dashboard.excludePregnancy}</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.95rem" }}>
                <input
                  type="checkbox"
                  checked={pediatricSafe}
                  onChange={(e) => setPediatricSafe(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#10b981" }}
                />
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.dashboard.pediatricSafe}</span>
              </label>
            </div>

            <button
              className="btn-primary"
              onClick={handleFetchRecommendations}
              disabled={recommendLoading || selectedNeeds.length === 0}
              style={{ padding: "14px 28px", fontSize: "1.05rem" }}
            >
              {recommendLoading ? <div className="loader" /> : t.dashboard.generateRecs}
            </button>

            {/* Recommendations Grid */}
            {recommendedPlants.length > 0 && (
              <div style={{ marginTop: "36px" }}>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#0f172a" }}>
                  {t.dashboard.recommendedPlants} ({recommendedPlants.length})
                </h3>
                <div className="results-grid">
                  {recommendedPlants.map((rec, i) => (
                    <div key={i} className="result-card" style={{ borderLeft: "4px solid #10b981" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h4 style={{ fontSize: "1.2rem", color: "#0f172a" }}>{rec.scientific_name}</h4>
                        <span style={{ background: "#10b981", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>
                          Grade {rec.evidence_grade || "B"}
                        </span>
                      </div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "8px" }}>
                        {rec.vernacular_name}
                      </p>
                      <p style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "#334155", marginBottom: "12px" }}>
                        {rec.rationale}
                      </p>
                      {rec.warnings && rec.warnings.length > 0 && (
                        <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                          {rec.warnings.map((w: string, idx: number) => (
                            <p key={idx} style={{ color: "#b45309", fontSize: "0.8rem", fontWeight: 500 }}>⚠️ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AGRONOMY & ECOCROP MODULE                          */}
        {/* ========================================================= */}
        {activeTab === "agronomy" && !selectedPlant && !selectedAIResult && (
          <div className="glass-panel" style={{ padding: "36px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.8rem", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                <CloudSun size={28} color="#0284c7" /> {t.dashboard.agronomyTitle}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
                {t.dashboard.agronomyDesc}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "#0f172a" }}>{t.dashboard.cropToCultivate}</label>
                <input
                  type="text"
                  className="input-field"
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  placeholder="Ex: Nigella sativa L., Rosmarinus officinalis..."
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "#0f172a" }}>{t.dashboard.wilayaPresets}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ALGERIA_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setCropLat(loc.lat.toString());
                        setCropLon(loc.lon.toString());
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: cropLat === loc.lat.toString() ? "#0284c7" : "white",
                        color: cropLat === loc.lat.toString() ? "white" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>{t.dashboard.latitude}</label>
                <input
                  type="text"
                  className="input-field"
                  value={cropLat}
                  onChange={(e) => setCropLat(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>{t.dashboard.longitude}</label>
                <input
                  type="text"
                  className="input-field"
                  value={cropLon}
                  onChange={(e) => setCropLon(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleCalculateSuitability}
              disabled={agronomyLoading}
              style={{ background: "#0284c7", padding: "14px 28px", fontSize: "1.05rem" }}
            >
              {agronomyLoading ? <div className="loader" /> : t.dashboard.calcSuitability}
            </button>

            {/* Agronomy Results */}
            {agronomyResult && (
              <div style={{ marginTop: "32px", background: "white", padding: "28px", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.4rem", color: "#0f172a" }}>{t.dashboard.overallSuitability}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Terroir: {agronomyResult.location?.name || "Algérie"}</p>
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: agronomyResult.suitability_score > 70 ? "#10b981" : "#f59e0b" }}>
                    {Math.round(agronomyResult.suitability_score)}%
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ background: "rgba(2, 132, 199, 0.05)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(2, 132, 199, 0.15)" }}>
                    <p style={{ color: "#0284c7", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px" }}>🌡️ {t.dashboard.temperature}</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{agronomyResult.temperature_suitability || 85}%</p>
                  </div>
                  <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                    <p style={{ color: "#059669", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px" }}>💧 {t.dashboard.rainfall}</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{agronomyResult.rainfall_suitability || 80}%</p>
                  </div>
                  <div style={{ background: "rgba(245, 158, 11, 0.05)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                    <p style={{ color: "#d97706", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px" }}>📅 {t.dashboard.cycle}</p>
                    <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>{t.dashboard.cycleVal}</p>
                  </div>
                </div>

                <p style={{ color: "#334155", lineHeight: "1.6", fontSize: "0.95rem" }}>
                  {agronomyResult.summary || "Espèce adaptée aux climats méditerranéen et semi-aride. Tolérance modérée à la sécheresse estivale avec apport d'irrigation d'appoint."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DISEASE & PEST DIAGNOSIS                           */}
        {/* ========================================================= */}
        {activeTab === "diagnose" && !selectedPlant && !selectedAIResult && (
          <div className="glass-panel" style={{ padding: "36px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.8rem", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Stethoscope size={28} color="#ef4444" /> {t.dashboard.diagnoseTitle}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
                {t.dashboard.diagnoseDesc}
              </p>
            </div>

            <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "14px" }}>
              {t.dashboard.checkSymptoms}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "28px" }}>
              {OBSERVABLE_SYMPTOMS.map((s) => {
                const checked = selectedSymptoms.includes(s.id);
                const symLabel = (t.dashboard.symptoms as Record<string, string>)?.[s.id] || s.label;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleSymptom(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 18px",
                      borderRadius: "12px",
                      border: checked ? "2px solid #ef4444" : "1px solid var(--border)",
                      background: checked ? "rgba(239, 68, 68, 0.05)" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      style={{ width: "18px", height: "18px", accentColor: "#ef4444" }}
                    />
                    <span style={{ fontSize: "0.95rem", fontWeight: checked ? 600 : 500, color: "#0f172a" }}>{symLabel}</span>
                  </div>
                );
              })}
            </div>

            <button
              className="btn-primary"
              onClick={handleRunDiagnosis}
              disabled={diagnoseLoading || selectedSymptoms.length === 0}
              style={{ background: "#ef4444", padding: "14px 28px", fontSize: "1.05rem" }}
            >
              {diagnoseLoading ? <div className="loader" /> : t.dashboard.runDiagnosis}
            </button>

            {/* Diagnosis Result */}
            {diagnosisResult && (
              <div style={{ marginTop: "32px", background: "white", padding: "28px", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "4px 10px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.85rem" }}>
                    {t.dashboard.identifiedPathology}
                  </span>
                  <h3 style={{ fontSize: "1.6rem", color: "#0f172a", marginTop: "8px" }}>
                    {diagnosisResult.diagnosis?.name || "Maladie Cryptogamique / Oïdium"}
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    {t.dashboard.confidence} {diagnosisResult.confidence || "92%"} • Type : {diagnosisResult.diagnosis?.type || "Champignon"}
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "1.1rem", color: "#059669", marginBottom: "8px" }}>🌱 {t.dashboard.naturalTreatments} :</h4>
                  <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "#334155" }}>
                    <li><strong>Pulvérisation de purin d'ortie ou prêle :</strong> Renforce les défenses naturelles de la plante.</li>
                    <li><strong>Bicarbonate de soude (5g/L) + Savon noir (1 cuillère) :</strong> Modifie le pH de la feuille et inhibe les spores fongiques.</li>
                    <li><strong>Aération du feuillage :</strong> Espacer les plants pour réduire l'humidité stagnante.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* LOCAL DB DETAIL VIEW & PRINTABLE MONOGRAPH                */}
        {/* ========================================================= */}
        {selectedPlant && !selectedAIResult && (
          <div className="glass-panel" style={{ padding: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <button
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}
                onClick={() => {
                  setSelectedPlant(null);
                  setPrediction(null);
                }}
              >
                {isRtl ? "→ " : "← "} {t.dashboard.back}
              </button>

              <button
                className="btn-primary"
                onClick={() => setMonographOpen(true)}
                style={{ background: "#059669", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <FileText size={18} /> Monographie Officielle & Impression
              </button>
            </div>

            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "8px", color: "#0f172a" }}>
                {selectedPlant.scientific_name}
              </h2>
              <p style={{ fontSize: "1.1rem", color: "var(--primary)", fontWeight: "600" }}>
                {t.dashboard.family}: {selectedPlant.family}
              </p>
            </div>

            <div className="detail-split">
              <div className="detail-pane">
                <h3 style={{ marginBottom: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database size={20} /> {t.dashboard.taxonomyOrigin}
                </h3>
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "4px" }}>{t.dashboard.frenchName}</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: "500", color: "#0f172a" }}>{selectedPlant.french_name || "N/A"}</p>
                </div>
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "4px" }}>{t.dashboard.arabicName}</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: "500", color: "#0f172a" }}>{selectedPlant.arabic_name || "N/A"}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "4px" }}>{t.dashboard.region}</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: "500", color: "#0f172a" }}>{selectedPlant.region || "Algérie"}</p>
                </div>
              </div>

              <div className="detail-pane" style={{ background: "white" }}>
                <h3 style={{ marginBottom: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Fingerprint size={20} /> {t.dashboard.botanicalComp}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                  {selectedPlant.composition_tags ? (
                    selectedPlant.composition_tags.split(",").map((tag) => (
                      <span
                        key={tag}
                        className="tag"
                        style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)", border: "1px solid rgba(16, 185, 129, 0.2)" }}
                      >
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <p>{t.dashboard.noTags}</p>
                  )}
                </div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "12px" }}>{t.dashboard.detailedAnalysis}</h4>
                <p style={{ lineHeight: "1.6", color: "var(--text-primary)" }}>{selectedPlant.composition || t.dashboard.noDetails}</p>
              </div>
            </div>

            <hr style={{ border: "0", height: "1px", background: "var(--border)", margin: "40px 0" }} />

            <div style={{ textAlign: "center", padding: "40px", background: "rgba(16, 185, 129, 0.03)", borderRadius: "24px" }}>
              <h3 style={{ marginBottom: "16px", color: "#0f172a", fontSize: "1.8rem" }}>{t.dashboard.discoverHidden}</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "32px", maxWidth: "600px", margin: "0 auto 32px", fontSize: "1.1rem" }}>
                {t.dashboard.useAiDesc.replace("{name}", selectedPlant.scientific_name)}
              </p>

              {!prediction && !predicting && (
                <button
                  className="btn-primary"
                  onClick={() => predictProperties(selectedPlant.id)}
                  style={{ padding: "16px 32px", fontSize: "1.1rem", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Sparkles size={20} /> {t.dashboard.predictProperties}
                </button>
              )}

              {predicting && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                  <div className="loader" />
                  <p style={{ fontWeight: "500", color: "#0f172a" }}>{t.dashboard.aiAnalyzing}</p>
                </div>
              )}
            </div>

            {prediction && (
              <div
                style={{
                  marginTop: "40px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "24px",
                  padding: "40px",
                }}
              >
                <h3 style={{ color: "var(--primary)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", fontSize: "1.5rem" }}>
                  <BrainCircuit size={24} /> {t.dashboard.aiResults}
                </h3>
                <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {prediction.predicted_activities.map((act) => (
                    <span key={act} className="tag" style={{ background: "var(--primary)", color: "#fff", padding: "6px 12px", fontSize: "0.95rem" }}>
                      {act}
                    </span>
                  ))}
                </div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "12px" }}>{t.dashboard.aiReasoning}</h4>
                <p style={{ color: "#0f172a", lineHeight: "1.6", fontSize: "1.05rem" }}>{prediction.reasoning}</p>
              </div>
            )}

            {/* Official Monograph Modal */}
            {monographOpen && (
              <div className="monograph-modal-overlay">
                <div className="monograph-paper">
                  <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={22} color="#059669" />
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>Monographie Officielle PhytoSense v2</h3>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        className="btn-primary"
                        onClick={() => window.print()}
                        style={{ padding: "8px 16px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <Printer size={16} /> Imprimer / PDF
                      </button>
                      <button
                        onClick={() => setMonographOpen(false)}
                        style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "16px", marginBottom: "24px" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 800, letterSpacing: "1px", color: "#0f172a" }}>
                      RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700, letterSpacing: "0.5px", marginTop: "4px" }}>
                      INDEX PHYTOSENSE • MONOGRAPHIE BOTANIQUE SCIENTIFIQUE (PFE)
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#064e3b", fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                      1. Taxonomie et Identification
                    </h4>
                    <p style={{ marginBottom: "4px" }}><strong>Binôme Scientifique :</strong> <em>{selectedPlant.scientific_name}</em></p>
                    <p style={{ marginBottom: "4px" }}><strong>Famille Botanique :</strong> {selectedPlant.family}</p>
                    <p style={{ marginBottom: "4px" }}><strong>Nom Vernaculaire (FR) :</strong> {selectedPlant.french_name || "N/A"}</p>
                    <p style={{ marginBottom: "4px" }}><strong>Nom Vernaculaire (AR) :</strong> {selectedPlant.arabic_name || "N/A"}</p>
                    <p style={{ marginBottom: "4px" }}><strong>Aire de Répartition :</strong> {selectedPlant.region || "Algérie / Nord de l'Afrique"}</p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#064e3b", fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                      2. Matière Végétale & Récolte
                    </h4>
                    <p style={{ marginBottom: "4px" }}><strong>Partie Utilisée :</strong> {selectedPlant.part_used || "Sommités fleuries, feuilles"}</p>
                    <p style={{ marginBottom: "4px" }}><strong>Formes d'Usage Traditionnel :</strong> Infusion aqueuse, macérat huileux, poudre brute.</p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#064e3b", fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                      3. Profil Phytochimique
                    </h4>
                    <p style={{ lineHeight: "1.6", color: "#334155" }}>
                      {selectedPlant.composition || selectedPlant.composition_tags || "Composition comprenant des polyphénols, flavonoïdes et principes amers caractéristiques."}
                    </p>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#064e3b", fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                      4. Activités Pharmacologiques & Évidence
                    </h4>
                    <p style={{ marginBottom: "4px" }}><strong>Grade de Preuve :</strong> Grade B (Usage médical traditionnel documenté par la littérature scientifique).</p>
                    <p style={{ lineHeight: "1.6", color: "#334155" }}>
                      {selectedPlant.biological_activity || "Activités antioxydante, anti-inflammatoire cutanée et hépatoprotectrice observées in vitro."}
                    </p>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ color: "#064e3b", fontSize: "1.05rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                      5. Sécurité d'Emploi & Avertissements
                    </h4>
                    <p style={{ color: "#b45309", fontWeight: 600, fontSize: "0.9rem" }}>
                      ⚠️ Déconseillé chez la femme enceinte et allaitante sans avis médical formel. Ne pas dépasser les posologies traditionnelles recommandées.
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "12px", textAlign: "center", fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                    Fiche générée par la plateforme PhytoSense v2 le {new Date().toLocaleDateString("fr-FR")}. Document scientifique à vocation académique.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
