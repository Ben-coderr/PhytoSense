import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../src/lib/i18n';
import { applyDirection } from '../src/lib/i18n/rtl';
import i18n from '../src/lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 60 * 24, // 24h caching for static botanical data
    },
  },
});

import { useTranslation, I18nextProvider } from 'react-i18next';

function InnerLayout() {
  const { t } = useTranslation();

  useEffect(() => {
    const currentLang = (i18n.language || 'fr') as 'en' | 'fr' | 'ar';
    applyDirection(currentLang);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#059669',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          color: '#0F172A',
        },
        headerShadowVisible: true,
        contentStyle: {
          backgroundColor: '#F8FAFC',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="plant/[id]"
        options={{
          title: t('mobile.plant.monograph', { defaultValue: 'Botanical Monograph' }),
          headerBackTitle: t('common.back', { defaultValue: 'Back' }),
        }}
      />
      <Stack.Screen
        name="research/[taxon]"
        options={{
          title: t('mobile.research.title', { defaultValue: 'Deep Research AI' }),
          headerBackTitle: t('common.back', { defaultValue: 'Back' }),
        }}
      />
      <Stack.Screen
        name="journal/index"
        options={{
          title: t('mobile.journal.title', { defaultValue: 'Field Herbarium' }),
          headerBackTitle: t('common.back', { defaultValue: 'Back' }),
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle="dark-content" />
          <InnerLayout />
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
