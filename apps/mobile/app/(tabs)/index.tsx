import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Search,
  Sparkles,
  Sprout,
  ArrowRight,
  BookOpen,
  CloudSun,
  ShieldCheck,
  Leaf,
  Droplets,
  MapPin,
  ChevronRight,
  Zap,
  ThermometerSun,
  Award,
  Activity,
  Layers,
  Compass,
} from 'lucide-react-native';

import { colors, shadows, radii } from '../../src/lib/theme/tokens';

const QUICK_FILTERS = [
  { label: 'Thyme (Zaatar)', query: 'Thymus' },
  { label: 'Lavender', query: 'Lavandula' },
  { label: 'Chih (Wormwood)', query: 'Artemisia' },
  { label: 'Rosemary (Iklil)', query: 'Rosmarinus' },
  { label: 'Numidian Fir', query: 'Abies' },
];

const SPOTLIGHT_TAXA = [
  {
    id: 1,
    scientific: 'Nigella sativa L.',
    vernacular: 'Sanouj (السانوج) • Black Cumin',
    family: 'Ranunculaceae',
    grade: 'Grade A',
    bioactive: 'Thymoquinone & Nigellone',
    efficacy: 'Bronchodilator & Immune Defense',
    indication: 'Immunity & Respiration',
  },
  {
    id: 48,
    scientific: 'Artemisia herba-alba Asso',
    vernacular: 'Chih (الشيح) • White Wormwood',
    family: 'Asteraceae',
    grade: 'Grade A',
    bioactive: 'Santonin & Camphor',
    efficacy: 'Hypoglycemic & Visceral Spasmolytic',
    indication: 'Metabolism & Digestion',
  },
  {
    id: 46,
    scientific: 'Rosmarinus officinalis L.',
    vernacular: 'Iklil (إكليل الجبل) • Rosemary',
    family: 'Lamiaceae',
    grade: 'Grade A',
    bioactive: 'Carnosol & 1,8-Cineole',
    efficacy: 'Microcirculation & Cellular Defense',
    indication: 'Circulation & Memory',
  },
  {
    id: 45,
    scientific: 'Thymus vulgaris L.',
    vernacular: 'Zaatar (الزعتر) • Mountain Thyme',
    family: 'Lamiaceae',
    grade: 'Grade A',
    bioactive: 'Thymol & Carvacrol',
    efficacy: 'Antimicrobial & Biofilm Disruption',
    indication: 'Antiseptic & Throat',
  },
];

