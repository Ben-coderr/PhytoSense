import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  CloudSun,
  Droplets,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Thermometer,
  Compass,
  ArrowRight,
  Sparkles,
  Info,
  HeartPulse,
  ShieldCheck,
  Leaf,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../src/lib/api/client';
import {
  getOfflineSuitability,
  getOfflineIrrigation,
  getOfflineCalendar,
  getOfflineDiagnosis,
} from '../../src/lib/agronomy/offline';
import { colors, shadows, radii } from '../../src/lib/theme/tokens';

interface WilayaLocation {
  name: string;
  lat: number;
  lon: number;
}

const ALGERIAN_LOCATIONS: WilayaLocation[] = [
  { name: 'Algiers (North)', lat: 36.75, lon: 3.05 },
  { name: 'Oran (West)', lat: 35.69, lon: -0.63 },
  { name: 'Constantine (East)', lat: 36.36, lon: 6.61 },
  { name: 'Batna (Aurès)', lat: 35.55, lon: 6.17 },
  { name: 'Biskra (Ziban)', lat: 34.85, lon: 5.73 },
  { name: 'Tlemcen (High Plateaus)', lat: 34.88, lon: -1.31 },
  { name: 'Ghardaïa (Mzab)', lat: 32.49, lon: 3.67 },
];

const CROPS_PRESETS = [
  { label: 'Thyme (Zaatar)', query: 'Thymus vulgaris' },
  { label: 'Rosemary (Iklil)', query: 'Rosmarinus officinalis' },
  { label: 'Lavender', query: 'Lavandula angustifolia' },
  { label: 'Chih (White Wormwood)', query: 'Artemisia herba-alba' },
  { label: 'Black Seed (Sanouj)', query: 'Nigella sativa' },
  { label: 'Chamomile', query: 'Matricaria chamomilla' },
  { label: 'Peppermint', query: 'Mentha piperita' },
  { label: 'Pomegranate', query: 'Punica granatum' },
];

const SYMPTOMS_PRESETS = [
  { id: 'white_spots', label: 'Powdery white spots on foliage' },
  { id: 'powdery_coating', label: 'White felt-like mildew coating' },
  { id: 'yellow_patches', label: 'Yellow oily mosaic patches' },
  { id: 'brown_spots', label: 'Necrotic brown leaf margins' },
  { id: 'white_underside', label: 'Downy fungal growth on underside' },
  { id: 'sticky_leaves', label: 'Sticky honeydew leaf secretion' },
  { id: 'tiny_insects', label: 'Aphids / visible insect clusters' },
  { id: 'pale_leaves', label: 'General chlorosis & nitrogen stunting' },
  { id: 'wilting_wet_soil', label: 'Root rot wilting despite wet soil' },
];

