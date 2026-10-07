import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search as SearchIcon,
  Database,
  Sparkles,
  X,
  ChevronRight,
  Leaf,
  Filter,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { searchPlantsOffline, PlantSearchResult } from '../../src/lib/db/sqlite';
import { colors, shadows, radii } from '../../src/lib/theme/tokens';

const POPULAR_FILTERS = ['All', 'Lamiaceae', 'Asteraceae', 'Fabaceae', 'Apiaceae', 'Sahara'];

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    if (query.trim().length >= 2) {
      handleSearch(query);
    } else if (selectedFilter !== 'All') {
      handleSearch(selectedFilter);
    } else {
      // Default to initial sample list
      handleSearch('');
    }
  }, [query, selectedFilter]);

  const handleSearch = async (text: string) => {
    setLoading(true);
    try {
      const data = await searchPlantsOffline(text);
      setResults(data);
    } catch (e) {
      console.error('Offline search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedFilter('All');
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('mobile.search.placeholder', { defaultValue: 'Search scientific, French, or Arabic name...' })}
            placeholderTextColor={colors.textLight}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (selectedFilter !== 'All') setSelectedFilter('All');
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Indicator */}
        <View style={styles.modeIndicator}>
          <Database size={13} color={colors.primary} />
          <Text style={styles.modeText}>
            {t('mobile.search.modeIndicator', { defaultValue: 'Embedded SQLite FTS5 • 155 Endemic Taxa' })}
          </Text>
        </View>

        {/* Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {POPULAR_FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter && query.length === 0;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => {
                  setSelectedFilter(filter);
                  setQuery('');
                }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {filter === 'All' ? t('common.all', { defaultValue: 'All' }) : filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('mobile.search.searching', { defaultValue: 'Searching index...' })}
          </Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.trim().length >= 2 && !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Leaf size={32} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>
                {t('mobile.search.noMatchTitle', { defaultValue: 'No exact match found in local catalog' })}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t('mobile.search.noMatchSub', { query, defaultValue: `"${query}" might be an uncatalogued or exotic species.` })}
              </Text>
              <TouchableOpacity
                style={styles.deepResearchBtn}
                onPress={() => router.push(`/research/${encodeURIComponent(query)}`)}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.deepResearchText}>
                  {t('mobile.search.deepResearch', { defaultValue: 'Launch Autonomous Deep Research' })}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => router.push(`/plant/${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.plantIconBox}>
              <Leaf size={20} color={colors.primary} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.plantScientific}>{item.scientific_name}</Text>
              <View style={styles.namesRow}>
                {item.arabic_name ? (
                  <View style={styles.arabicPill}>
                    <Text style={styles.arabicText}>{item.arabic_name}</Text>
                  </View>
                ) : null}
                {item.french_name ? (
                  <Text style={styles.plantFrench} numberOfLines={1}>
                    {item.french_name}
                  </Text>
                ) : null}
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.familyBadge}>
                  <Text style={styles.familyBadgeText}>{item.family || 'Botanical Family'}</Text>
                </View>
              </View>
            </View>

            <ChevronRight size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.subtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 6,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  plantIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  plantScientific: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  arabicPill: {
    backgroundColor: colors.accentAmberTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  arabicText: {
    fontSize: 12,
    color: colors.accentAmber,
    fontWeight: '700',
  },
  plantFrench: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  familyBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  familyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  deepResearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.lg,
    ...shadows.elevated,
  },
  deepResearchText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
