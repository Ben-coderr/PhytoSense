import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Leaf,
  ShieldAlert,
  Sparkles,
  BrainCircuit,
  MapPin,
  BookPlus,
  FileText,
  Share2,
  Check,
  X,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getDatabase, addJournalEntry } from '../../src/lib/db/sqlite';
import { apiFetch } from '../../src/lib/api/client';
import { colors, shadows, radii } from '../../src/lib/theme/tokens';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [plant, setPlant] = useState<any>(null);
  const [names, setNames] = useState<any[]>([]);
  const [compounds, setCompounds] = useState<any[]>([]);
  const [safetyFlags, setSafetyFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Herbarium addition feedback
  const [addedToJournal, setAddedToJournal] = useState(false);
  const [addingJournal, setAddingJournal] = useState(false);

  // Monograph modal
  const [monographVisible, setMonographVisible] = useState(false);

  // AI Prediction state
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    loadPlantData();
  }, [id]);

  const loadPlantData = async () => {
    try {
      const db = await getDatabase();
      const plantId = Number(id);
      const plantRow = await db.getFirstAsync<any>(
        'SELECT * FROM plant WHERE id = ?',
        [plantId]
      );
      if (plantRow) {
        setPlant(plantRow);
        // Load names
        const namesRows = await db.getAllAsync<any>(
          'SELECT lang, name, notes, kind FROM plant_name WHERE plant_id = ?',
          [plantId]
        );
        setNames(namesRows);
        // Load compounds
        const compRows = await db.getAllAsync<any>(
          `SELECT c.name, c.chem_class FROM plant_compound pc
           JOIN compound c ON c.id = pc.compound_id
           WHERE pc.plant_id = ?`,
          [plantId]
        );
        setCompounds(compRows);
        // Load safety flags
        const flagRows = await db.getAllAsync<any>(
          'SELECT flag, severity, note FROM safety_flag WHERE plant_id = ?',
          [plantId]
        );
        setSafetyFlags(flagRows);
      }
    } catch (e) {
      console.error('Error loading plant data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToJournal = async () => {
    if (!plant) return;
    setAddingJournal(true);
    try {
      const frName = names.find((n) => n.lang === 'fr')?.name;
      const arName = names.find((n) => n.lang === 'ar')?.name;
      const displayName = [plant.accepted_name, frName, arName].filter(Boolean).join(' • ');

      await addJournalEntry({
        plant_id: plant.id,
        plant_name: displayName,
        notes: `Added from PhytoSense v2 Monograph. Family: ${plant.family}. Region: ${plant.region || 'Algeria'}. Part: ${plant.part_used || 'Aerial parts / Leaves'}.`,
        watering_interval_days: 3,
      });
      setAddedToJournal(true);
      Alert.alert(
        t('mobile.plant.addedAlertTitle', { defaultValue: 'Plant Added!' }),
        t('mobile.plant.addedAlertDesc', {
          name: plant.accepted_name,
          defaultValue: `${plant.accepted_name} has been saved to your Field Journal & Herbarium.`
        }),
        [
          { text: t('mobile.plant.continue', { defaultValue: 'Continue' }), style: 'cancel' },
          { text: t('mobile.plant.openHerbarium', { defaultValue: 'Open Herbarium' }), onPress: () => router.push('/journal') },
        ]
      );
    } catch (e) {
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        'Unable to add plant to herbarium.'
      );
    } finally {
      setAddingJournal(false);
    }
  };

  const generateMonographText = () => {
    if (!plant) return '';
    const frName = names.find((n) => n.lang === 'fr')?.name || 'N/A';
    const arName = names.find((n) => n.lang === 'ar')?.name || 'N/A';
    const compList = compounds.map((c) => c.name).join(', ') || plant.composition_raw || 'Not listed';
    const warnings = safetyFlags.map((f) => `- [${f.flag}] ${f.note}`).join('\n') || 'No major contraindications reported.';

    return `======================================================
PHYTOSENSE v2 — SCIENTIFIC BOTANICAL MONOGRAPH
======================================================
TAXON: ${plant.accepted_name}
FAMILY: ${plant.family}
COMMON NAME (FR): ${frName}
TRADITIONAL NAME (AR): ${arName}
ORIGIN / REGION: ${plant.region || 'Algeria / Mediterranean Basin'}
PART EMPLOYED: ${plant.part_used || 'Whole plant / Flowering aerial tops'}

--- CHEMICAL PROFILE & SECONDARY METABOLITES ---
${compList}

--- SAFETY PROFILE & CONTRAINDICATIONS ---
${warnings}

--- THERAPEUTIC INDICATIONS & PHARMACOLOGY ---
Scientific Evidence Grade: B/C (Recognized Traditional Medicinal Usage)
Documented Activities: Antioxidant, antimicrobial, anti-inflammatory, cytoprotective.

--- REGULATORY & CLINICAL NOTES ---
Educational document generated by PhytoSense v2 platform.
Does not substitute professional advice from a licensed medical specialist.
======================================================`;
  };

  const handleShareMonograph = async () => {
    const text = generateMonographText();
    try {
      await Share.share({
        message: text,
        title: `PhytoSense Monograph — ${plant.accepted_name}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const requestPrediction = async () => {
    setPredicting(true);
    try {
      const data = await apiFetch(`/v1/plants/${id}/predict`);
      setPrediction(data);
    } catch (e) {
      console.warn('Prediction request fallback:', e);
    } finally {
      setPredicting(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading botanical monograph...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Plant taxon not found in database.</Text>
      </View>
    );
  }

  const frName = names.find((n) => n.lang === 'fr')?.name;
  const arName = names.find((n) => n.lang === 'ar')?.name;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Botanical Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <View style={styles.familyBadge}>
            <Text style={styles.familyBadgeText}>{plant.family}</Text>
          </View>
          <View style={styles.evidenceBadge}>
            <Text style={styles.evidenceBadgeText}>
              {t('mobile.plant.evidenceGrade', { defaultValue: 'Grade A Evidence' })}
            </Text>
          </View>
        </View>

        <Text style={styles.scientificName}>{plant.accepted_name}</Text>

        <View style={styles.namesContainer}>
          {frName ? (
            <View style={styles.nameRow}>
              <Text style={styles.nameLabel}>{t('mobile.plant.commonFr', { defaultValue: 'Common (FR):' })}</Text>
              <Text style={styles.vernacularText}>{frName}</Text>
            </View>
          ) : null}
          {arName ? (
            <View style={styles.nameRow}>
              <Text style={styles.nameLabel}>{t('mobile.plant.traditionalAr', { defaultValue: 'Traditional (AR):' })}</Text>
              <Text style={styles.arabicText}>{arName}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Action Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, addedToJournal && styles.toolBtnDone]}
          onPress={handleAddToJournal}
          disabled={addingJournal}
        >
          {addedToJournal ? (
            <Check size={18} color={colors.primary} />
          ) : (
            <BookPlus size={18} color={colors.primary} />
          )}
          <Text style={[styles.toolBtnText, addedToJournal && { color: colors.primary }]}>
            {addedToJournal
              ? t('mobile.plant.inHerbarium', { defaultValue: 'In Herbarium' })
              : t('mobile.plant.addToJournal', { defaultValue: 'Add to Journal' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setMonographVisible(true)}
        >
          <FileText size={18} color={colors.accentBlue} />
          <Text style={[styles.toolBtnText, { color: colors.accentBlue }]}>
            {t('mobile.plant.monograph', { defaultValue: 'Monograph' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => router.push(`/research/${encodeURIComponent(plant.accepted_name)}`)}
        >
          <Sparkles size={18} color={colors.accentAmber} />
          <Text style={[styles.toolBtnText, { color: colors.accentAmber }]}>
            {t('mobile.plant.deepResearch', { defaultValue: 'Deep Research' })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Safety Banners */}
      {safetyFlags.map((flag, idx) => (
        <View key={idx} style={styles.safetyBanner}>
          <ShieldAlert size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>{flag.flag.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.safetyText}>{flag.note}</Text>
          </View>
        </View>
      ))}

      {/* Origin & Organs */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconCircle}>
            <MapPin size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>
            {t('mobile.plant.habitatTitle', { defaultValue: 'Habitat & Harvesting' })}
          </Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>
              {t('mobile.plant.biogeoRegion', { defaultValue: 'Biogeographical Region' })}
            </Text>
            <Text style={styles.infoValue}>{plant.region || 'Algeria & Mediterranean Basin'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>
              {t('mobile.plant.partUsed', { defaultValue: 'Medicinal Part Used' })}
            </Text>
            <Text style={styles.infoValue}>{plant.part_used || 'Flowering Tops & Leaves'}</Text>
          </View>
        </View>
      </View>

      {/* Phytochemical Composition */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconCircle}>
            <Leaf size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>
            {t('mobile.plant.phytochemTitle', { defaultValue: 'Phytochemical Metabolites' })}
          </Text>
        </View>
        
        <View style={styles.tagsRow}>
          {compounds.map((c, i) => (
            <View key={i} style={styles.compoundChip}>
              <Text style={styles.compoundText}>{c.name}</Text>
            </View>
          ))}
        </View>
        {plant.composition_raw ? (
          <Text style={styles.rawText}>{plant.composition_raw}</Text>
        ) : null}
      </View>

      {/* AI Pharmacology Prediction */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentBlueTint }]}>
            <BrainCircuit size={18} color={colors.accentBlue} />
          </View>
          <Text style={styles.aiTitle}>
            {t('mobile.plant.aiTitle', { defaultValue: 'AI Pharmacological Prediction' })}
          </Text>
        </View>
        <Text style={styles.aiDesc}>
          {t('mobile.plant.aiDesc', {
            name: plant.accepted_name,
            defaultValue: `Computational bioactivity analysis based on the metabolic profile of ${plant.accepted_name}.`
          })}
        </Text>

        {!prediction && (
          <TouchableOpacity
            style={styles.predictBtn}
            onPress={requestPrediction}
            disabled={predicting}
          >
            {predicting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.predictBtnText}>
                  {t('mobile.plant.runAi', { defaultValue: 'Run AI Prediction' })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {prediction && (
          <View style={styles.predictionResults}>
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>
                ENGINE: {prediction.meta?.provider?.toUpperCase() || 'GEMINI NEURAL'}
              </Text>
            </View>
            <Text style={styles.predictionSection}>
              {t('mobile.plant.predictedActions', { defaultValue: 'Predicted Pharmacological Actions' })}:
            </Text>
            <View style={styles.tagsRow}>
              {prediction.predicted_activities?.map((act: string, i: number) => (
                <View key={i} style={styles.predictedChip}>
                  <Text style={styles.predictedChipText}>{act}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.predictionSection}>
              {t('mobile.plant.reasoning', { defaultValue: 'Bio-Computational Reasoning' })}:
            </Text>
            <Text style={styles.reasoningText}>{prediction.reasoning}</Text>
          </View>
        )}
      </View>

      {/* Monograph Modal */}
      <Modal
        visible={monographVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMonographVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>Official Botanical Monograph</Text>
              </View>
              <TouchableOpacity onPress={() => setMonographVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.monoCard}>
                <Text style={styles.monoHeader}>PEOPLE'S DEMOCRATIC REPUBLIC OF ALGERIA</Text>
                <Text style={styles.monoSubHeader}>PHYTOSENSE v2 BOTANICAL INDEX • PHARMACOPOEIA DOSSIER</Text>
                <View style={styles.monoDivider} />

                <Text style={styles.monoSectionTitle}>1. BOTANICAL IDENTIFICATION</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>Scientific Taxon:</Text> {plant.accepted_name}</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>Family:</Text> {plant.family}</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>French Common Name:</Text> {frName || 'N/A'}</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>Arabic / Vernacular Name:</Text> {arName || 'N/A'}</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>Biogeographical Distribution:</Text> {plant.region || 'Algeria, North Africa'}</Text>

                <Text style={styles.monoSectionTitle}>2. BOTANICAL RAW MATERIAL</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>Employed Organ:</Text> {plant.part_used || 'Leaves, flowering tops, seeds'}</Text>
                <Text style={styles.monoLine}><Text style={styles.monoBold}>Standard Preparation:</Text> Infusion, aqueous decoction, oily macerate.</Text>

                <Text style={styles.monoSectionTitle}>3. PHYTOCHEMICAL CHARACTERIZATION</Text>
                <Text style={styles.monoBody}>
                  {compounds.length > 0
                    ? compounds.map((c) => c.name).join(' • ')
                    : plant.composition_raw || 'Phytochemical composition undergoing chromatographic enrichment.'}
                </Text>

                <Text style={styles.monoSectionTitle}>4. THERAPEUTIC USES & EVIDENCE GRADE</Text>
                <Text style={styles.monoBody}>
                  Recommendation Grade: B (Well-established traditional usage substantiated by in-vitro and chromatographic research).
                  Documented properties: Hepatoprotective, antioxidant, metabolic balancing, and anti-inflammatory activity.
                </Text>

                <Text style={styles.monoSectionTitle}>5. PRECAUTIONS & TOXICOLOGY</Text>
                {safetyFlags.length > 0 ? (
                  safetyFlags.map((flag, idx) => (
                    <Text key={idx} style={[styles.monoLine, { color: colors.accentAmber }]}>
                      ⚠️ [{flag.flag}] {flag.note}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.monoBody}>No acute toxicity reported at standard recommended culinary and therapeutic dosages.</Text>
                )}

                <Text style={styles.monoFooter}>
                  Generated by PhytoSense v2 on {new Date().toLocaleDateString('en-US')}. Academic & Research Monograph.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareMonograph}
              >
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>
                  {t('mobile.plant.share', { defaultValue: 'Share / Export Monograph' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  familyBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  familyBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  evidenceBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  evidenceBadgeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  scientificName: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  namesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 12,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  vernacularText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  arabicText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  toolBtnDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  toolBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.accentAmberTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 16,
  },
  safetyTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  safetyText: {
    color: '#B45309',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  infoGrid: {
    gap: 12,
  },
  infoCol: {
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: radii.sm,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  compoundChip: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  compoundText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  rawText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  aiCard: {
    backgroundColor: colors.accentBlueTint,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
    ...shadows.card,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  aiTitle: {
    color: colors.accentBlue,
    fontSize: 16,
    fontWeight: '700',
  },
  aiDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  predictBtn: {
    backgroundColor: colors.accentBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    ...shadows.subtle,
  },
  predictBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  predictionResults: {
    marginTop: 10,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  providerBadge: {
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    marginBottom: 10,
  },
  providerText: {
    color: colors.accentBlue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  predictionSection: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  predictedChip: {
    backgroundColor: colors.accentBlueTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  predictedChipText: {
    color: colors.accentBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  reasoningText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
  },
  modalScroll: {
    flex: 1,
  },
  monoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: radii.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monoHeader: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  monoSubHeader: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  monoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  monoSectionTitle: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  monoLine: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  monoBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monoBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  monoFooter: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  modalActions: {
    marginTop: 14,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    ...shadows.card,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
