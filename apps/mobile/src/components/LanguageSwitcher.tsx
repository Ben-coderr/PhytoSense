import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react-native';
import { applyDirection, SupportedLanguage } from '../lib/i18n/rtl';

const LANG_CYCLE: SupportedLanguage[] = ['en', 'fr', 'ar'];

const LANG_META: Record<SupportedLanguage, { label: string }> = {
  en: { label: 'EN' },
  fr: { label: 'FR' },
  ar: { label: 'عربي' },
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.slice(0, 2) || 'en') as SupportedLanguage;

  const handleCycleLanguage = async () => {
    const currentIndex = LANG_CYCLE.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % LANG_CYCLE.length;
    const nextLang = LANG_CYCLE[nextIndex];
    await i18n.changeLanguage(nextLang);
    await applyDirection(nextLang);
  };

  const meta = LANG_META[currentLang] || LANG_META.en;

  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={handleCycleLanguage}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Globe size={15} color="#059669" />
      <Text style={styles.langText}>{meta.label}</Text>
      <ChevronDown size={12} color="#64748B" style={{ marginLeft: -1 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  langText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
