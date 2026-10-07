import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Plus,
  Droplets,
  Calendar,
  MapPin,
  Camera,
  Trash2,
  Check,
  X,
  Leaf,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import {
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  markPlantWatered,
  JournalEntry,
} from '../../src/lib/db/sqlite';
import { scheduleWateringReminder } from '../../src/lib/notifications';
import { colors, shadows, radii } from '../../src/lib/theme/tokens';

export default function JournalScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // New entry form state
  const [newPlantName, setNewPlantName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [newInterval, setNewInterval] = useState('3');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    loadJournal();
  }, []);

  const loadJournal = async () => {
    setLoading(true);
    try {
      const data = await getJournalEntries();
      setEntries(data);
    } catch (e) {
      console.warn('Failed to load herbarium journal:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setNewPhotoUri(res.assets[0].uri);
    }
  };

  const handleFetchGps = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentGps({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });
      } else {
        Alert.alert(
          t('common.error', { defaultValue: 'Permission Required' }),
          t('mobile.journal.locationPermissionRequired', { defaultValue: 'Location permission is required to geotag botanical observations.' })
        );
      }
    } catch (e) {
      console.warn('GPS location error:', e);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!newPlantName.trim()) return;
    try {
      const interval = parseInt(newInterval, 10) || 3;
      await addJournalEntry({
        plant_name: newPlantName.trim(),
        notes: newNotes.trim(),
        photo_uri: newPhotoUri || undefined,
        latitude: currentGps?.lat,
        longitude: currentGps?.lon,
        watering_interval_days: interval,
      });

      // Schedule local notification reminder
      await scheduleWateringReminder(newPlantName.trim(), interval);

      // Reset form
      setNewPlantName('');
      setNewNotes('');
      setNewPhotoUri(null);
      setCurrentGps(null);
      setModalVisible(false);
      // Reload
      await loadJournal();
    } catch (e) {
      console.warn('Failed to save herbarium entry:', e);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('mobile.journal.deleteTitle', { defaultValue: 'Delete Observation' }),
      t('mobile.journal.deleteConfirm', { defaultValue: 'Are you sure you want to remove this observation from your field journal?' }),
      [
        { text: t('mobile.journal.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('mobile.journal.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(id);
              setEntries(entries.filter((e) => e.id !== id));
            } catch (e) {
              console.warn('Failed to delete entry:', e);
            }
          },
        },
      ]
    );
  };

  const handleWater = async (id: number) => {
    try {
      await markPlantWatered(id);
      const today = new Date().toISOString().split('T')[0];
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        await scheduleWateringReminder(entry.plant_name, entry.watering_interval_days || 3);
      }
      setEntries(
        entries.map((e) => (e.id === id ? { ...e, last_watered: today } : e))
      );
    } catch (e) {
      console.warn('Failed to mark watered:', e);
    }
  };

  const getWaterStatus = (entry: JournalEntry) => {
    if (!entry.last_watered) {
      return { text: t('mobile.journal.waterRecommended', { defaultValue: 'Watering Recommended' }), urgent: true };
    }
    const lastDate = new Date(entry.last_watered);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const interval = Number(entry.watering_interval_days) || 3;
    const safeDiff = isNaN(diffDays) ? 0 : diffDays;
    const daysLeft = interval - safeDiff;

    if (daysLeft <= 0) {
      return { text: t('mobile.journal.waterDueToday', { defaultValue: 'Watering Due Today!' }), urgent: true };
    }
    return {
      text: t('mobile.journal.waterNextDays', { days: daysLeft, defaultValue: `Next watering in ${daysLeft} days` }),
      urgent: false,
    };
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>{t('mobile.journal.title', { defaultValue: 'Field Herbarium' })}</Text>
          <Text style={styles.headerSubtitle}>
            {t('mobile.journal.subtitle', { defaultValue: 'Botanical observations & cultivation tracking' })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('mobile.journal.addObservation', { defaultValue: 'Add Entry' })}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('mobile.journal.loading', { defaultValue: 'Loading field herbarium...' })}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <BookOpen size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{t('mobile.journal.emptyTitle', { defaultValue: 'Your Herbarium is Empty' })}</Text>
              <Text style={styles.emptySubtitle}>
                {t('mobile.journal.emptySubtitle', { defaultValue: 'Log your wild botanical field observations or track irrigation schedules for medicinal plants in your garden.' })}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setModalVisible(true)}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>{t('mobile.journal.recordFirst', { defaultValue: 'Record First Observation' })}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            entries.map((entry) => {
              const water = getWaterStatus(entry);
              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.cardTop}>
                    {entry.photo_uri ? (
                      <Image
                        source={{ uri: entry.photo_uri }}
                        style={styles.cardImage}
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Leaf size={28} color={colors.primary} />
                      </View>
                    )}

                    <View style={styles.cardInfo}>
                      <Text style={styles.entryTitle}>{entry.plant_name}</Text>
                      {entry.notes ? (
                        <Text style={styles.entryNotes} numberOfLines={2}>
                          {entry.notes}
                        </Text>
                      ) : null}

                      {entry.latitude != null && entry.longitude != null && !isNaN(Number(entry.latitude)) && !isNaN(Number(entry.longitude)) ? (
                        <View style={styles.gpsBadge}>
                          <MapPin size={11} color={colors.accentBlue} />
                          <Text style={styles.gpsText}>
                            {Number(entry.latitude).toFixed(3)}°N, {Number(entry.longitude).toFixed(3)}°E
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(entry.id)}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Watering reminder footer */}
                  <View style={styles.cardFooter}>
                    <View style={[
                      styles.waterBadge,
                      water.urgent ? styles.waterBadgeUrgent : styles.waterBadgeOk
                    ]}>
                      <Droplets
                        size={14}
                        color={water.urgent ? colors.danger : colors.primary}
                      />
                      <Text
                        style={[
                          styles.waterText,
                          water.urgent ? styles.waterTextUrgent : styles.waterTextOk,
                        ]}
                      >
                        {water.text}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.waterBtn}
                      onPress={() => handleWater(entry.id)}
                    >
                      <Check size={14} color="#FFFFFF" />
                      <Text style={styles.waterBtnText}>{t('mobile.journal.watered', { defaultValue: 'Watered' })}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Link to catalog dossier if attached */}
                  {entry.plant_id && (
                    <TouchableOpacity
                      style={styles.dossierLink}
                      onPress={() => router.push(`/plant/${entry.plant_id}` as any)}
                    >
                      <Text style={styles.dossierLinkText}>
                        {t('mobile.research.viewDossier', { defaultValue: 'View Complete Botanical Dossier' })}
                      </Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add Observation Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Leaf size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>{t('mobile.journal.newObservationTitle', { defaultValue: 'New Field Observation' })}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.inputLabel}>{t('mobile.journal.plantNameLabel', { defaultValue: 'Taxon / Plant Name *' })}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('mobile.journal.plantNamePlaceholder', { defaultValue: 'e.g., Thymus vulgaris, Rosmarinus, Artemisia...' })}
                placeholderTextColor={colors.textLight}
                value={newPlantName}
                onChangeText={setNewPlantName}
              />

              <Text style={styles.inputLabel}>{t('mobile.journal.notesLabel', { defaultValue: 'Field Notes / Habitat Details' })}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder={t('mobile.journal.notesPlaceholder', { defaultValue: 'e.g., Rocky limestone soil, full sun exposure, aromatic camphor notes...' })}
                placeholderTextColor={colors.textLight}
                multiline
                value={newNotes}
                onChangeText={setNewNotes}
              />

              <Text style={styles.inputLabel}>{t('mobile.journal.waterIntervalLabel', { defaultValue: 'Watering Interval (days)' })}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="3"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={newInterval}
                onChangeText={setNewInterval}
              />

              {/* Photo & GPS Row */}
              <View style={styles.toolRow}>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={handlePickPhoto}
                >
                  <Camera size={16} color={colors.primary} />
                  <Text style={styles.toolBtnText}>
                    {newPhotoUri
                      ? `✓ ${t('mobile.journal.changePhoto', { defaultValue: 'Change Photo' })}`
                      : t('mobile.journal.choosePhoto', { defaultValue: 'Add Photo' })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={handleFetchGps}
                  disabled={gpsLoading}
                >
                  <MapPin size={16} color={colors.accentBlue} />
                  <Text style={styles.toolBtnText}>
                    {gpsLoading
                      ? t('common.loading', { defaultValue: 'Locating...' })
                      : currentGps
                      ? `✓ ${t('mobile.journal.gpsAcquired', { defaultValue: 'GPS Tagged' })}`
                      : t('mobile.journal.fetchGps', { defaultValue: 'Capture GPS' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Photo Preview */}
              {newPhotoUri && (
                <View style={styles.photoPreviewBox}>
                  <Image
                    source={{ uri: newPhotoUri }}
                    style={styles.photoPreview}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setNewPhotoUri(null)}
                  >
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  !newPlantName.trim() && { opacity: 0.5 },
                ]}
                onPress={handleSaveEntry}
                disabled={!newPlantName.trim()}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>{t('mobile.journal.saveBtn', { defaultValue: 'Save to Herbarium' })}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.subtle,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.md,
    ...shadows.card,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    ...shadows.card,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.md,
    ...shadows.card,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  entryTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryNotes: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBlueTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  gpsText: {
    color: colors.accentBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  waterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  waterBadgeUrgent: {
    backgroundColor: colors.accentRoseTint,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  waterBadgeOk: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  waterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  waterTextUrgent: {
    color: colors.danger,
  },
  waterTextOk: {
    color: colors.primaryDark,
  },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  waterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dossierLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  dossierLinkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toolRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  toolBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  photoPreviewBox: {
    position: 'relative',
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 90,
    height: 90,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.danger,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    marginTop: 20,
    ...shadows.card,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
