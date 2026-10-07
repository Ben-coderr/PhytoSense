import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Leaf,
  Camera,
  Search,
  Sparkles,
  Sprout,
  User,
  X,
  Bookmark,
  Database,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';

import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { colors, radii, shadows } from '../../src/lib/theme/tokens';

function HeaderBrandTitle({ title, isHome = false }: { title: string; isHome?: boolean }) {
  const { t } = useTranslation();
  if (isHome) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            backgroundColor: '#ECFDF5',
            borderWidth: 1,
            borderColor: '#D1FAE5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Leaf color="#10B981" size={22} strokeWidth={2.5} />
        </View>
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              color: '#0F172A',
              letterSpacing: -0.4,
              lineHeight: 22,
            }}
          >
            PhytoSense
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#059669',
              letterSpacing: 0.1,
            }}
          >
            {t('mobile.headers.brandTagline', { defaultValue: 'AI for a Greener Tomorrow' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: '#ECFDF5',
          borderWidth: 1,
          borderColor: '#D1FAE5',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Leaf color="#10B981" size={19} strokeWidth={2.5} />
      </View>
      <Text
        style={{
          fontSize: 18.5,
          fontWeight: '800',
          color: '#0F172A',
          letterSpacing: -0.4,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

function HeaderRightControls() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LanguageSwitcher />

      <TouchableOpacity
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
        style={headerStyles.profileBtn}
        accessibilityLabel="Researcher Profile"
      >
        <User size={17} color="#0F172A" />
      </TouchableOpacity>

      {/* Account / Profile Sheet Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={headerStyles.modalOverlay}>
          <View style={headerStyles.modalCard}>
            <View style={headerStyles.modalHeader}>
              <View style={headerStyles.modalAvatarBox}>
                <User size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={headerStyles.modalUserName}>{t('mobile.headers.profileTitle', { defaultValue: 'Botanical Researcher' })}</Text>
                <Text style={headerStyles.modalUserRole}>{t('mobile.headers.profileRole', { defaultValue: 'PhytoSense Intelligence v2' })}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={headerStyles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Offline Engine Stats */}
            <View style={headerStyles.modalTelemetryBox}>
              <View style={headerStyles.modalTelemetryRow}>
                <Database size={15} color={colors.primary} />
                <Text style={headerStyles.modalTelemetryText}>{t('mobile.headers.taxaCurated', { defaultValue: '155 Curated Algerian Taxa' })}</Text>
                <View style={headerStyles.activePill}>
                  <Text style={headerStyles.activePillText}>{t('mobile.headers.offlineSqlite', { defaultValue: 'Offline SQLite' })}</Text>
                </View>
              </View>
              <View style={headerStyles.modalTelemetryRow}>
                <ShieldCheck size={15} color={colors.accentBlue} />
                <Text style={headerStyles.modalTelemetryText}>{t('mobile.headers.safetyFilters', { defaultValue: 'Deterministic Safety Filters' })}</Text>
                <View style={[headerStyles.activePill, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[headerStyles.activePillText, { color: colors.accentBlue }]}>{t('mobile.headers.active', { defaultValue: 'Active' })}</Text>
                </View>
              </View>
            </View>

            {/* Quick Navigation Items */}
            <TouchableOpacity
              style={headerStyles.modalActionRow}
              onPress={() => {
                setIsModalOpen(false);
                router.push('/search');
              }}
              activeOpacity={0.7}
            >
              <View style={headerStyles.modalActionLeft}>
                <Bookmark size={16} color={colors.primary} />
                <Text style={headerStyles.modalActionText}>{t('mobile.headers.bookmarks', { defaultValue: 'Saved Flora & Bookmarks' })}</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={headerStyles.modalActionRow}
              onPress={() => {
                setIsModalOpen(false);
                router.push('/journal');
              }}
              activeOpacity={0.7}
            >
              <View style={headerStyles.modalActionLeft}>
                <BookOpen size={16} color={colors.accentPurple} />
                <Text style={headerStyles.modalActionText}>{t('mobile.headers.logbook', { defaultValue: 'Field Observation Logbook' })}</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={headerStyles.modalCloseAction}
              onPress={() => setIsModalOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={headerStyles.modalCloseActionText}>{t('mobile.headers.done', { defaultValue: 'Done' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalUserRole: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTelemetryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  modalTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalTelemetryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseAction: {
    marginTop: 16,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCloseActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          start: 20,
          end: 20,
          height: 66,
          borderRadius: 28,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingTop: 0,
          paddingBottom: 0,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 18,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarItemStyle: {
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 6,
          height: 66,
        },
        tabBarIconStyle: {
          marginBottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 0,
          textAlign: 'center',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? 116 : 88,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        },
        headerTitleAlign: 'left',
        headerTintColor: '#0F172A',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          color: '#0F172A',
          letterSpacing: -0.4,
        },
        headerTitleContainerStyle: {
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingLeft: Platform.OS === 'ios' ? 16 : 8,
          paddingBottom: Platform.OS === 'ios' ? 8 : 4,
        },
        headerRightContainerStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: 16,
          paddingBottom: Platform.OS === 'ios' ? 8 : 4,
        },
        headerShadowVisible: true,
        headerLeft: () => null,
        headerRight: () => <HeaderRightControls />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home', { defaultValue: 'Home' }),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Leaf color={color} size={22} />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: focused ? colors.primary : 'transparent',
                  marginTop: 2,
                }}
              />
            </View>
          ),
          headerTitle: () => (
            <HeaderBrandTitle
              title={t('mobile.headers.home', { defaultValue: 'PhytoSense' })}
              isHome
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('nav.scan', { defaultValue: 'Identify' }),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Camera color={color} size={22} />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: focused ? colors.primary : 'transparent',
                  marginTop: 2,
                }}
              />
            </View>
          ),
          headerTitle: () => (
            <HeaderBrandTitle
              title={t('mobile.headers.scan', { defaultValue: 'Identify Flora' })}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav.search', { defaultValue: 'Search' }),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Search color={color} size={22} />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: focused ? colors.primary : 'transparent',
                  marginTop: 2,
                }}
              />
            </View>
          ),
          headerTitle: () => (
            <HeaderBrandTitle
              title={t('mobile.headers.search', { defaultValue: 'Botanical Catalog' })}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recommend"
        options={{
          title: t('nav.recommend', { defaultValue: 'Needs' }),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Sparkles color={color} size={22} />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: focused ? colors.primary : 'transparent',
                  marginTop: 2,
                }}
              />
            </View>
          ),
          headerTitle: () => (
            <HeaderBrandTitle
              title={t('mobile.headers.recommend', { defaultValue: 'Care Advisor' })}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: t('nav.garden', { defaultValue: 'Garden' }),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Sprout color={color} size={22} />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: focused ? colors.primary : 'transparent',
                  marginTop: 2,
                }}
              />
            </View>
          ),
          headerTitle: () => (
            <HeaderBrandTitle
              title={t('mobile.headers.garden', { defaultValue: 'Agronomy & Garden' })}
            />
          ),
        }}
      />
    </Tabs>
  );
}
