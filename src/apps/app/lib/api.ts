import { getToken, Player } from './storage';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

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

export type PromotionItem = {
  id: string;
  title: string;
  description: string | null;
  minVisits: number;
  eligible: boolean;
};

export type RedemptionStart = {
  redemptionId: string;
  code: string;
  expiresAt: string; // ISO
  redeemedAt: string | null;
  promotion: {
    id: string;
    title: string;
    description: string | null;
    kioskName: string;
  };
};

export type KioskDetail = KioskListItem & {
  myVisits: number;
  myReview: (ReviewItem & { playerId: string }) | null;
  promotions: PromotionItem[];
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
  redeemPromo: (kioskId: string, promotionId: string) =>
    request<RedemptionStart>(
      `/kiosks/${kioskId}/promotions/${promotionId}/redeem`,
      { method: 'POST' },
    ),
  ownerRegister: (name: string, email: string, password: string) =>
    request('/auth/owner/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  ownerLogin: (email: string, password: string) =>
    request('/auth/owner/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
