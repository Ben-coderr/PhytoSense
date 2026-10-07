import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

export type SupportedLanguage = 'en' | 'fr' | 'ar';

export async function applyDirection(lang: SupportedLanguage) {
  const wantRTL = lang === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
    try {
      await Updates.reloadAsync();
    } catch {
      // In development or when updates module not active
      console.warn("Reload required to apply RTL changes.");
    }
  }
}

export function isCurrentRTL(): boolean {
  return I18nManager.isRTL;
}