const REGIONS_DATA = [
  {
    name: 'Algiers',
    title: 'Algiers (Coastal Tell)',
    et0: '3.2 mm/d',
    irrigation: '8.8 L/m²',
    soilPh: '7.4 pH',
    seasonStatus: 'Autumn Sowing Active',
    climate: 'Sub-humid Mediterranean',
  },
  {
    name: 'Oran',
    title: 'Oran (Western Coast)',
    et0: '3.6 mm/d',
    irrigation: '10.2 L/m²',
    soilPh: '7.6 pH',
    seasonStatus: 'Optimal Foraging',
    climate: 'Semi-arid Coastal',
  },
  {
    name: 'Constantine',
    title: 'Constantine (High Plain)',
    et0: '3.1 mm/d',
    irrigation: '8.5 L/m²',
    soilPh: '7.2 pH',
    seasonStatus: 'Pre-Frost Prep',
    climate: 'Continental Mediterranean',
  },
  {
    name: 'Batna',
    title: 'Batna (Aurès)',
    et0: '3.4 mm/d',
    irrigation: '9.4 L/m²',
    soilPh: '7.5 pH',
    seasonStatus: 'Root Establishment',
    climate: 'Semi-arid Highland',
  },
  {
    name: 'Biskra',
    title: 'Biskra (Saharan Gateway)',
    et0: '5.1 mm/d',
    irrigation: '14.2 L/m²',
    soilPh: '7.8 pH',
    seasonStatus: 'Oasis Microclimate',
    climate: 'Arid Oasis Ecosystem',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionIdx, setSelectedRegionIdx] = useState(0);
  const [selectedSpotlightIdx, setSelectedSpotlightIdx] = useState(0);

  const activeRegion = REGIONS_DATA[selectedRegionIdx];
  const activeSpotlight = SPOTLIGHT_TAXA[selectedSpotlightIdx];

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleFilterClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Immersive Botanical Mountain Hero Card */}
      <ImageBackground
        source={require('../../assets/hero_bg.jpg')}
        style={styles.heroCard}
        imageStyle={styles.heroCardImage}
        resizeMode="cover"
      >
        {/* Subtle white-to-transparent gradient on the left for maximum text readability, leaving the lush dewy leaves and mountain panorama on the right 100% visible */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.94)',
            'rgba(255, 255, 255, 0.82)',
            'rgba(255, 255, 255, 0.35)',
            'rgba(255, 255, 255, 0.0)',
          ]}
          locations={[0, 0.35, 0.65, 0.9]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.2 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Hero Content Layer */}
        <View style={styles.heroContent}>
          {/* Brand & Tech Hierarchy Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.brandEmblemPill}>
              <Leaf size={14} color="#059669" strokeWidth={2.5} />
              <Text style={styles.brandEmblemText}>PhytoSense</Text>
            </View>
            <View style={styles.badgeOffline}>
              <ShieldCheck size={13} color="#2563EB" />
              <Text style={styles.badgeOfflineText}>
                {t('mobile.home.badgeOffline', { defaultValue: '100% Offline SQLite' })}
              </Text>
            </View>
          </View>

          {/* Left-Aligned Botanical Typography */}
          <View style={styles.heroHeadlineBlock}>
            <Text style={styles.heroTitle}>
              {t('mobile.home.heroTitle', { defaultValue: "Decode Nature's Chemistry" })}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('mobile.home.heroSubtitle', { defaultValue: 'AI Botanical Intelligence • 155 Curated Taxa' })}
            </Text>
          </View>

          {/* Primary Action: Prominent Rounded Search Bar */}
          <View style={styles.searchBar}>
            <Search size={20} color="#059669" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('mobile.home.searchPlaceholder', { defaultValue: 'Search Latin, French, or Arabic name...' })}
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearchSubmit}
              activeOpacity={0.8}
              accessibilityLabel="Search"
            >
              <ArrowRight size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Suggested / Popular Searches */}
          <View style={styles.popularRow}>
            <Text style={styles.popularLabel}>{t('mobile.home.popular', { defaultValue: 'Popular:' })}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickFiltersScroll}
            >
              {QUICK_FILTERS.map((f, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.filterChip}
                  onPress={() => handleFilterClick(f.query)}
                  activeOpacity={0.7}
                >
                  <Leaf size={11} color="#059669" />
                  <Text style={styles.filterChipText}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ImageBackground>

      {/* 2. Visual Statistics & Proof of Knowledge Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: '#D1FAE5' }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Leaf size={15} color="#059669" />
          </View>
          <Text style={[styles.statValue, { color: '#059669' }]}>155</Text>
          <Text style={styles.statLabel}>{t('mobile.home.taxa', { defaultValue: 'Curated Taxa' })}</Text>
        </View>

        <View style={[styles.statCard, { borderColor: '#DBEAFE' }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Layers size={15} color="#2563EB" />
          </View>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>69</Text>
          <Text style={styles.statLabel}>{t('mobile.home.families', { defaultValue: 'Families' })}</Text>
        </View>

        <View style={[styles.statCard, { borderColor: '#FEF3C7' }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
            <Zap size={15} color="#D97706" />
          </View>
          <Text style={[styles.statValue, { color: '#D97706' }]}>FTS5</Text>
          <Text style={styles.statLabel}>{t('mobile.home.fuzzySearch', { defaultValue: 'Instant FTS5 Search' })}</Text>
        </View>

        <View style={[styles.statCard, { borderColor: '#F3E8FF' }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#FAF5FF' }]}>
            <Sprout size={15} color="#7C3AED" />
          </View>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>FAO</Text>
          <Text style={styles.statLabel}>{t('mobile.home.ecocrop', { defaultValue: 'ECOCROP Engine' })}</Text>
        </View>
      </View>

      {/* 3. Product Feature Modules (Controlled Color Coding & Watermarks) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {t('mobile.home.modulesTitle', { defaultValue: 'Essential Modules' })}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('mobile.home.modulesSub', { defaultValue: 'Select a tool to launch' })}
        </Text>
      </View>

      <View style={styles.actionGrid}>
        {/* Module 1: Scan & Identify (Nature / AI Vision - Green) */}
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: '#D1FAE5' }]}
          onPress={() => router.push('/scan')}
          activeOpacity={0.82}
        >
          {/* Subtle Corner Motif */}
          <Camera size={56} color="#059669" style={styles.cardWatermark} />

          <View style={styles.actionCardHeader}>
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Camera size={20} color="#059669" />
            </View>
            <View style={[styles.actionBadge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.actionBadgeText, { color: '#059669' }]}>AI Vision</Text>
            </View>
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle} numberOfLines={1}>
              {t('mobile.home.scanTitle', { defaultValue: 'Scan & Identify' })}
            </Text>
            <Text style={styles.actionDesc} numberOfLines={2}>
              {t('mobile.home.scanDesc', { defaultValue: 'Real-time leaf, flower & bark recognition' })}
            </Text>
          </View>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionFooterLink, { color: '#059669' }]}>
              {t('mobile.home.scanAction', { defaultValue: 'Launch Camera' })}
            </Text>
            <ArrowRight size={13} color="#059669" />
          </View>
        </TouchableOpacity>

        {/* Module 2: Botanical Catalog (Data / Offline - Blue) */}
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: '#DBEAFE' }]}
          onPress={() => router.push('/search')}
          activeOpacity={0.82}
        >
          {/* Subtle Corner Motif */}
          <Search size={56} color="#2563EB" style={styles.cardWatermark} />

          <View style={styles.actionCardHeader}>
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Search size={20} color="#2563EB" />
            </View>
            <View style={[styles.actionBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.actionBadgeText, { color: '#2563EB' }]}>Offline FTS5</Text>
            </View>
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle} numberOfLines={1}>
              {t('mobile.home.catalogTitle', { defaultValue: 'Botanical Catalog' })}
            </Text>
            <Text style={styles.actionDesc} numberOfLines={2}>
              {t('mobile.home.catalogDesc', { defaultValue: '155 endemic taxa with verified chemistry' })}
            </Text>
          </View>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionFooterLink, { color: '#2563EB' }]}>
              {t('mobile.home.catalogAction', { defaultValue: 'Browse Catalog' })}
            </Text>
            <ArrowRight size={13} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* Module 3: Care Advisor (Care / Remedies - Amber/Orange) */}
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: '#FEF3C7' }]}
          onPress={() => router.push('/recommend')}
          activeOpacity={0.82}
        >
          {/* Subtle Corner Motif */}
          <Sparkles size={56} color="#D97706" style={styles.cardWatermark} />

          <View style={styles.actionCardHeader}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Sparkles size={20} color="#D97706" />
            </View>
            <View style={[styles.actionBadge, { backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.actionBadgeText, { color: '#D97706' }]}>Safety-Graded</Text>
            </View>
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle} numberOfLines={1}>
              {t('mobile.home.advisorTitle', { defaultValue: 'Care Advisor' })}
            </Text>
            <Text style={styles.actionDesc} numberOfLines={2}>
              {t('mobile.home.advisorDesc', { defaultValue: 'Evidence-graded remedies & contraindications' })}
            </Text>
          </View>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionFooterLink, { color: '#D97706' }]}>
              {t('mobile.home.advisorAction', { defaultValue: 'Find Remedies' })}
            </Text>
            <ArrowRight size={13} color="#D97706" />
          </View>
        </TouchableOpacity>

        {/* Module 4: Agronomy & Climate (Agriculture - Purple) */}
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: '#F3E8FF' }]}
          onPress={() => router.push('/garden')}
          activeOpacity={0.82}
        >
          {/* Subtle Corner Motif */}
          <Sprout size={56} color="#7C3AED" style={styles.cardWatermark} />

          <View style={styles.actionCardHeader}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
              <Sprout size={20} color="#7C3AED" />
            </View>
            <View style={[styles.actionBadge, { backgroundColor: '#FAF5FF' }]}>
              <Text style={[styles.actionBadgeText, { color: '#7C3AED' }]}>ECOCROP</Text>
            </View>
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle} numberOfLines={1}>
              {t('mobile.home.gardenTitle', { defaultValue: 'Agronomy & Climate' })}
            </Text>
            <Text style={styles.actionDesc} numberOfLines={2}>
              {t('mobile.home.gardenDesc', { defaultValue: 'Bioclimatic suitability & irrigation schedules' })}
            </Text>
          </View>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionFooterLink, { color: '#7C3AED' }]}>
              {t('mobile.home.gardenAction', { defaultValue: 'View Calendar' })}
            </Text>
            <ArrowRight size={13} color="#7C3AED" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Regional Agronomy Glance Widget */}
      <View style={styles.regionalCard}>
        <View style={styles.regionalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <MapPin size={17} color="#059669" />
            <Text style={styles.regionalTitle}>
              {t('mobile.home.regionalTitle', { defaultValue: 'Regional Agronomy' })}
            </Text>
          </View>
          <View style={styles.seasonBadge}>
            <Text style={styles.seasonBadgeText}>{activeRegion.seasonStatus}</Text>
          </View>
        </View>

        {/* Region Pills Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionsScroll}
        >
          {REGIONS_DATA.map((reg, idx) => {
            const isSelected = selectedRegionIdx === idx;
            return (
              <TouchableOpacity
                key={reg.name}
                style={[styles.regionChip, isSelected && styles.regionChipActive]}
                onPress={() => setSelectedRegionIdx(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                  {reg.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.regionSub}>{activeRegion.title} • {activeRegion.climate}</Text>

        {/* Regional Visual Telemetry Cards */}
        <View style={styles.regionalMetricsRow}>
          <View style={styles.regionalMetricBox}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <CloudSun size={15} color="#D97706" />
            </View>
            <Text style={styles.regionalMetricVal}>{activeRegion.et0}</Text>
            <Text style={styles.regionalMetricLabel}>{t('mobile.home.et0Rate', { defaultValue: 'ET₀ Rate' })}</Text>
          </View>
          <View style={styles.regionalMetricBox}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Droplets size={15} color="#0284C7" />
            </View>
            <Text style={styles.regionalMetricVal}>{activeRegion.irrigation}</Text>
            <Text style={styles.regionalMetricLabel}>{t('mobile.home.waterNeed', { defaultValue: 'Water Need' })}</Text>
          </View>
          <View style={styles.regionalMetricBox}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <ThermometerSun size={15} color="#059669" />
            </View>
            <Text style={styles.regionalMetricVal}>{activeRegion.soilPh}</Text>
            <Text style={styles.regionalMetricLabel}>{t('mobile.home.soilPh', { defaultValue: 'Soil pH' })}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.regionalActionBtn}
          onPress={() => router.push('/garden')}
          activeOpacity={0.8}
        >
          <Text style={styles.regionalActionText}>
            {t('mobile.home.regionalAction', { defaultValue: 'Open Precision Agronomy Model' })}
          </Text>
          <ArrowRight size={15} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* 5. Endemic Flora Spotlight */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Award size={17} color="#059669" />
          <Text style={styles.sectionTitle}>
            {t('mobile.home.spotlightTitle', { defaultValue: 'Endemic Flora Spotlight' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/search')} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>
            {t('mobile.home.exploreAll', { defaultValue: 'Explore 155 Taxa' })} →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Species Selector Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.spotlightScroll}
      >
        {SPOTLIGHT_TAXA.map((taxon, idx) => {
          const isSelected = selectedSpotlightIdx === idx;
          return (
            <TouchableOpacity
              key={taxon.id}
              style={[styles.spotlightChip, isSelected && styles.spotlightChipActive]}
              onPress={() => setSelectedSpotlightIdx(idx)}
              activeOpacity={0.7}
            >
              <Text style={[styles.spotlightChipText, isSelected && styles.spotlightChipTextActive]}>
                {taxon.scientific.split(' ')[0]} {taxon.scientific.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active Spotlight Plant Card */}
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => router.push(`/plant/${activeSpotlight.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.featuredHeader}>
          <View style={styles.featuredIconBox}>
            <Sprout size={22} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.featuredLatin}>{activeSpotlight.scientific}</Text>
            <Text style={styles.featuredVernacular}>{activeSpotlight.vernacular}</Text>
          </View>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{activeSpotlight.grade}</Text>
          </View>
        </View>

        {/* Clinical Efficacy Highlight Badge */}
        <View style={styles.efficacyBox}>
          <Zap size={14} color="#059669" />
          <Text style={styles.efficacyText}>{activeSpotlight.efficacy}</Text>
        </View>

        {/* Telemetry Tag Row */}
        <View style={styles.tagRow}>
          <View style={styles.familyTag}>
            <Text style={styles.familyTagText}>{activeSpotlight.family}</Text>
          </View>
          <View style={styles.compoundTag}>
            <Activity size={10} color="#065F46" style={{ marginRight: 3 }} />
            <Text style={styles.compoundTagText}>{activeSpotlight.bioactive}</Text>
          </View>
          <View style={styles.indicationTag}>
            <Text style={styles.indicationTagText}>{activeSpotlight.indication}</Text>
          </View>
        </View>

        <View style={styles.featuredFooter}>
          <Text style={styles.featuredFooterText}>
            {t('mobile.recommend.viewMonograph', { defaultValue: 'View Clinical Monograph' })}
          </Text>
          <ChevronRight size={16} color="#059669" />
        </View>
      </TouchableOpacity>

      {/* 6. Field Herbarium & Digital Logbook Card */}
      <TouchableOpacity
        style={styles.journalCard}
        onPress={() => router.push('/journal')}
        activeOpacity={0.85}
      >
        <View style={styles.journalIconBox}>
          <BookOpen size={22} color="#059669" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.journalHeaderRow}>
            <Text style={styles.journalTitle}>
              {t('mobile.home.journalTitle', { defaultValue: 'Field Herbarium & Journal' })}
            </Text>
            <ChevronRight size={16} color="#059669" />
          </View>
          <Text style={styles.journalDesc}>
            {t('mobile.home.journalDesc', { defaultValue: 'Geo-tagged specimen observations & offline logs.' })}
          </Text>
          <View style={styles.journalPillRow}>
            <View style={styles.journalPill}>
              <Text style={styles.journalPillText}>{t('mobile.home.gpsTagged', { defaultValue: 'GPS Tagged' })}</Text>
            </View>
            <View style={styles.journalPill}>
              <Text style={styles.journalPillText}>{t('mobile.home.offlineReady', { defaultValue: 'Offline Ready' })}</Text>
            </View>
            <View style={styles.journalPill}>
              <Text style={styles.journalPillText}>{t('mobile.home.photoDossier', { defaultValue: 'Photo Dossier' })}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },

  /* Hero Section */
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F291E',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    marginBottom: 16,
    minHeight: 275,
    ...shadows.card,
  },
  heroCardImage: {
    borderRadius: 26,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    padding: 18,
    zIndex: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  brandEmblemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.full,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  brandEmblemText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badgeOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.full,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeOfflineText: {
    color: '#2563EB',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroHeadlineBlock: {
    maxWidth: '75%',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 31,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 18,
  },

  /* Search Bar inside Hero */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Popular Searches Row */
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickFiltersScroll: {
    gap: 7,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(226, 232, 240, 0.9)',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: radii.full,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },

  /* 4-Item Statistics Grid */
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.subtle,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '900',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  seeAllText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Feature Modules 2x2 Grid */
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    position: 'relative',
    overflow: 'hidden',
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 144,
    ...shadows.subtle,
  },
  cardWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.06,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.xs,
  },
  actionBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionBody: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionFooterLink: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Regional Agronomy Card */
  regionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...shadows.card,
  },
  regionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  seasonBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.full,
  },
  seasonBadgeText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '700',
  },
  regionsScroll: {
    gap: 7,
    marginBottom: 10,
  },
  regionChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: radii.md,
  },
  regionChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  regionChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  regionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  regionSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  regionalMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  regionalMetricBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  metricIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  regionalMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 1,
  },
  regionalMetricLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  regionalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
  },
  regionalActionText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Spotlight Section */
  spotlightScroll: {
    gap: 7,
    marginBottom: 12,
  },
  spotlightChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: radii.full,
    ...shadows.subtle,
  },
  spotlightChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  spotlightChipText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#475569',
  },
  spotlightChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  /* Featured Plant Card */
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    ...shadows.card,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featuredIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredLatin: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    fontStyle: 'italic',
  },
  featuredVernacular: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  gradeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gradeBadgeText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '700',
  },
  efficacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  efficacyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  familyTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radii.xs,
  },
  familyTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  compoundTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radii.xs,
  },
  compoundTagText: {
    fontSize: 9.5,
    color: '#059669',
    fontWeight: '700',
  },
  indicationTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radii.xs,
  },
  indicationTagText: {
    fontSize: 9.5,
    color: '#92400E',
    fontWeight: '700',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  featuredFooterText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Field Herbarium Card */
  journalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...shadows.card,
  },
  journalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  journalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  journalDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 6,
  },
  journalPillRow: {
    flexDirection: 'row',
    gap: 5,
  },
  journalPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  journalPillText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
});
