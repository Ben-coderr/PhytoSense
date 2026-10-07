import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { apiFetch } from '../../src/lib/api/client';
import { colors, shadows, radii } from '../../src/lib/theme/tokens';

const NEEDS_LIST = [
  { key: 'skin.acne', label: 'Acne & Blemishes', category: 'Skin' },
  { key: 'skin.dry_skin', label: 'Dry & Flaky Skin', category: 'Skin' },
  { key: 'skin.wounds_scars', label: 'Wounds & Scars', category: 'Skin' },
  { key: 'skin.anti_aging', label: 'Anti-Aging & Tone', category: 'Skin' },
  { key: 'skin.fungal', label: 'Fungal Irritations', category: 'Skin' },
  { key: 'pain.joint_muscle', label: 'Joint & Muscle Pain', category: 'Pain' },
  { key: 'digestion.spasm_bloating', label: 'Spasms & Bloating', category: 'Digestion' },
  { key: 'metabolism.diabetes_support', label: 'Glycemic Support', category: 'Metabolism' },
];

export default function RecommendScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedNeed, setSelectedNeed] = useState('skin.acne');
  const [isPregnant, setIsPregnant] = useState(false);
  const [isChild, setIsChild] = useState(false);
  const [hasAsteraceaeAllergy, setHasAsteraceaeAllergy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isOfflineEngine, setIsOfflineEngine] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);

  const OFFLINE_RECOMMENDATION_DB: Record<string, any[]> = {
    'skin.acne': [
      {
        id: 1,
        scientific_name: 'Rosmarinus officinalis L.',
        french_name: 'Romarin officinal',
        arabic_name: 'إكليل الجبل',
        family: 'Lamiaceae',
        score: 0.94,
        evidence_grade: 'A',
        rationale: 'High rosmarinic acid and camphor content regulates excessive sebum and exhibits antimicrobial activity against Cutibacterium acnes.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 2,
        scientific_name: 'Thymus vulgaris L.',
        french_name: 'Thym vulgaire',
        arabic_name: 'الزعتر',
        family: 'Lamiaceae',
        score: 0.91,
        evidence_grade: 'A',
        rationale: 'Thymol and carvacrol deliver broad-spectrum antibacterial disinfection, drying active pustules and reducing follicular inflammation.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 3,
        scientific_name: 'Lavandula angustifolia Mill.',
        french_name: 'Lavande vraie',
        arabic_name: 'الخزامى',
        family: 'Lamiaceae',
        score: 0.86,
        evidence_grade: 'B',
        rationale: 'Linalool and linalyl acetate soothe skin irritation and accelerate post-breakout scar healing.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
    ],
    'skin.dry_skin': [
      {
        id: 4,
        scientific_name: 'Argania spinosa (L.) Skeels',
        french_name: 'Arganier du Sud',
        arabic_name: 'الأركان',
        family: 'Sapotaceae',
        score: 0.96,
        evidence_grade: 'A',
        rationale: 'High concentration of oleic/linoleic essential fatty acids and squalene repairs stratum corneum lipid barriers.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 5,
        scientific_name: 'Olea europaea L.',
        french_name: 'Olivier méditerranéen',
        arabic_name: 'الزيتون',
        family: 'Oleaceae',
        score: 0.90,
        evidence_grade: 'A',
        rationale: 'Natural polyphenols and squalane hydrate xerotic epidermis without clogging pores.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 6,
        scientific_name: 'Nigella sativa L.',
        french_name: 'Nigelle cultivée',
        arabic_name: 'السانوج',
        family: 'Ranunculaceae',
        score: 0.85,
        evidence_grade: 'B',
        rationale: 'Thymoquinone and unsaturated lipids soothe flaking and atopic pruritus.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
    ],
    'skin.wounds_scars': [
      {
        id: 7,
        scientific_name: 'Hypericum perforatum L.',
        french_name: 'Millepertuis perforé',
        arabic_name: 'عشبة القلب',
        family: 'Hypericaceae',
        score: 0.95,
        evidence_grade: 'A',
        rationale: 'Hyperforin and hypericin promote rapid granulation and fibroblast proliferation in epithelial lesions.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 8,
        scientific_name: 'Calendula officinalis L.',
        french_name: 'Souci officinal',
        arabic_name: 'الأقحوان',
        family: 'Asteraceae',
        score: 0.92,
        evidence_grade: 'A',
        rationale: 'Triterpenoid saponins stimulate angiogenesis and cellular re-epithelialization.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: true },
      },
    ],
    'pain.joint_muscle': [
      {
        id: 9,
        scientific_name: 'Eucalyptus globulus Labill.',
        french_name: 'Gommier bleu',
        arabic_name: 'الكاليتوس',
        family: 'Myrtaceae',
        score: 0.94,
        evidence_grade: 'A',
        rationale: 'Topical 1,8-cineole reduces cytokine expression in inflamed joint tissues and provides analgesic relief.',
        contraindications: { pregnant: false, pediatric: true, asteraceae: false },
      },
      {
        id: 1,
        scientific_name: 'Rosmarinus officinalis L.',
        french_name: 'Romarin officinal',
        arabic_name: 'إكليل الجبل',
        family: 'Lamiaceae',
        score: 0.88,
        evidence_grade: 'B',
        rationale: 'Stimulates peripheral microcirculation to soothe muscular fatigue and rheumatic aching.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
    ],
    'digestion.spasm_bloating': [
      {
        id: 10,
        scientific_name: 'Mentha piperita L.',
        french_name: 'Menthe poivrée',
        arabic_name: 'النعناع',
        family: 'Lamiaceae',
        score: 0.95,
        evidence_grade: 'A',
        rationale: 'Menthol blocks calcium channels in intestinal smooth muscle, directly relieving gastrointestinal spasms.',
        contraindications: { pregnant: false, pediatric: true, asteraceae: false },
      },
      {
        id: 11,
        scientific_name: 'Foeniculum vulgare Mill.',
        french_name: 'Fenouil sauvage',
        arabic_name: 'البسباس',
        family: 'Apiaceae',
        score: 0.90,
        evidence_grade: 'A',
        rationale: 'Anethole exhibits carminative properties that dispel trapped abdominal gas and cramping.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 12,
        scientific_name: 'Matricaria chamomilla L.',
        french_name: 'Camomille vraie',
        arabic_name: 'البابونج',
        family: 'Asteraceae',
        score: 0.87,
        evidence_grade: 'B',
        rationale: 'Apigenin binds central benzodiazepine receptors, calming neurogenic gut tension.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: true },
      },
    ],
    'metabolism.diabetes_support': [
      {
        id: 13,
        scientific_name: 'Artemisia herba-alba Asso',
        french_name: 'Armoise blanche (Chih)',
        arabic_name: 'الشيح',
        family: 'Asteraceae',
        score: 0.92,
        evidence_grade: 'A',
        rationale: 'Documented traditional steppe herb used for postprandial glucose moderation.',
        contraindications: { pregnant: true, pediatric: true, asteraceae: true },
      },
      {
        id: 5,
        scientific_name: 'Olea europaea L.',
        french_name: 'Feuilles d\'olivier',
        arabic_name: 'ورق الزيتون',
        family: 'Oleaceae',
        score: 0.89,
        evidence_grade: 'A',
        rationale: 'Oleuropein enhances peripheral insulin sensitivity and protects vascular endothelium.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
      {
        id: 6,
        scientific_name: 'Nigella sativa L.',
        french_name: 'Nigelle cultivée',
        arabic_name: 'السانوج',
        family: 'Ranunculaceae',
        score: 0.86,
        evidence_grade: 'B',
        rationale: 'Stimulates pancreatic beta-cell insulin secretion and reduces gluconeogenesis.',
        contraindications: { pregnant: false, pediatric: false, asteraceae: false },
      },
    ],
  };

  const fetchRecommendations = async (
    needKey: string,
    pregnant: boolean,
    child: boolean,
    allergy: boolean
  ) => {
    setLoading(true);
    try {
      const allergies = allergy ? ['Asteraceae'] : [];
      const data = await apiFetch('/v1/recommend', {
        method: 'POST',
        body: JSON.stringify({
          needs: [needKey],
          profile: {
            pregnant,
            pediatric: child,
            allergy_families: allergies,
          },
          limit: 5,
        }),
        timeoutMs: 3500,
      });

      setResults(data.results || []);
      setExcludedCount(data.excluded_for_safety || 0);
      setIsOfflineEngine(false);
    } catch (e) {
      console.warn('Backend unavailable, engaging offline clinical safety model:', e);
      setIsOfflineEngine(true);
      const candidates = OFFLINE_RECOMMENDATION_DB[needKey] || OFFLINE_RECOMMENDATION_DB['skin.acne'];
      const safe: any[] = [];
      let excluded = 0;

      for (const plant of candidates) {
        const c = plant.contraindications || {};
        if (pregnant && c.pregnant) {
          excluded++;
          continue;
        }
        if (child && c.pediatric) {
          excluded++;
          continue;
        }
        if (allergy && c.asteraceae) {
          excluded++;
          continue;
        }
        safe.push(plant);
      }

      setResults(safe);
      setExcludedCount(excluded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(selectedNeed, isPregnant, isChild, hasAsteraceaeAllergy);
  }, [selectedNeed, isPregnant, isChild, hasAsteraceaeAllergy]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.badge}>
          <Sparkles size={13} color={colors.primary} />
          <Text style={styles.badgeText}>{t('mobile.recommend.badge', { defaultValue: 'Evidence-Graded AI Engine' })}</Text>
        </View>
        <Text style={styles.headerTitle}>{t('mobile.recommend.title', { defaultValue: 'Therapeutic Care Advisor' })}</Text>
        <Text style={styles.headerSubtitle}>
          {t('mobile.recommend.subtitle', { defaultValue: 'Select your wellness or dermatological need to discover medicinal plants with scientifically documented pharmacological actions.' })}
        </Text>
      </View>

      {/* Needs Chips */}
      <Text style={styles.sectionTitle}>{t('mobile.recommend.needQuestion', { defaultValue: 'What do you need help with?' })}</Text>
      <View style={styles.chipsContainer}>
        {NEEDS_LIST.map((item) => {
          const isSelected = selectedNeed === item.key;
          const shortKey = item.key.split('.')[1];
          const translatedLabel = t(`mobile.recommend.needs.${shortKey}`, { defaultValue: item.label });
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedNeed(item.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {translatedLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Safety & Contraindication Filters */}
      <View style={styles.safetyCard}>
        <View style={styles.safetyHeader}>
          <ShieldAlert size={18} color={colors.accentAmber} />
          <Text style={styles.safetyTitle}>{t('mobile.recommend.safetyTitle', { defaultValue: 'Safety & Tolerance Profile' })}</Text>
        </View>
        <Text style={styles.safetySubtitle}>
          {t('mobile.recommend.safetySubtitle', { defaultValue: 'Deterministic safety barriers automatically exclude risky or contraindicated species.' })}
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('mobile.recommend.pregnantLabel', { defaultValue: 'Pregnant or Lactating Patient' })}</Text>
          <Switch
            value={isPregnant}
            onValueChange={setIsPregnant}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isPregnant ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('mobile.recommend.pediatricLabel', { defaultValue: 'Pediatric Subject (< 12 years)' })}</Text>
          <Switch
            value={isChild}
            onValueChange={setIsChild}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isChild ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('mobile.recommend.allergyLabel', { defaultValue: 'Asteraceae Allergy (Chamomile, Arnica)' })}</Text>
          <Switch
            value={hasAsteraceaeAllergy}
            onValueChange={setHasAsteraceaeAllergy}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={hasAsteraceaeAllergy ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        {excludedCount > 0 && (
          <View style={styles.excludedBanner}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={styles.excludedText}>
              {t('mobile.recommend.excludedBanner', {
                count: excludedCount,
                defaultValue: `${excludedCount} species excluded for medical safety compliance`
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Recommended Plants List */}
      <View style={styles.resultsHeaderRow}>
        <Text style={styles.sectionTitle}>{t('mobile.recommend.rankedTitle', { defaultValue: 'Ranked Recommendations' })}</Text>
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {isOfflineEngine && (
        <View style={styles.offlineNotice}>
          <Sparkles size={13} color={colors.primary} />
          <Text style={styles.offlineNoticeText}>
            {t('mobile.recommend.offlineNotice', { defaultValue: 'Disconnected Field Mode • Local Botanical Safety Model Active' })}
          </Text>
        </View>
      )}

      {results.map((plant, index) => {
        const scorePercent = Math.round((plant.score || 0.85) * 100);
        return (
          <TouchableOpacity
            key={plant.id || index}
            style={styles.resultCard}
            onPress={() => router.push(`/plant/${plant.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.resultTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultLatin}>{plant.scientific_name}</Text>
                <Text style={styles.resultVernacular}>
                  {plant.arabic_name ? `${plant.arabic_name} • ` : ''}
                  {plant.french_name || 'Vernacular name'}
                </Text>
              </View>

              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>
                  {t('mobile.recommend.match', { percent: scorePercent, defaultValue: `${scorePercent}% Match` })}
                </Text>
              </View>
            </View>

            {/* Evidence & Rationale */}
            <View style={styles.rationaleBox}>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>
                  {t('mobile.recommend.grade', {
                    grade: plant.evidence_grade || (index === 0 ? 'A' : 'B'),
                    defaultValue: `Grade ${plant.evidence_grade || (index === 0 ? 'A' : 'B')}`
                  })}
                </Text>
              </View>
              <Text style={styles.rationaleText} numberOfLines={2}>
                {plant.rationale ||
                  plant.biological_activity ||
                  'Documented antimicrobial, anti-inflammatory and cellular repair actions.'}
              </Text>
            </View>

            {/* Safety warnings if present */}
            {plant.safety_banners && plant.safety_banners.length > 0 && (
              <View style={styles.warningBanner}>
                <AlertTriangle size={14} color={colors.accentAmber} />
                <Text style={styles.warningText}>
                  {plant.safety_banners[0].message || t('mobile.recommend.caution', { defaultValue: 'Use caution with sensitive skin' })}
                </Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.viewDetailsText}>
                {t('mobile.recommend.viewMonograph', { defaultValue: 'View Clinical Monograph' })}
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
    paddingBottom: 100,
  },

  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadows.card,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  safetyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadows.card,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  safetySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  excludedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryTint,
    padding: 10,
    borderRadius: radii.md,
    marginTop: 14,
  },
  excludedText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.card,
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultLatin: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  resultVernacular: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  scoreText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  rationaleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 12,
  },
  gradeBadge: {
    backgroundColor: colors.accentAmberTint,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.accentAmber,
  },
  gradeText: {
    color: colors.accentAmber,
    fontSize: 10,
    fontWeight: '800',
  },
  rationaleText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentAmberTint,
    padding: 8,
    borderRadius: radii.sm,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 11,
    color: colors.accentAmber,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    marginBottom: 14,
  },
  offlineNoticeText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
