import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the API base URL based on runtime environment.
 * If running on a physical device connected via Wi-Fi/LAN, uses the Metro host IP (e.g., 172.20.10.14:8000).
 * If running in an Android Emulator, uses 10.0.2.2:8000.
 * If running on iOS Simulator or Web, uses localhost:8000.
 */
export function getApiBaseUrl(): string {
  // 1. Explicit environment override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // 2. Extract host IP from Expo dev server (Metro Constants)
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost ||
      '';

    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000`;
      }
    }
  } catch {
    // Graceful fallback if Constants is inaccessible
  }

  // 3. Extract host from NativeModules bundle scriptURL (React Native fallback)
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:\/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:8000`;
      }
    }
  } catch {
    // Graceful fallback
  }

  // 4. Android Emulator loopback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // 5. Default to localhost
  return 'http://localhost:8000';
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Checks whether an error is caused by network unreachability, timeout, or cancellation.
 */
export function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    err.name === 'AbortError' ||
    msg.includes('fetchrequestcanceledexception') ||
    msg.includes('canceled') ||
    msg.includes('cancelled') ||
    msg.includes('network request failed') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('failed to connect') ||
    msg.includes('connection refused') ||
    msg.includes('unreachable') ||
    msg.includes('could not connect') ||
    msg.includes('socket')
  );
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const timeoutMs = options.timeoutMs || 6000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errText);
      } catch {
        errorData = { detail: errText || `HTTP ${response.status}` };
      }
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (isNetworkError(err)) {
      throw new Error(`Server unreachable. Operating in edge-first disconnected mode.`);
    }
    const cleanMsg = (err.message || 'Network request failed')
      .replace(/\(at Expo\/NativeResponse\.swift:\d+\)/g, '')
      .replace(/FetchRequestCanceledException:?/g, 'Request timed out:')
      .trim();
    throw new Error(cleanMsg);
  } finally {
    clearTimeout(timer);
  }
}
