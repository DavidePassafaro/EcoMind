import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = 'ecomind.api.token.v1';

function authDebug(label: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`[api-auth] ${label}`);
    return;
  }

  try {
    console.log(`[api-auth] ${label}`, payload);
  } catch {
    console.log(`[api-auth] ${label}`);
  }
}

function getBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

  if (!baseUrl) {
    throw new Error('API base URL non configurata.');
  }

  return baseUrl;
}

function getCredentials() {
  const email = process.env.EXPO_PUBLIC_API_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_API_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error('Credenziali API non configurate.');
  }

  return { email, password };
}

type LoginResponse = {
  token?: string;
};

export async function loginAndStoreApiToken() {
  const baseUrl = getBaseUrl();
  const credentials = getCredentials();
  authDebug('login start', {
    baseUrl,
    email: credentials.email,
  });

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  authDebug('login response', { status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(`Login API fallito (${response.status}).`);
  }

  const payload = (await response.json()) as LoginResponse;

  if (!payload.token) {
    throw new Error('Il login non ha restituito un token valido.');
  }

  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
  authDebug('token stored', {
    tokenLength: payload.token.length,
  });
  return payload.token;
}

export async function getStoredApiToken() {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  authDebug('read cached token', { hasToken: Boolean(token) });
  return token;
}

export async function getOrRefreshApiToken(forceRefresh = false) {
  authDebug('getOrRefresh token', { forceRefresh });
  if (!forceRefresh) {
    const cachedToken = await getStoredApiToken();
    if (cachedToken) {
      authDebug('using cached token');
      return cachedToken;
    }
  }

  authDebug('refreshing token via login');
  return loginAndStoreApiToken();
}

export function getApiBaseUrl() {
  const baseUrl = getBaseUrl();
  authDebug('resolved base url', { baseUrl });
  return baseUrl;
}