export default function GardenScreen() {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState<WilayaLocation>(ALGERIAN_LOCATIONS[0]);
  const [selectedCrop, setSelectedCrop] = useState(CROPS_PRESETS[0]);
  const [activeSegment, setActiveSegment] = useState<'suitability' | 'irrigation' | 'calendar' | 'diagnose'>('suitability');

  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [suitabilityData, setSuitabilityData] = useState<any>(null);
  const [irrigationData, setIrrigationData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Diagnosis state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnoseLoading, setDiagnoseLoading] = useState(false);
  const [diagnoseResults, setDiagnoseResults] = useState<any>(null);

  const handleToggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const runDiagnosis = async () => {
    if (selectedSymptoms.length === 0) return;
    setDiagnoseLoading(true);
    try {
      const res = await apiFetch('/v1/diagnose', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          plant_name: selectedCrop.label,
        }),
        timeoutMs: 3500,
      });
      setDiagnoseResults(res);
    } catch (err: any) {
      console.warn('Diagnosis API unreachable, activating offline diagnostic engine:', err);
      const offlineRes = getOfflineDiagnosis(selectedSymptoms, selectedCrop.label);
      setDiagnoseResults(offlineRes);
    } finally {
      setDiagnoseLoading(false);
    }
  };

  useEffect(() => {
    loadAgronomyData();
  }, [selectedLocation, selectedCrop]);

  const loadAgronomyData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Suitability
      const suitRes = await apiFetch('/v1/cultivation/suitability', {
        method: 'POST',
        body: JSON.stringify({
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          scientific_name: selectedCrop.query,
          soil_ph: 7.3,
        }),
        timeoutMs: 3500,
      });
      setSuitabilityData(suitRes);

      // 2. Fetch Irrigation Plan
      const irrRes = await apiFetch(
        `/v1/cultivation/irrigation?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&scientific_name=${encodeURIComponent(selectedCrop.query)}`,
        { timeoutMs: 3500 }
      );
      setIrrigationData(irrRes);

      // 3. Fetch Calendar & Risks
      const calRes = await apiFetch(
        `/v1/cultivation/calendar?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&scientific_name=${encodeURIComponent(selectedCrop.query)}`,
        { timeoutMs: 3500 }
      );
      setCalendarData(calRes);
      setIsOfflineMode(false);
    } catch (e: any) {
      console.warn('Agronomy API unreachable, loading offline FAO-ECOCROP engine:', e);
      const offlineSuit = getOfflineSuitability(selectedCrop.label, selectedLocation.name);
      const offlineIrr = getOfflineIrrigation(selectedCrop.label, selectedLocation.name);
      const offlineCal = getOfflineCalendar(selectedCrop.label, selectedLocation.name);
      setSuitabilityData(offlineSuit);
      setIrrigationData(offlineIrr);
      setCalendarData(offlineCal);
      setIsOfflineMode(true);
      setErrorMsg(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Location Selector Bar */}
      <View style={styles.sectionHeader}>
        <MapPin size={16} color={colors.primary} />
        <Text style={styles.sectionHeaderTitle}>{t('mobile.garden.region', { defaultValue: 'Region / Wilaya' })}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {ALGERIAN_LOCATIONS.map((loc) => {
          const isSelected = selectedLocation.name === loc.name;
          return (
            <TouchableOpacity
              key={loc.name}
              style={[styles.locationChip, isSelected && styles.locationChipActive]}
              onPress={() => setSelectedLocation(loc)}
            >
              <Text style={[styles.locationChipText, isSelected && styles.locationChipTextActive]}>
                {loc.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Crop Selector Bar */}
      <View style={[styles.sectionHeader, { marginTop: 14 }]}>
        <Compass size={16} color={colors.accentBlue} />
        <Text style={styles.sectionHeaderTitle}>{t('mobile.garden.crop', { defaultValue: 'Cultivated Species' })}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {CROPS_PRESETS.map((crop) => {
          const isSelected = selectedCrop.label === crop.label;
          return (
            <TouchableOpacity
              key={crop.label}
              style={[styles.cropChip, isSelected && styles.cropChipActive]}
              onPress={() => setSelectedCrop(crop)}
            >
              <Text style={[styles.cropChipText, isSelected && styles.cropChipTextActive]}>
                {crop.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Segment Selector Tabs */}
      <View style={styles.segmentControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'suitability' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('suitability')}
        >
          <CheckCircle2 size={16} color={activeSegment === 'suitability' ? colors.primary : colors.textMuted} />
          <Text style={[styles.segmentText, activeSegment === 'suitability' && styles.segmentTextActive]}>
            {t('mobile.garden.suitability', { defaultValue: 'Suitability' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'irrigation' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('irrigation')}
        >
          <Droplets size={16} color={activeSegment === 'irrigation' ? colors.accentBlue : colors.textMuted} />
          <Text style={[styles.segmentText, activeSegment === 'irrigation' && styles.segmentTextActive]}>
            {t('mobile.garden.irrigation', { defaultValue: 'Irrigation' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'calendar' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('calendar')}
        >
          <Calendar size={16} color={activeSegment === 'calendar' ? colors.accentAmber : colors.textMuted} />
          <Text style={[styles.segmentText, activeSegment === 'calendar' && styles.segmentTextActive]}>
            {t('mobile.garden.calendar', { defaultValue: 'Calendar' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'diagnose' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('diagnose')}
        >
          <HeartPulse size={16} color={activeSegment === 'diagnose' ? colors.accentRose : colors.textMuted} />
          <Text style={[styles.segmentText, activeSegment === 'diagnose' && styles.segmentTextActive]}>
            {t('mobile.garden.health', { defaultValue: 'Health' })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline Mode Indicator */}
      {isOfflineMode && !loading && (
        <View style={styles.offlineBanner}>
          <Sparkles size={14} color="#059669" />
          <Text style={styles.offlineBannerText}>
            {t('mobile.garden.offlineBanner', { defaultValue: 'Disconnected Field Mode • Local FAO-ECOCROP Bioclimatic Engine Active' })}
          </Text>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('mobile.garden.loadingModel', { defaultValue: 'Running Open-Meteo & FAO-ECOCROP bioclimatic model...' })}
          </Text>
        </View>
      )}

      {errorMsg && !loading && (
        <View style={styles.errorBox}>
          <AlertTriangle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* SEGMENT 1: SUITABILITY */}
      {!loading && activeSegment === 'suitability' && suitabilityData && (
        <View>
          {/* Main Score Gauge */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View style={[styles.scoreCircle, { borderColor: suitabilityData.badge_color || colors.primary }]}>
                <Text style={[styles.scoreValue, { color: suitabilityData.badge_color || colors.primary }]}>
                  {suitabilityData.suitability_percent}%
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.categoryBadge, { color: suitabilityData.badge_color || colors.primary }]}>
                  {suitabilityData.category_label || 'High Suitability'}
                </Text>
                <Text style={styles.scoreTitle}>{selectedCrop.label}</Text>
                <Text style={styles.scoreSubtitle}>
                  in {selectedLocation.name}
                </Text>
              </View>
            </View>

            {/* Limiting Factor Banner */}
            {suitabilityData.limiting_factor && (
              <View style={styles.limitingBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={15} color={colors.accentAmber} />
                  <Text style={styles.limitingTitle}>
                    {t('mobile.garden.limitingFactor', { defaultValue: 'Primary Limiting Factor' })}
                  </Text>
                </View>
                <Text style={styles.limitingDetail}>
                  {suitabilityData.limiting_factor.name?.toUpperCase()} : {suitabilityData.limiting_factor.detail}
                </Text>
                <Text style={styles.limitingTip}>
                  {t('mobile.garden.agronomicMitigation', { defaultValue: 'Agronomic mitigation:' })} {suitabilityData.limiting_factor.mitigation_tip}
                </Text>
              </View>
            )}
          </View>

          {/* Factor Breakdown */}
          {suitabilityData.factors && (
            <View style={styles.matrixCard}>
              <Text style={styles.matrixTitle}>
                {t('mobile.garden.multiFactor', { defaultValue: 'Multi-Factor Bioclimatic Evaluation' })}
              </Text>

              {Object.entries(suitabilityData.factors).map(([k, f]: [string, any]) => (
                <View key={k} style={styles.factorRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.factorName}>{k.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.factorOpt}>
                      {t('mobile.garden.current', { defaultValue: 'Current:' })} {f.current_val} {f.unit} | {t('mobile.garden.optimal', { defaultValue: 'Opt:' })} {f.optimal}
                    </Text>
                  </View>
                  <View style={styles.factorScoreBadge}>
                    <Text style={styles.factorScoreText}>{Math.round(f.score * 100)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* SEGMENT 2: IRRIGATION */}
      {!loading && activeSegment === 'irrigation' && irrigationData && (
        <View>
          <View style={styles.irrigationHero}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Droplets size={26} color={colors.accentBlue} />
              <View>
                <Text style={styles.irrigationVolume}>
                  {irrigationData.weekly_total_litres_m2} L / m²
                </Text>
                <Text style={styles.irrigationSub}>
                  {t('mobile.garden.weeklyVolume', { defaultValue: 'Total 7-day cumulative water requirement' })}
                </Text>
              </View>
            </View>
            <Text style={styles.kcBadge}>
              {t('mobile.garden.cropCoefficient', {
                kc: irrigationData.crop_coefficient_kc,
                defaultValue: `Crop Coefficient Kc: ${irrigationData.crop_coefficient_kc} (mid-season stage)`
              })}
            </Text>
          </View>

          <Text style={styles.planSectionTitle}>
            {t('mobile.garden.dailySchedule', { defaultValue: 'Daily Irrigation Schedule' })}
          </Text>
          {irrigationData.daily_plan?.map((day: any, idx: number) => (
            <View key={idx} style={styles.dailyPlanRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayDate}>{day.date}</Text>
                <Text style={styles.dayWeather}>
                  ET₀: {day.et0_mm} mm | Rain: {day.rain_mm} mm | Max: {day.temp_max}°C
                </Text>
              </View>
              <View style={[styles.waterTag, day.water_need_litres_per_m2 > 0 ? styles.waterTagNeeded : styles.waterTagNone]}>
                <Text style={styles.waterTagText}>
                  {day.water_need_litres_per_m2 > 0
                    ? `${day.water_need_litres_per_m2} L/m²`
                    : t('mobile.garden.rainCovered', { defaultValue: '0 L (Rain)' })}
                </Text>
              </View>
            </View>
          ))}

          {/* Practical Tips */}
          {irrigationData.practical_tips?.length > 0 && (
            <View style={styles.tipsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={16} color={colors.primary} />
                <Text style={styles.tipsTitle}>
                  {t('mobile.garden.practicalTips', { defaultValue: 'Practical Irrigation Guidelines' })}
                </Text>
              </View>
              {irrigationData.practical_tips.map((tip: string, idx: number) => (
                <Text key={idx} style={styles.tipBullet}>• {tip}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* SEGMENT 3: CALENDAR */}
      {!loading && activeSegment === 'calendar' && calendarData && (
        <View>
          {/* Active alerts */}
          {calendarData.alerts?.length > 0 && (
            <View style={styles.alertContainer}>
              {calendarData.alerts.map((al: any, idx: number) => (
                <View key={idx} style={styles.alertCard}>
                  <AlertTriangle size={18} color={colors.accentAmber} />
                  <Text style={styles.alertCardText}>{al.message}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Harvest Advice */}
          <View style={styles.harvestCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Sparkles size={16} color={colors.accentAmber} />
              <Text style={styles.harvestTitle}>
                {t('mobile.garden.harvestTitle', { defaultValue: 'Harvest & Foraging Guidelines' })}
              </Text>
            </View>
            <Text style={styles.harvestText}>{calendarData.harvest_advice}</Text>
            <Text style={styles.gddText}>
              {t('mobile.garden.gdd', {
                gdd: calendarData.gdd_accumulated_7d,
                base: calendarData.gdd_base_c,
                defaultValue: `Accumulated Growing Degree Days (7d): ${calendarData.gdd_accumulated_7d} GDD (base ${calendarData.gdd_base_c}°C)`
              })}
            </Text>
          </View>

          {/* 12-Month Calendar Grid */}
          <Text style={styles.planSectionTitle}>
            {t('mobile.garden.annualCalendar', { defaultValue: 'Annual Phenological Calendar' })}
          </Text>
          <View style={styles.calendarGrid}>
            {calendarData.calendar_grid?.map((m: any) => (
              <View
                key={m.month_num}
                style={[
                  styles.monthCell,
                  m.is_current && styles.monthCellCurrent,
                  m.can_harvest && styles.monthCellHarvest,
                  m.can_sow && !m.can_harvest && styles.monthCellSow,
                ]}
              >
                <Text style={[styles.monthName, m.is_current && styles.monthNameCurrent]}>
                  {m.month_name}
                </Text>
                <Text style={styles.monthAction}>
                  {m.can_harvest
                    ? t('mobile.garden.harvest', { defaultValue: 'Harvest' })
                    : (m.can_sow
                      ? t('mobile.garden.sow', { defaultValue: 'Sow' })
                      : t('mobile.garden.rest', { defaultValue: 'Rest' }))}
                </Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendLabel}>
                {t('mobile.garden.sowingWindow', { defaultValue: 'Sowing window' })}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accentAmber }]} />
              <Text style={styles.legendLabel}>
                {t('mobile.garden.harvestingWindow', { defaultValue: 'Harvesting window' })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* SEGMENT 4: DIAGNOSIS & HEALTH */}
      {activeSegment === 'diagnose' && (
        <View>
          <View style={styles.diagnoseHero}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <HeartPulse size={24} color={colors.accentRose} />
              <Text style={styles.diagnoseTitle}>
                {t('mobile.garden.diagnosticsTitle', { defaultValue: 'Plant Pathology & Diagnostics' })}
              </Text>
            </View>
            <Text style={styles.diagnoseSubtitle}>
              {t('mobile.garden.diagnosticsSubtitle', {
                defaultValue: `Check observed anomalies on your crop (${selectedCrop.label}) to identify diseases and receive organic treatment recipes.`
              })}
            </Text>
          </View>

          <Text style={styles.planSectionTitle}>
            {t('mobile.garden.observedSymptoms', { defaultValue: 'Observed Symptoms' })}
          </Text>
          <View style={styles.symptomsWrap}>
            {SYMPTOMS_PRESETS.map((sym) => {
              const isSelected = selectedSymptoms.includes(sym.id);
              return (
                <TouchableOpacity
                  key={sym.id}
                  style={[styles.symptomChip, isSelected && styles.symptomChipActive]}
                  onPress={() => handleToggleSymptom(sym.id)}
                >
                  <Text style={[styles.symptomChipText, isSelected && styles.symptomChipTextActive]}>
                    {isSelected ? '✓ ' : '+ '}
                    {sym.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.diagnoseActionBtn,
              selectedSymptoms.length === 0 && { opacity: 0.5 },
            ]}
            onPress={runDiagnosis}
            disabled={selectedSymptoms.length === 0 || diagnoseLoading}
          >
            {diagnoseLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <HeartPulse size={18} color="#FFFFFF" />
                <Text style={styles.diagnoseActionText}>
                  {selectedSymptoms.length > 0
                    ? `${t('mobile.garden.runDiagnosis', { defaultValue: 'Run Diagnosis' })} (${selectedSymptoms.length})`
                    : t('mobile.garden.runDiagnosis', { defaultValue: 'Run Diagnosis' })}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Results */}
          {diagnoseResults && (
            <View style={{ marginTop: 18 }}>
              <Text style={styles.planSectionTitle}>
                {t('mobile.garden.identifiedPathology', { defaultValue: 'Identified Pathologies & Pests' })} ({diagnoseResults.diagnoses_count})
              </Text>

              {diagnoseResults.results?.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>
                    No severe disease pattern directly matches these isolated symptoms. Monitor crop progression over 48 hours.
                  </Text>
                </View>
              ) : (
                diagnoseResults.results?.map((diag: any, idx: number) => (
                  <View key={idx} style={styles.diseaseCard}>
                    <View style={styles.diseaseHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.diseaseName}>{diag.name_en || diag.name_fr}</Text>
                        <Text style={styles.diseaseAr}>{diag.name_ar}</Text>
                      </View>
                      <View style={styles.confidenceTag}>
                        <Text style={styles.confidenceTagText}>
                          {Math.round(diag.confidence_score * 100)}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.diseaseDesc}>{diag.description}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 6 }}>
                      <Leaf size={14} color={colors.primary} />
                      <Text style={styles.treatmentHeading}>
                        {t('mobile.garden.naturalTreatments', { defaultValue: 'Natural & Bio Treatments' })}
                      </Text>
                    </View>
                    {diag.organic_treatment?.map((tr: string, tIdx: number) => (
                      <Text key={tIdx} style={styles.treatmentBullet}>• {tr}</Text>
                    ))}

                    <View style={styles.preventionBox}>
                      <ShieldCheck size={14} color={colors.primary} />
                      <Text style={styles.preventionText}>Prevention: {diag.prevention}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  locationChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.sm,
    marginRight: 8,
    ...shadows.subtle,
  },
  locationChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  locationChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  locationChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  cropChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.sm,
    marginRight: 8,
    ...shadows.subtle,
  },
  cropChipActive: {
    backgroundColor: colors.accentBlueTint,
    borderColor: colors.accentBlue,
  },
  cropChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  cropChipTextActive: {
    color: colors.accentBlue,
    fontWeight: '700',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: 4,
    marginTop: 12,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radii.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.md,
    marginBottom: 16,
  },
  offlineBannerText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 16,
    ...shadows.card,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scoreTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  scoreSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  limitingBanner: {
    backgroundColor: colors.accentAmberTint,
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
  },
  limitingTitle: {
    color: colors.accentAmber,
    fontSize: 13,
    fontWeight: '700',
  },
  limitingDetail: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  limitingTip: {
    color: '#78350F',
    fontSize: 12,
    lineHeight: 16,
  },
  matrixCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    ...shadows.card,
  },
  matrixTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1,
  },
  factorName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  factorOpt: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  factorScoreBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  factorScoreText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  irrigationHero: {
    backgroundColor: colors.accentBlueTint,
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 16,
  },
  irrigationVolume: {
    color: colors.accentBlue,
    fontSize: 24,
    fontWeight: '800',
  },
  irrigationSub: {
    color: '#0369A1',
    fontSize: 13,
    marginTop: 2,
  },
  kcBadge: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  planSectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 10,
  },
  dailyPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 8,
    ...shadows.subtle,
  },
  dayDate: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayWeather: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  waterTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  waterTagNeeded: {
    backgroundColor: colors.accentBlueTint,
  },
  waterTagNone: {
    backgroundColor: colors.surfaceSubtle,
  },
  waterTagText: {
    color: colors.accentBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginTop: 12,
    ...shadows.subtle,
  },
  tipsTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  tipBullet: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  alertContainer: {
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentAmberTint,
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 8,
  },
  alertCardText: {
    color: '#92400E',
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  harvestCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.card,
  },
  harvestTitle: {
    color: colors.accentAmber,
    fontSize: 14,
    fontWeight: '700',
  },
  harvestText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  gddText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '23%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 8,
    alignItems: 'center',
    ...shadows.subtle,
  },
  monthCellCurrent: {
    borderColor: colors.accentBlue,
    borderWidth: 2,
  },
  monthCellHarvest: {
    backgroundColor: colors.accentAmberTint,
    borderColor: '#FDE68A',
  },
  monthCellSow: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
  },
  monthName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  monthNameCurrent: {
    color: colors.accentBlue,
  },
  monthAction: {
    color: colors.textMuted,
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  diagnoseHero: {
    backgroundColor: colors.accentRoseTint,
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 16,
  },
  diagnoseTitle: {
    color: colors.accentRose,
    fontSize: 18,
    fontWeight: '800',
  },
  diagnoseSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  symptomChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    ...shadows.subtle,
  },
  symptomChipActive: {
    backgroundColor: colors.accentRoseTint,
    borderColor: colors.accentRose,
  },
  symptomChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  symptomChipTextActive: {
    color: colors.accentRose,
    fontWeight: '700',
  },
  diagnoseActionBtn: {
    backgroundColor: colors.accentRose,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    ...shadows.card,
  },
  diagnoseActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    ...shadows.subtle,
  },
  emptyCardText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  diseaseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 14,
    ...shadows.card,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  diseaseName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  diseaseAr: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  confidenceTag: {
    backgroundColor: colors.accentRoseTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  confidenceTagText: {
    color: colors.accentRose,
    fontSize: 11,
    fontWeight: '700',
  },
  diseaseDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  treatmentHeading: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
  },
  treatmentBullet: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
    paddingLeft: 4,
  },
  preventionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: radii.sm,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  preventionText: {
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
});
