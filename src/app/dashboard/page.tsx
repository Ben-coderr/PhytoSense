"use client";

import { useState, useRef } from "react";
import { Camera, Sparkles, BrainCircuit, Search, Database, Fingerprint, Activity, Zap, Upload } from "lucide-react";
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

export default function Home() {
  const { t, isRtl } = useLanguage();
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Deep Research State
  const [researchingPlant, setResearchingPlant] = useState(false);
  const [aiGeneratedResults, setAiGeneratedResults] = useState<ResearchResult[]>([]);
  const [selectedAIResult, setSelectedAIResult] = useState<ResearchResult | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera specific state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
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
      streamRef.current.getTracks().forEach(track => track.stop());
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
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            stopCamera();
            handleFileUpload(file);
          }
        }, 'image/jpeg', 0.9);
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
      setAiGeneratedResults(prev => [...prev, data]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResearchingPlant(false);
    }
  };

  const processPlantResponse = (data: any, originalQuery: string) => {
    if (data.found_local === false) {
      // Trigger deep research automatically if NOTHING is found locally
      setResults([]);
      handleDeepResearch(data.scientific_name);
    } else if (data.found_local === true) {
      setResults(data.results);
      setLastQuery(originalQuery);
    } else {
      setResults(data); // Fallback
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

  return (
    <div className={`dashboard-container ${isRtl ? 'rtl-layout' : ''}`}>
      <header className="dashboard-header">
        <h1>{t.dashboard.title}</h1>
        <p>{t.dashboard.subtitle}</p>
      </header>

      <main>
        {/* Search & Upload Section */}
        {!selectedPlant && !selectedAIResult && (
          <>
            {!results.length && !aiGeneratedResults.length && !researchingPlant && (
              <div className="dashboard-action-grid">
                <div className="search-box-card">
                  <h2><Search size={24} /> {t.dashboard.searchTitle}</h2>
                  <p style={{ marginBottom: "24px", color: "var(--text-secondary)" }}>{t.dashboard.searchDesc}</p>
                  <form className="dashboard-form" onSubmit={searchPlants} style={{ display: "flex", gap: "12px", width: "100%" }}>
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
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={onFileChange}
                  />
                  {uploading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                      <div className="loader" style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "var(--primary)", width: "40px", height: "40px" }} />
                      <p style={{ fontWeight: 500, color: "#0f172a" }}>{t.dashboard.analyzing}</p>
                    </div>
                  ) : showCamera ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        style={{ width: "100%", borderRadius: "12px", background: "#000", maxHeight: "300px", objectFit: "cover" }} 
                      />
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <button onClick={stopCamera} className="btn-secondary" style={{ flex: 1, padding: "12px" }}>{t.dashboard.cancel}</button>
                        <button onClick={capturePhoto} className="btn-primary" style={{ flex: 2, padding: "12px" }}><Camera size={18} /> {t.dashboard.snapPhoto}</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", color: "#0f172a" }}>{t.dashboard.identifyTitle}</h2>
                      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{t.dashboard.identifyDesc}</p>
                      <div className="photo-actions" style={{ display: "flex", gap: "16px", width: "100%", justifyContent: "center" }}>
                        <button 
                          onClick={startCamera}
                          className="btn-primary"
                          style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none" }}
                        >
                          <Camera size={24} />
                          <span style={{ fontSize: "0.95rem" }}>{t.dashboard.takePhoto}</span>
                        </button>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary"
                          style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", border: "2px solid #e2e8f0" }}
                        >
                          <Upload size={24} />
                          <span style={{ fontSize: "0.95rem" }}>{t.dashboard.uploadFile}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {(results.length > 0 || aiGeneratedResults.length > 0 || researchingPlant) && (
              <div className="results-search-bar" style={{ display: "flex", gap: "12px", maxWidth: "600px", margin: "0 auto 40px" }}>
                <form className="dashboard-form" onSubmit={searchPlants} style={{ flex: 1, margin: 0, display: "flex", gap: "12px" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={t.dashboard.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <div className="loader" /> : <><Search size={18} /> {t.dashboard.searchBtn}</>}
                  </button>
                </form>
                <button onClick={clearState} className="btn-secondary" style={{ padding: "0 24px" }}>
                  {t.dashboard.clearBtn}
                </button>
              </div>
            )}

            {error && <p style={{ color: "#ef4444", textAlign: "center", marginBottom: "20px" }}>{error}</p>}

            {(results.length > 0 || aiGeneratedResults.length > 0) && (
              <div className="results-grid">
                {results.map((plant) => (
                  <div key={`local-${plant.id}`} className="result-card" onClick={() => setSelectedPlant(plant)}>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "#0f172a" }}>{plant.scientific_name}</h3>
                    <p style={{ fontSize: "0.9rem", marginBottom: "12px", color: "var(--text-secondary)" }}>
                      {plant.french_name && <span>FR: {plant.french_name}<br/></span>}
                      {plant.arabic_name && <span>AR: {plant.arabic_name}</span>}
                    </p>
                    <div style={{ marginTop: "auto" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500 }}>{t.dashboard.family}: {plant.family}</p>
                      <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500 }}>{t.dashboard.region}: {plant.region || "Unknown"}</p>
                      {plant.similarity_score && (
                        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "8px" }}>{t.dashboard.match}: {plant.similarity_score.toFixed(1)}%</p>
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
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--primary)", color: "white", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "12px" }}>
                      <Sparkles size={12} /> {t.dashboard.aiGenerated}
                    </div>
                    <h3 style={{ fontSize: "1.3rem", marginBottom: "4px", color: "var(--primary)" }}>{aiResult.scientific_name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500, marginBottom: "8px" }}>{t.dashboard.region}: {aiResult.region || "Unknown"}</p>
                    <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "12px" }}>{t.dashboard.aiDesc}</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {aiResult.predicted_activities.slice(0, 3).map(act => (
                        <span key={act} className="tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)", border: "1px solid rgba(16, 185, 129, 0.2)", fontSize: "0.75rem", padding: "2px 8px" }}>{act}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Deep Research On-Demand UI */}
            {results.length > 0 && !researchingPlant && !aiGeneratedResults.find(r => r.scientific_name.toLowerCase() === lastQuery.toLowerCase()) && (
              <div style={{ textAlign: "center", padding: "40px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "24px" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--text-secondary)" }}>{t.dashboard.deepResearchTitle}</p>
                <button 
                  className="btn-primary" 
                  onClick={() => handleDeepResearch(lastQuery || query)}
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #0284c7 100%)", border: "none", display: "inline-flex", gap: "8px" }}
                >
                  <Zap size={18} /> {t.dashboard.deepResearchBtn} "{lastQuery || query}"
                </button>
              </div>
            )}

            {/* Deep Research Loading View */}
            {researchingPlant && (
              <div className="glass-panel" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "60px 20px", border: "2px solid rgba(16, 185, 129, 0.3)" }}>
                <div className="loader" style={{ width: "60px", height: "60px", margin: "0 auto 30px", borderWidth: "4px" }} />
                <h2 style={{ fontSize: "1.8rem", marginBottom: "16px", color: "var(--primary)" }}>
                  <Sparkles size={24} style={{ display: "inline", verticalAlign: "middle", marginRight: "8px", ...(isRtl ? {marginLeft: "8px", marginRight: 0} : {}) }} />
                  {t.dashboard.deepResearchInitiated}
                </h2>
                <p style={{ opacity: 0.8 }}>{t.dashboard.deepResearching}</p>
              </div>
            )}
          </>
        )}

        {/* Deep Research Result View (Detail) */}
        {selectedAIResult && (
          <div className="glass-panel" style={{ padding: "40px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <button 
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", marginBottom: "20px", fontSize: "1rem" }}
              onClick={() => setSelectedAIResult(null)}
            >
              {isRtl ? '→ ' : '← '} {t.dashboard.back}
            </button>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ background: "linear-gradient(135deg, #10b981 0%, #0284c7 100%)", color: "white", padding: "6px 16px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} /> {t.dashboard.aiGenerated}
              </span>
              <h2 style={{ fontSize: "2.2rem", margin: 0 }}>{selectedAIResult.scientific_name}</h2>
            </div>
            
            <p style={{ fontSize: "1.1rem", color: "var(--primary)", fontWeight: "600", marginBottom: "16px" }}>{t.dashboard.region}: {selectedAIResult.region || "Unknown"}</p>
            
            <p style={{ marginBottom: "32px", opacity: 0.8, fontSize: "1.05rem" }}>{t.dashboard.aiResearchWarning}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
              {/* Compounds */}
              <div style={{ background: "rgba(0,0,0,0.03)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--primary)" }}>
                  <Fingerprint size={20} /> {t.dashboard.discoveredCompounds}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedAIResult.researched_compounds.map(c => (
                    <span key={c} className="tag" style={{ background: "white", border: "1px solid var(--border)" }}>{c}</span>
                  ))}
                </div>
              </div>

              {/* Predictions */}
              <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--primary)" }}>
                  <Activity size={20} /> {t.dashboard.predictedActivity}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedAIResult.predicted_activities.map(act => (
                    <span key={act} className="tag" style={{ background: "var(--primary)", color: "white" }}>{act}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cross-Reference Section */}
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Database size={20} /> {t.dashboard.crossReferenced}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {selectedAIResult.similar_local_plants.map((sim, i) => (
                  <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px", borderRadius: "12px" }}>
                    <h4 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "var(--text-primary)" }}>{sim.name}</h4>
                    <p style={{ fontSize: "0.95rem", marginBottom: "12px", opacity: 0.9 }}>{sim.match_reason}</p>
                    <div>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, ...(isRtl ? {marginLeft: "8px"} : {marginRight: "8px"}) }}>{t.dashboard.shared}</span>
                      {sim.shared_compounds.map(c => (
                        <span key={c} className="tag" style={{ background: "rgba(0,0,0,0.05)", margin: isRtl ? "0 0 4px 4px" : "0 4px 4px 0" }}>{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Local DB Detail View Section */}
        {selectedPlant && !selectedAIResult && (
          <div className="glass-panel" style={{ padding: "40px" }}>
            <button 
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", marginBottom: "30px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}
              onClick={() => { setSelectedPlant(null); setPrediction(null); }}
            >
              {isRtl ? '→ ' : '← '} {t.dashboard.back}
            </button>
            
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "8px", color: "#0f172a" }}>{selectedPlant.scientific_name}</h2>
              <p style={{ fontSize: "1.1rem", color: "var(--primary)", fontWeight: "600" }}>{t.dashboard.family}: {selectedPlant.family}</p>
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
                  <p style={{ fontSize: "1.1rem", fontWeight: "500", color: "#0f172a" }}>{selectedPlant.region || "N/A"}</p>
                </div>
              </div>
              
              <div className="detail-pane" style={{ background: "white" }}>
                <h3 style={{ marginBottom: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Fingerprint size={20} /> {t.dashboard.botanicalComp}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                  {selectedPlant.composition_tags ? (
                    selectedPlant.composition_tags.split(",").map(tag => (
                      <span key={tag} className="tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>{tag.trim()}</span>
                    ))
                  ) : <p>{t.dashboard.noTags}</p>}
                </div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "12px" }}>{t.dashboard.detailedAnalysis}</h4>
                <p style={{ lineHeight: "1.6", color: "var(--text-primary)" }}>
                  {selectedPlant.composition || t.dashboard.noDetails}
                </p>
              </div>
            </div>

            <hr style={{ border: "0", height: "1px", background: "var(--border)", margin: "40px 0" }} />

            <div style={{ textAlign: "center", padding: "40px", background: "rgba(16, 185, 129, 0.03)", borderRadius: "24px" }}>
              <h3 style={{ marginBottom: "16px", color: "#0f172a", fontSize: "1.8rem" }}>{t.dashboard.discoverHidden}</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "32px", maxWidth: "600px", margin: "0 auto 32px", fontSize: "1.1rem" }}>
                {t.dashboard.useAiDesc.replace('{name}', selectedPlant.scientific_name)}
              </p>
              
              {!prediction && !predicting && (
                <button className="btn-primary" onClick={() => predictProperties(selectedPlant.id)} style={{ padding: "16px 32px", fontSize: "1.1rem", display: "inline-flex", alignItems: "center", gap: "8px" }}>
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
              <div style={{ marginTop: "40px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "24px", padding: "40px" }}>
                <h3 style={{ color: "var(--primary)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", fontSize: "1.5rem" }}>
                  <BrainCircuit size={24} /> {t.dashboard.aiResults}
                </h3>
                <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {prediction.predicted_activities.map(act => (
                    <span key={act} className="tag" style={{ background: "var(--primary)", color: "#fff", padding: "6px 12px", fontSize: "0.95rem" }}>{act}</span>
                  ))}
                </div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "12px" }}>{t.dashboard.aiReasoning}</h4>
                <p style={{ color: "#0f172a", lineHeight: "1.6", fontSize: "1.05rem" }}>{prediction.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
