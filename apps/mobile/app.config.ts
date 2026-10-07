import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'PhytoSense',
  slug: 'phytosense',
  version: '2.0.0',
  scheme: 'phytosense',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.phytosense.app',
    icon: './assets/icon.png',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.phytosense.app',
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION'
    ]
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'PhytoSense utilise la caméra pour identifier les plantes médicinales sur le terrain.'
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Sélectionnez une photo de feuille, fleur ou écorce pour l\'identification.'
      }
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Utilisé pour analyser les conditions bioclimatiques et agronomiques locales.'
      }
    ],
    'expo-sqlite',
    'expo-localization'
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export default config;
