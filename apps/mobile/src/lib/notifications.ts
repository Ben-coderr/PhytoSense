import { Platform } from 'react-native';

// Dynamically and safely acquire expo-notifications
let NotificationsModule: typeof import('expo-notifications') | null = null;
try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
    if (NotificationsModule && typeof NotificationsModule.setNotificationHandler === 'function') {
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  }
} catch (error) {
  // Expo Go Android SDK 53+ drops remote push notifications support and can throw on init
  console.warn('[Notifications] Background/foreground handler init skipped (Expo Go or unsupported):', error);
}

/**
 * Request notification permissions from the user (Android/iOS)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;
  try {
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a local watering reminder for a specific plant in the herbarium
 * @param plantName Name of the plant (e.g., "Thymus vulgaris")
 * @param intervalDays Number of days between waterings
 */
export async function scheduleWateringReminder(
  plantName: string,
  intervalDays: number
): Promise<string | null> {
  if (Platform.OS === 'web' || !NotificationsModule) return null;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const seconds = Math.max(60, intervalDays * 24 * 3600);

    const identifier = await NotificationsModule.scheduleNotificationAsync({
      content: {
        title: 'PhytoSense — Rappel d\'Arrosage',
        body: `Il est temps d'arroser votre ${plantName} selon son protocole cultural ECOCROP !`,
        sound: true,
        data: { plantName, intervalDays },
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });

    return identifier;
  } catch (error) {
    console.warn('Failed to schedule watering reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled reminder
 */
export async function cancelReminder(identifier: string): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    await NotificationsModule.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
}

