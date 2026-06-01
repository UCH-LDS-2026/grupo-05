import { getToken, Player } from './storage';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
  }
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
};

const BASE = getApiBaseUrl();


async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(msg ?? `Error ${res.status}`);
  }
  return data as T;
}

// ---- Tipos de respuesta ----
export type KioskListItem = {
  id: string;
  name: string;
  address: string;
  city: string;
  brand: string | null;
  tags: string[];
  visitCount: number;
  reviewCount: number;
  avgRating: number | null;
};

export type ReviewItem = {
  id: string;
  author: string;
  attention: number;
  variety: number;
  cleanliness: number;
  prices: number;
  ambiance: number;
  comment: string | null;
  createdAt: string;
};

export type KioskDetail = KioskListItem & {
  myVisits: number;
  myReview: (ReviewItem & { playerId: string }) | null;
  reviews: ReviewItem[];
};

export type ReviewInput = {
  attention: number;
  variety: number;
  cleanliness: number;
  prices: number;
  ambiance: number;
  comment?: string;
};

export const api = {
  login: (code: string, name?: string) =>
    request<{ token: string; player: Player }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ code, name }),
    }),
  kiosks: () => request<KioskListItem[]>('/kiosks'),
  kiosk: (id: string) => request<KioskDetail>(`/kiosks/${id}`),
  addVisit: (id: string) =>
    request<{ id: string; createdAt: string; totalVisits: number }>(
      `/kiosks/${id}/visits`,
      { method: 'POST' },
    ),
  saveReview: (id: string, body: ReviewInput) =>
    request<ReviewItem>(`/kiosks/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
