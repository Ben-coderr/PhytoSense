"use client";

import { useState, useRef } from "react";

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

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predicting, setPredicting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchPlants = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    
    try {
      const res = await fetch(`/api/plants/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("No plants found.");
        throw new Error("Failed to search plants.");
      }
      const data = await res.json();
      setResults(data);
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
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch(`/api/plants/identify`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to identify plant.");
      }
      
      const data = await res.json();
      setResults(data);
      setQuery(""); // Clear text query
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
    <div className="container">
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>PhytoSense</h1>
        <p>Identify medicinal plants and predict therapeutic properties via AI</p>
      </header>

      <main>
        {/* Search & Upload Section */}
        {!selectedPlant && (
          <>
            <form className="search-container" onSubmit={searchPlants} style={{ margin: "0 auto 40px" }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search by scientific, French, or Arabic name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <div className="loader" /> : "Search"}
              </button>
            </form>

            <div 
              className="upload-area glass-panel"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={onFileChange}
              />
              {uploading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div className="loader" style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "var(--primary)" }} />
                  <p>Analyzing image with Pl@ntNet...</p>
                </div>
              ) : (
                <>
                  <h2 style={{ marginBottom: "10px" }}>📷 Identify by Photo</h2>
                  <p>Click here to upload a photo of a plant to identify it</p>
                </>
              )}
            </div>

            {error && <p style={{ color: "#ef4444", textAlign: "center", marginBottom: "20px" }}>{error}</p>}

            <div className="grid">
              {results.map((plant) => (
                <div key={plant.id} className="glass-panel" style={{ cursor: "pointer" }} onClick={() => setSelectedPlant(plant)}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{plant.scientific_name}</h3>
                  <p style={{ fontSize: "0.9rem", marginBottom: "12px" }}>
                    {plant.french_name && <span>FR: {plant.french_name}<br/></span>}
                    {plant.arabic_name && <span>AR: {plant.arabic_name}</span>}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Family: {plant.family}</p>
                  {plant.similarity_score && (
                    <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "8px" }}>Match: {plant.similarity_score.toFixed(1)}%</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Detail View Section */}
        {selectedPlant && (
          <div className="glass-panel" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <button 
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", marginBottom: "20px", fontSize: "1rem" }}
              onClick={() => { setSelectedPlant(null); setPrediction(null); }}
            >
              ← Back to results
            </button>
            
            <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>{selectedPlant.scientific_name}</h2>
            <p style={{ marginBottom: "24px", color: "var(--primary)" }}>Family: {selectedPlant.family}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "30px" }}>
              <div style={{ flex: "1 1 300px" }}>
                <h3 style={{ marginBottom: "8px" }}>Common Names</h3>
                <p><strong>French:</strong> {selectedPlant.french_name || "N/A"}</p>
                <p><strong>Arabic:</strong> {selectedPlant.arabic_name || "N/A"}</p>
                <br/>
                <h3 style={{ marginBottom: "8px" }}>Origin</h3>
                <p>{selectedPlant.region || "N/A"}</p>
              </div>
              <div style={{ flex: "1 1 300px" }}>
                <h3 style={{ marginBottom: "8px" }}>Composition Tags</h3>
                <div>
                  {selectedPlant.composition_tags ? (
                    selectedPlant.composition_tags.split(",").map(tag => (
                      <span key={tag} className="tag">{tag.trim()}</span>
                    ))
                  ) : <p>No tags available</p>}
                </div>
              </div>
            </div>

            <h3 style={{ marginBottom: "8px" }}>Detailed Composition</h3>
            <p style={{ marginBottom: "30px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px" }}>
              {selectedPlant.composition || "No details available."}
            </p>

            <hr style={{ border: "0", height: "1px", background: "var(--border)", margin: "30px 0" }} />

            <div style={{ textAlign: "center" }}>
              {!prediction && !predicting && (
                <button className="btn-primary" onClick={() => predictProperties(selectedPlant.id)}>
                  ✨ Predict Properties via AI
                </button>
              )}
              
              {predicting && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                  <div className="loader" />
                  <p>AI is analyzing compounds...</p>
                </div>
              )}
            </div>

            {prediction && (
              <div style={{ marginTop: "30px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--primary)", borderRadius: "12px", padding: "24px" }}>
                <h3 style={{ color: "var(--primary)", marginBottom: "16px" }}>🤖 AI Prediction Results</h3>
                <div style={{ marginBottom: "16px" }}>
                  {prediction.predicted_activities.map(act => (
                    <span key={act} className="tag" style={{ background: "var(--primary)", color: "#fff" }}>{act}</span>
                  ))}
                </div>
                <p style={{ color: "var(--text-primary)" }}>{prediction.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
