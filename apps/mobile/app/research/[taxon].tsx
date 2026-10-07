import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  FlaskConical,
  Leaf,
  Layers,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Cpu,
  CheckCircle2,
} from 'lucide-react-native';
import { apiFetch } from '../../src/lib/api/client';
import { getDatabase } from '../../src/lib/db/sqlite';
import { colors, shadows, radii } from '../../src/lib/theme/tokens';

interface SimilarPlant {
  name: string;
  shared_compounds: string[];
  match_reason: string;
}

interface PredictedActivity {
  property: string;
  confidence: string;
  mechanism: string;
}

interface ResearchData {
  scientific_name: string;
  region: string;
  researched_compounds: string[];
  similar_local_plants: SimilarPlant[];
  predicted_activities: PredictedActivity[];
  meta?: {
    provider?: string;
    degraded?: boolean;
    latency_ms?: number;
  };
}

export default function DeepResearchScreen() {
  const { taxon } = useLocalSearchParams<{ taxon: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResearchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scientificName = taxon ? decodeURIComponent(taxon) : 'Unknown Taxon';

  useEffect(() => {
    executeResearch();
  }, [taxon]);

  const executeResearch = async () => {
    if (!taxon) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ResearchData>('/v1/research', {
        method: 'POST',
        body: JSON.stringify({ scientific_name: scientificName }),
      });
      setData(res);
    } catch (err: any) {
      console.warn('Deep research error:', err);
      setError(err?.message || 'Error occurred during phytochemical deep research.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLocalPlant = async (plantName: string) => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(
        'SELECT id FROM plant WHERE accepted_name LIKE ? LIMIT 1',
        [`%${plantName}%`]
      );
      if (row && row.id) {
        router.push(`/plant/${row.id}` as any);
      } else {
        router.push({
          pathname: '/(tabs)/search',
          params: { query: plantName },
        });
      }
    } catch {
      router.push({
        pathname: '/(tabs)/search',
        params: { query: plantName },
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>{t('common.back', { defaultValue: 'Back' })}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Title Card */}
      <View style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Sparkles size={14} color={colors.accentBlue} />
            <Text style={styles.badgeText}>{t('mobile.research.title', { defaultValue: 'Deep Phytochemical Research' })}</Text>
          </View>
          {data?.meta?.provider && (
            <View style={styles.providerBadge}>
              <Cpu size={12} color={colors.primary} />
              <Text style={styles.providerText}>
                {data.meta.provider.toUpperCase()} {data.meta.latency_ms ? `(${Math.round(data.meta.latency_ms)}ms)` : ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.plantTitle}>{scientificName}</Text>
        <Text style={styles.plantSubtitle}>
          {t('mobile.research.subtitle', { defaultValue: 'Comparative metabolomic profiling & identification of homologous active plant metabolites' })}
        </Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>{t('mobile.research.extractingProfile', { defaultValue: 'Extracting phytochemical profile...' })}</Text>
          <Text style={styles.loadingSubtitle}>
            {t('mobile.research.crossReferencing', { defaultValue: 'Cross-referencing active principles against the 155 curated taxa of Algeria' })}
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorBox}>
          <AlertCircle size={22} color={colors.danger} />
          <Text style={styles.errorTitle}>{t('mobile.research.queryFailed', { defaultValue: 'Research Query Failed' })}</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={executeResearch}>
            <Text style={styles.retryBtnText}>{t('mobile.research.retry', { defaultValue: 'Retry Analysis' })}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Content */}
      {!loading && data && (
        <>
          {/* Section 1: Researched Compounds */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FlaskConical size={18} color={colors.accentBlue} />
              <Text style={styles.sectionTitle}>{t('mobile.research.identifiedActiveMetabolites', { defaultValue: 'Identified Active Metabolites' })}</Text>
            </View>
            <Text style={styles.sectionDesc}>
              {t('mobile.research.isolatedCompoundsDesc', { defaultValue: 'Key chemical compounds and secondary metabolites isolated in this taxon:' })}
            </Text>

            <View style={styles.chipsWrap}>
              {data.researched_compounds?.map((comp, idx) => (
                <View key={idx} style={styles.compoundChip}>
                  <Text style={styles.compoundChipText}>{comp}</Text>
                </View>
              ))}
              {(!data.researched_compounds || data.researched_compounds.length === 0) && (
                <Text style={styles.emptyText}>{t('mobile.research.noMetabolites', { defaultValue: 'No isolated metabolites identified.' })}</Text>
              )}
            </View>
          </View>

          {/* Section 2: Similar Local Algerian Plants */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Layers size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('mobile.research.localHomologuesTitle', { defaultValue: 'Local Algerian Pharmacological Homologues' })}</Text>
            </View>
            <Text style={styles.sectionDesc}>
              {t('mobile.research.localHomologuesDesc', { defaultValue: 'Algerian native flora sharing equivalent bioactive markers:' })}
            </Text>

            {data.similar_local_plants?.map((sim, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.similarCard}
                onPress={() => handleOpenLocalPlant(sim.name)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.similarName}>{sim.name}</Text>
                  <Text style={styles.similarReason}>{sim.match_reason}</Text>

                  {sim.shared_compounds?.length > 0 && (
                    <View style={styles.sharedCompoundsRow}>
                      <Leaf size={12} color={colors.primary} />
                      <Text style={styles.sharedCompoundsText}>
                        {t('mobile.research.shared', { defaultValue: 'Shared:' })} {sim.shared_compounds.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
                <ArrowRight size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}

            {(!data.similar_local_plants || data.similar_local_plants.length === 0) && (
              <Text style={styles.emptyText}>{t('mobile.research.noHomologues', { defaultValue: 'No immediate local homologues identified in database.' })}</Text>
            )}
          </View>

          {/* Section 3: Predicted Activities */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ShieldCheck size={18} color={colors.accentAmber} />
              <Text style={styles.sectionTitle}>{t('mobile.research.modeledTherapeutic', { defaultValue: 'Modeled Therapeutic Activities' })}</Text>
            </View>
            <Text style={styles.sectionDesc}>
              {t('mobile.research.modeledTherapeuticDesc', { defaultValue: 'Computational pharmacology predictions based on metabolite synergy:' })}
            </Text>

            {data.predicted_activities?.map((act, idx) => (
              <View key={idx} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityProperty}>{act.property}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {t('mobile.research.confidenceBadge', { confidence: String(act.confidence || 'Medium'), defaultValue: `${String(act.confidence || 'Medium')} Confidence` })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activityMechanism}>{act.mechanism}</Text>
              </View>
            ))}

            {(!data.predicted_activities || data.predicted_activities.length === 0) && (
              <Text style={styles.emptyText}>{t('mobile.research.noActivities', { defaultValue: 'No predicted pharmacological bioactivities available.' })}</Text>
            )}
          </View>

          {/* Educational Disclaimer */}
          <View style={styles.disclaimerBox}>
            <AlertCircle size={18} color={colors.accentAmber} />
            <Text style={styles.disclaimerText}>
              {t('mobile.research.disclaimer', { defaultValue: 'Scientific & Clinical Disclaimer: The information presented is generated via computational pharmacology and academic literature cross-referencing. It is strictly intended for scientific research and educational purposes.' })}
            </Text>
          </View>
        </>
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
    paddingBottom: 40,
  },
  headerBar: {
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeText: {
    color: colors.accentBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  providerText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  plantTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  plantSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  centerBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  loadingTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 4,
  },
  loadingSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  errorDesc: {
    color: '#9F1239',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compoundChip: {
    backgroundColor: colors.accentBlueTint,
    borderColor: '#BAE6FD',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  compoundChipText: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textLight,
    fontStyle: 'italic',
    fontSize: 13,
  },
  similarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
  },
  similarName: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  similarReason: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sharedCompoundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  sharedCompoundsText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  activityCard: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityProperty: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  confidenceText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  activityMechanism: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.accentAmberTint,
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    marginTop: 4,
  },
  disclaimerText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});
