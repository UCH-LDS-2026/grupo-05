import { getToken, Player } from './storage';

declare const process: { env?: Record<string, string | undefined> };

const BASE = process.env?.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

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
  lat?: number | null;
  lng?: number | null;
};

export type ReviewItem = {
  id: string;
  author: string;
  playerId?: string;
  attention: number;
  variety: number;
  cleanliness: number;
  prices: number;
  ambiance: number;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
};

// Promo evaluada por el motor para un player: incluye estado de elegibilidad
// y el progreso por regla (para guiar al usuario si todavía no califica).
export type ActivePromotion = {
  promotionId: string;
  title: string;
  description: string | null;
  rewardType: 'FREE_PRODUCT' | 'DISCOUNT_PCT' | 'DISCOUNT_AMOUNT' | 'TWO_FOR_ONE';
  rewardValue: number | null;
  rewardProduct: string | null;
  eligible: boolean;
  ruleProgress?: {
    type: 'FREQUENCY' | 'AMOUNT' | 'PRODUCTS';
    current: number | string[];
    required: number | string[];
    windowDays?: number;
  }[];
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

export type RedemptionValidation = {
  redemptionId: string;
  code: string;
  status: 'REDEEMED';
  expiresAt: string;
  redeemedAt: string | null;
  player: {
    id: string;
    name: string;
  };
  promotion: {
    id: string;
    title: string;
    description: string | null;
    rewardType: 'FREE_PRODUCT' | 'DISCOUNT_PCT' | 'DISCOUNT_AMOUNT' | 'TWO_FOR_ONE';
    rewardValue: number | null;
    rewardProduct: string | null;
    kioskId: string;
    kioskName: string;
  };
};

export type RedemptionRedeemed = RedemptionValidation;

export type KioskDetail = KioskListItem & {
  myVisits: number;
  myReview: (ReviewItem & { playerId: string }) | null;
  promotions: ActivePromotion[];
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

// --- Tipos de Owner ---
export type KioskUpsert = {
  name: string;
  address: string;
  city?: string;
  brand?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type OwnerKioskItem = KioskUpsert & { id: string; ownerId: string };

export type KioskStats = {
  kioskId: string;
  uniqueVisitors: number;
  avgRating: number | null;
  reviewCount: number;
  redemptionCount: number;
};

export type OwnerReviewKiosk = {
  id: string;
  name: string;
  address: string;
  city: string;
  brand: string | null;
  reviewCount: number;
  avgRating: number | null;
  reviews: ReviewItem[];
};

export type OwnerReviews = {
  summary: {
    kioskCount: number;
    reviewCount: number;
    avgRating: number | null;
  };
  kiosks: OwnerReviewKiosk[];
};

export type OwnerVisitQrKiosk = {
  id: string;
  name: string;
  address: string;
  city: string;
  brand: string | null;
  visitToken: string;
};

export type OwnerVisitQrs = {
  date: string;
  kiosks: OwnerVisitQrKiosk[];
};

// --- Tipos de Admin ---
export type AdminOwnerItem = {
  id: string;
  name: string;
  email: string;
  status: 'PENDIENTE_VALIDACION' | 'VALIDADO' | 'RECHAZADO';
  createdAt: string;
};

export type PromotionRuleInput = {
  type: 'FREQUENCY' | 'AMOUNT' | 'PRODUCTS';
  minVisits?: number;
  minAmount?: number;
  windowDays?: number;
  products?: string[];
};

export type PromotionInput = {
  kioskId: string;
  title: string;
  description?: string;
  active?: boolean;
  rewardType: 'FREE_PRODUCT' | 'DISCOUNT_PCT' | 'DISCOUNT_AMOUNT' | 'TWO_FOR_ONE';
  rewardValue?: number | null;
  rewardProduct?: string | null;
  audienceDays?: number[];
  audienceFromHour?: number | null;
  audienceToHour?: number | null;
  capPerPlayer?: number | null;
  capPerPeriod?: number | null;
  capTotal?: number | null;
  periodDays?: number | null;
  rules: PromotionRuleInput[];
  startsAt?: string | null;
  endsAt?: string | null;
};

export type PromotionRuleItem = PromotionRuleInput & { id: string; promotionId: string };

export type PromotionItem = Omit<PromotionInput, 'rules'> & {
  id: string;
  createdAt: string;
  rules: PromotionRuleItem[];
};

export const api = {
  login: (code: string, name?: string) =>
    request<{ token: string; player: Player }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ code, name }),
    }),
  kiosks: () => request<KioskListItem[]>('/kiosks'),
  kiosk: (id: string) => request<KioskDetail>(`/kiosks/${id}`),
  addVisit: (id: string, visitToken: string) =>
    request<{ id: string; createdAt: string; totalVisits: number }>(
      `/kiosks/${id}/visits`,
      { method: 'POST', body: JSON.stringify({ visitToken }) },
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
  ownerKiosks: () => request<OwnerKioskItem[]>('/owner/kiosks'),
  ownerCreateKiosk: (body: KioskUpsert) =>
    request<OwnerKioskItem>('/owner/kiosks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  ownerUpdateKiosk: (id: string, body: KioskUpsert) =>
    request<OwnerKioskItem>(`/owner/kiosks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  ownerKioskStats: (id: string) =>
    request<KioskStats>(`/owner/kiosks/${id}/stats`),
  ownerReviews: () => request<OwnerReviews>('/owner/reviews'),
  ownerVisitQrs: () => request<OwnerVisitQrs>('/owner/visit-qrs'),
  validateRedemption: (code: string) =>
    request<RedemptionValidation>('/owner/redemptions/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  ownerRedeemCode: (code: string) =>
    request<RedemptionRedeemed>('/owner/redemptions/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  adminLogin: (email: string, password: string) =>
    request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminOwners: () => request<AdminOwnerItem[]>('/admin/owners'),
  adminValidateOwner: (id: string) =>
    request<AdminOwnerItem>(`/admin/owners/${id}/validate`, {
      method: 'PATCH',
    }),
  ownerKioskPromotions: (kioskId: string) =>
    request<PromotionItem[]>(`/promotions/kiosk/${kioskId}`),
  ownerCreatePromotion: (body: PromotionInput) =>
    request<PromotionItem>('/promotions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  ownerUpdatePromotion: (id: string, body: Partial<PromotionInput>) =>
    request<PromotionItem>(`/promotions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  ownerTogglePromotion: (id: string, active: boolean) =>
    request<PromotionItem>(`/promotions/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
  ownerDeletePromotion: (id: string) =>
    request<void>(`/promotions/${id}`, {
      method: 'DELETE',
    }),
};
