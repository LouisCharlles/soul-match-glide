import type {
  AppConsentStatus,
  AppInterest,
  AppLegalDocument,
  AppLikeReceived,
  AppMatch,
  AppMessage,
  AppPhoto,
  AppProfile,
  AppPremiumPlan,
  AppReport,
  AppSpotifyTrack,
  AppStory,
  AppSubscription,
  AppUserProfile,
  AppVerificationAttempt,
  AppWallet,
  AppWalletEntry,
  ConsentType,
  DateSuggestion,
  LoginPayload,
  ProfileFormValues,
  ProfileStats,
  ReportReason,
  SignUpPayload,
  UserSummary,
} from "@/lib/types";
import { DEFAULT_ACCENT_COLOR, normalizeAccentColor } from "@/lib/colors";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: BodyInit | Record<string, unknown>;
  auth?: boolean;
  headers?: Record<string, string>;
  retryOnAuthError?: boolean;
}

interface TokenResponse {
  access: string;
  user: UserSummary;
}

interface ApiLocation {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  neighborhood?: string | null;
}

interface ApiInterest {
  id: number;
  name: string;
}

interface ApiLegalDocument {
  id: number;
  document_type: "terms_of_use" | "privacy_policy" | "research_consent";
  version_label: string;
  content: string;
  content_hash: string;
  effective_date: string;
  published_at: string;
}

interface ApiConsentStatus {
  consent_type: ConsentType;
  action: "granted" | "revoked";
  granted_at: string;
  is_up_to_date: boolean;
}

interface ApiPhoto {
  id: number;
  image: string | null;
  image_url: string | null;
  client_request_id?: string | null;
  order?: number;
  is_primary?: boolean;
}

interface ApiStoryReaction {
  id: number;
  emoji: string;
  user: UserSummary;
  user_display_name?: string | null;
}

interface ApiStory {
  id: number;
  author: UserSummary;
  author_display_name?: string | null;
  media_type: "image" | "video";
  media: string | null;
  media_url: string | null;
  client_request_id?: string | null;
  caption: string;
  expires_at: string;
  created_at: string;
  viewers_count: number;
  reactions: ApiStoryReaction[];
}

interface ApiProfileWritePayload {
  name: string;
  age: number;
  bio: string;
  occupation: string;
  education: string;
  course?: string;
  gender: string;
  sexual_orientation: string;
  relationship_intent: string;
  show_age: boolean;
  allow_video_calls: boolean;
  allow_date_suggestions: boolean;
  is_invisible_mode: boolean;
  accent_color?: string;
  location_id?: number;
  interest_ids: number[];
}

interface ApiProfile {
  uuid: string;
  user: UserSummary;
  name: string;
  age: number;
  bio: string | null;
  occupation: string;
  education: string;
  location: ApiLocation | null;
  gender: string;
  sexual_orientation: string;
  course: string;
  is_online: boolean;
  show_age: boolean;
  allow_video_calls: boolean;
  allow_date_suggestions: boolean;
  is_invisible_mode: boolean;
  relationship_intent: string;
  spotify_track?: {
    id: string;
    name: string;
    artist: string;
    url: string;
    image_url: string;
    preview_url?: string | null;
  } | null;
  spotify_track_id?: string;
  spotify_track_name?: string;
  spotify_artist_name?: string;
  spotify_track_url?: string;
  spotify_album_image_url?: string;
  spotify_preview_url?: string;
  accent_color?: string | null;
  is_verified: boolean;
  premium_tier?: string;
  interests: ApiInterest[];
  photos: ApiPhoto[];
  stats?: ProfileStats;
  distance_km?: number | null;
}

interface ApiLocationResponse {
  id: number;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  neighborhood?: string | null;
}

interface ApiOptionItem {
  id: number;
  name: string;
}

interface ApiConversationSummary {
  id: number;
  last_message: string | null;
  updated_at: string;
  unread_count: number;
}

interface ApiMatch {
  id: number;
  other_user: ApiProfile;
  conversation_id: number | null;
  created_at: string;
}

interface ApiMessage {
  id: number;
  sender: UserSummary;
  content: string;
  message_type: "text" | "image" | "video" | "story_reply" | "date_suggestion";
  provider_payload?: Record<string, unknown> | null;
  media_url?: string | null;
  client_request_id?: string | null;
  story?: number | null;
  story_context?: {
    id: number;
    author: UserSummary;
    author_display_name?: string | null;
    media_type: "image" | "video";
    media_url?: string | null;
    caption: string;
  } | null;
  reply_to_message?: number | null;
  is_view_once?: boolean;
  consumed_at?: string | null;
  reactions?: ApiMessageReaction[];
  created_at: string;
  read: boolean;
}

interface ApiMessageReaction {
  id: number;
  emoji: string;
  user: UserSummary;
}

interface ApiReport {
  id: number;
  reported_user: number;
  reason: ReportReason;
  details: string;
  status: string;
  created_at: string;
}

interface ApiWalletEntry {
  id: number;
  entry_type: string;
  ribbons_delta: number;
  hearts_delta: number;
  rewinds_delta: number;
  description: string;
  created_at: string;
}

interface ApiWallet {
  ribbons_balance: number;
  hearts_balance: number;
  rewinds_balance: number;
  entries: ApiWalletEntry[];
}

interface ApiLikeReceived {
  connection_id: number;
  status: string;
  visible: boolean;
  profile: ApiProfile | null;
}

interface ApiPremiumPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  price_monthly: string;
  likes_per_day: number;
  can_see_who_liked: boolean;
  has_unlimited_swipes: boolean;
  has_priority_boost: boolean;
  has_video_calls: boolean;
  is_active: boolean;
}

interface ApiSubscription {
  id: number;
  status: string;
  started_at: string;
  expires_at: string | null;
  plan: ApiPremiumPlan;
}

interface ApiVerificationAttempt {
  id: number;
  status: string;
  score: number | null;
  rejection_reason: string;
  provider: string;
  provider_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  selfie_url: string | null;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

let accessToken: string | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getStoredAccessToken() {
  return accessToken;
}

export function storeAccessToken(token: string | null) {
  accessToken = token;
}

export async function clearStoredTokens() {
  accessToken = null;
  await fetch(`${API_BASE_URL}/api/token/logout/`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  }).catch(() => null);
}

function buildHeaders(body?: RequestOptions["body"], headers?: Record<string, string>) {
  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...headers,
  };

  if (body && !(body instanceof FormData)) {
    baseHeaders["Content-Type"] = "application/json";
  }

  return baseHeaders;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }

  const entries = Object.entries(payload as Record<string, unknown>);
  if (entries.length === 0) {
    return fallback;
  }

  const messages = entries.flatMap(([field, value]) => {
    if (Array.isArray(value)) {
      return value.map((item) => `${field}: ${String(item)}`);
    }

    if (typeof value === "string") {
      return `${field}: ${value}`;
    }

    return [];
  });

  return messages[0] ?? fallback;
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({}),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access) {
    await clearStoredTokens();
    throw new ApiError("Sua sessão expirou. Faça login novamente.", response.status);
  }

  storeAccessToken(payload.access as string);
  return payload.access as string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = false,
    headers,
    retryOnAuthError = true,
  } = options;

  const finalHeaders = buildHeaders(body, headers);
  if (auth) {
    if (!accessToken) {
      try {
        accessToken = await refreshAccessToken();
      } catch (error) {
        throw error instanceof ApiError
          ? error
          : new ApiError("Faça login para continuar.", 401);
      }
    }
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: finalHeaders,
    body:
      body && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
  });

  if (response.status === 401 && auth && retryOnAuthError) {
    const nextAccessToken = await refreshAccessToken();
    return request<T>(path, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${nextAccessToken}`,
      },
      retryOnAuthError: false,
    });
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, "Não foi possível concluir a operação."),
      response.status,
    );
  }

  return payload as T;
}

function formatLocation(location: ApiLocation | null) {
  if (!location) {
    return "Localização não informada";
  }

  const parts = [location.city, location.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Localização não informada";
}

function resolveMediaUrl(url: string) {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

function formatDistance(distanceKm?: number | null) {
  if (distanceKm === null || distanceKm === undefined) {
    return "Distância indisponível";
  }
  return `${distanceKm} km`;
}

function formatTimestamp(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "agora";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return date.toLocaleDateString("pt-BR");
}

function mapProfileToCard(profile: ApiProfile): AppUserProfile {
  const photoItems = profile.photos
    .map((photo) => mapApiPhoto(photo))
    .filter((photo): photo is AppPhoto => Boolean(photo));

  return {
    id: profile.uuid,
    userId: profile.user.id,
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    location: formatLocation(profile.location),
    distance: formatDistance(profile.distance_km),
    bio: profile.bio || "Ainda sem bio.",
    occupation: profile.occupation || "Profissão não informada",
    education: profile.education || "Formação não informada",
    interests: profile.interests.map((interest) => interest.name),
    photos: photoItems.length > 0 ? photoItems.map((photo) => photo.url) : ["/placeholder.svg"],
    online: profile.is_online,
    accentColor: normalizeAccentColor(profile.accent_color ?? DEFAULT_ACCENT_COLOR),
    verified: profile.is_verified,
    relationshipIntent: profile.relationship_intent,
    spotifyTrack: profile.spotify_track ? {
      id: profile.spotify_track.id,
      name: profile.spotify_track.name,
      artist: profile.spotify_track.artist,
      url: profile.spotify_track.url,
      imageUrl: profile.spotify_track.image_url,
      previewUrl: profile.spotify_track.preview_url ?? null,
    } : null,
  };
}

function mapApiPhoto(photo: ApiPhoto): AppPhoto | null {
  const url = photo.image_url || photo.image;
  if (!url) {
    return null;
  }

  return {
    id: photo.id,
    url: resolveMediaUrl(url),
    isPrimary: Boolean(photo.is_primary),
    order: photo.order ?? 0,
    clientRequestId: photo.client_request_id ?? null,
  };
}

function mapProfileToAppProfile(profile: ApiProfile): AppProfile {
  const photoItems = profile.photos
    .map((photo) => mapApiPhoto(photo))
    .filter((photo): photo is AppPhoto => Boolean(photo));
  const interestItems = profile.interests.map<AppInterest>((interest) => ({
    id: interest.id,
    name: interest.name,
  }));

  return {
    ...mapProfileToCard(profile),
    uuid: profile.uuid,
    premiumTier: profile.premium_tier ?? "free",
    course: profile.course || "",
    locationCity: profile.location?.city || "",
    locationState: profile.location?.state || "",
    gender: profile.gender,
    sexualOrientation: profile.sexual_orientation,
    showAge: profile.show_age,
    allowVideoCalls: profile.allow_video_calls,
    allowDateSuggestions: profile.allow_date_suggestions,
    invisibleMode: profile.is_invisible_mode,
    relationshipIntent: profile.relationship_intent,
    spotifyTrack: profile.spotify_track ? {
      id: profile.spotify_track.id,
      name: profile.spotify_track.name,
      artist: profile.spotify_track.artist,
      url: profile.spotify_track.url,
      imageUrl: profile.spotify_track.image_url,
      previewUrl: profile.spotify_track.preview_url ?? null,
    } : null,
    interestItems,
    photoItems: photoItems,
    stats: profile.stats ?? {
      likes_sent: 0,
      matches: 0,
      conversations: 0,
    },
  };
}

export function mapApiStory(story: ApiStory): AppStory {
  const authorLabel = (story.author_display_name ?? "").trim() || story.author.email;
  return {
    id: story.id,
    clientRequestId: story.client_request_id ?? null,
    authorId: story.author.id,
    authorName: authorLabel,
    mediaType: story.media_type,
    mediaUrl: resolveMediaUrl(story.media_url || story.media || ""),
    caption: story.caption,
    createdAt: story.created_at,
    expiresAt: story.expires_at,
    viewersCount: story.viewers_count,
    reactions: story.reactions.map((reaction) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userName: (reaction.user_display_name ?? "").trim() || reaction.user.email,
    })),
  };
}

export function mapApiMessageToAppMessage(message: ApiMessage, currentUserId: number): AppMessage {
  return {
    id: String(message.id),
    clientRequestId: message.client_request_id ?? null,
    senderId: String(message.sender.id),
    text: message.content,
    type: message.message_type,
    mediaUrl: message.media_url ? resolveMediaUrl(message.media_url) : null,
    isViewOnce: Boolean(message.is_view_once),
    consumedAt: message.consumed_at || null,
    storyId: message.story ?? null,
    storyContext: message.story_context ? {
      id: message.story_context.id,
      authorId: message.story_context.author.id,
      authorName: (message.story_context.author_display_name ?? "").trim() || message.story_context.author.email,
      mediaType: message.story_context.media_type,
      mediaUrl: message.story_context.media_url ? resolveMediaUrl(message.story_context.media_url) : null,
      caption: message.story_context.caption,
    } : null,
    replyToMessageId: message.reply_to_message ? String(message.reply_to_message) : null,
    providerPayload: message.provider_payload ?? null,
    reactions: (message.reactions || []).map((reaction) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userName: reaction.user.email,
    })),
    timestamp: new Date(message.created_at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: message.read,
    isMine: message.sender.id === currentUserId,
  };
}

function mapApiWallet(wallet: ApiWallet): AppWallet {
  return {
    ribbons: wallet.ribbons_balance,
    hearts: wallet.hearts_balance,
    rewinds: wallet.rewinds_balance,
    entries: wallet.entries.map<AppWalletEntry>((entry) => ({
      id: entry.id,
      entryType: entry.entry_type,
      ribbonsDelta: entry.ribbons_delta,
      heartsDelta: entry.hearts_delta,
      rewindsDelta: entry.rewinds_delta,
      description: entry.description,
      createdAt: entry.created_at,
    })),
  };
}

function mapApiPremiumPlan(plan: ApiPremiumPlan): AppPremiumPlan {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    priceMonthly: Number(plan.price_monthly),
    likesPerDay: plan.likes_per_day,
    canSeeWhoLiked: plan.can_see_who_liked,
    hasUnlimitedSwipes: plan.has_unlimited_swipes,
    hasPriorityBoost: plan.has_priority_boost,
    hasVideoCalls: plan.has_video_calls,
  };
}

function mapApiSubscription(subscription: ApiSubscription): AppSubscription {
  return {
    id: subscription.id,
    status: subscription.status,
    startedAt: subscription.started_at,
    expiresAt: subscription.expires_at,
    plan: mapApiPremiumPlan(subscription.plan),
  };
}

function mapApiVerificationAttempt(attempt: ApiVerificationAttempt): AppVerificationAttempt {
  return {
    id: attempt.id,
    status: attempt.status,
    score: attempt.score,
    rejectionReason: attempt.rejection_reason,
    provider: attempt.provider,
    providerPayload: attempt.provider_payload,
    createdAt: attempt.created_at,
    updatedAt: attempt.updated_at,
    selfieUrl: attempt.selfie_url ? resolveMediaUrl(attempt.selfie_url) : null,
  };
}

function mapApiReport(report: ApiReport): AppReport {
  return {
    id: report.id,
    reportedUserId: report.reported_user,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.created_at,
  };
}

function buildProfilePayload(values: ProfileFormValues): ApiProfileWritePayload {
  const payload: ApiProfileWritePayload = {
    name: values.name.trim(),
    age: values.age,
    bio: values.bio.trim(),
    occupation: values.occupation.trim(),
    education: values.education.trim(),
    gender: values.gender,
    sexual_orientation: values.sexualOrientation,
    relationship_intent: values.relationshipIntent,
    show_age: values.showAge,
    allow_video_calls: values.allowVideoCalls,
    allow_date_suggestions: values.allowDateSuggestions,
    is_invisible_mode: values.invisibleMode,
    interest_ids: values.interestIds,
  };

  if (values.course.trim()) {
    payload.course = values.course.trim();
  }

  return payload;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function login(payload: LoginPayload) {
  const response = await request<TokenResponse>("/api/token/", {
    method: "POST",
    body: payload,
  });
  storeAccessToken(response.access);
  return response.user;
}

export async function register(payload: SignUpPayload) {
  return request<UserSummary>("/auth/register/", {
    method: "POST",
    body: payload,
  });
}

function mapApiLegalDocumentToApp(document: ApiLegalDocument): AppLegalDocument {
  return {
    id: document.id,
    documentType: document.document_type,
    versionLabel: document.version_label,
    content: document.content,
    contentHash: document.content_hash,
    effectiveDate: document.effective_date,
    publishedAt: document.published_at,
  };
}

export async function fetchCurrentLegalDocuments() {
  const documents = await request<ApiLegalDocument[]>("/legal/documents/current/");
  return documents.map(mapApiLegalDocumentToApp);
}

export async function submitConsent(params: {
  consentType: ConsentType;
  documentVersionId?: number;
  metadata?: Record<string, unknown>;
}) {
  return request<{ id: number }>("/consent/", {
    method: "POST",
    auth: true,
    body: {
      consent_type: params.consentType,
      document_version_id: params.documentVersionId,
      metadata: params.metadata ?? {},
    },
  });
}

export async function fetchMyConsents() {
  const records = await request<ApiConsentStatus[]>("/consent/me/", { auth: true });
  return records.map<AppConsentStatus>((record) => ({
    consentType: record.consent_type,
    action: record.action,
    grantedAt: record.granted_at,
    isUpToDate: record.is_up_to_date,
  }));
}

export async function deactivateAccount(password: string) {
  await request<void>("/account/deactivate/", {
    method: "POST",
    auth: true,
    body: { password },
  });
}

export async function deleteAccount(password: string) {
  await request<void>("/account/delete/", {
    method: "POST",
    auth: true,
    body: { password },
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ detail: string }>("/auth/forgot-password/", {
    method: "POST",
    body: { email },
  });
}

export async function confirmPasswordReset(payload: {
  userId: string;
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return request<{ detail: string }>(`/auth/reset-password/${payload.userId}/${payload.token}/`, {
    method: "POST",
    body: {
      password: payload.password,
      confirm_password: payload.confirmPassword,
    },
  });
}

export async function fetchCurrentUser() {
  return request<UserSummary>("/auth/me/", { auth: true });
}

export async function sendPresenceHeartbeat(active = true) {
  return request<{ active: boolean; is_online: boolean; last_seen: string | null }>("/presence/heartbeat/", {
    method: "POST",
    body: { active },
    auth: true,
  });
}

export async function fetchMyProfile() {
  const profile = await request<ApiProfile>("/profiles/me/", { auth: true });
  return mapProfileToAppProfile(profile);
}

export async function fetchMyProfileOptional() {
  try {
    return await fetchMyProfile();
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchInterestOptions() {
  return request<ApiOptionItem[]>("/interests/", { auth: true });
}

export async function createReport(payload: {
  reportedUserId: number;
  reason: ReportReason;
  details?: string;
}) {
  const response = await request<ApiReport>("/reports/", {
    method: "POST",
    auth: true,
    body: {
      reported_user: payload.reportedUserId,
      reason: payload.reason,
      details: payload.details?.trim() || "",
    },
  });

  return mapApiReport(response);
}

export async function fetchMyReports() {
  const response = await request<ApiReport[]>("/reports/", { auth: true });
  return response.map(mapApiReport);
}

export async function ensureLocation(payload: {
  city: string;
  state: string;
  country?: string;
  neighborhood?: string;
}) {
  return request<ApiLocationResponse>("/locations/", {
    method: "POST",
    body: {
      city: payload.city,
      state: payload.state,
      country: payload.country || "Brasil",
      neighborhood: payload.neighborhood || "",
    },
    auth: true,
  });
}

export async function saveMyProfile(values: ProfileFormValues) {
  const existingProfile = await fetchMyProfileOptional();
  const location = await ensureLocation({
    city: values.city.trim(),
    state: values.state.trim(),
  });

  const payload = {
    ...buildProfilePayload(values),
    location_id: location.id,
  };

  if (existingProfile) {
    const profile = await request<ApiProfile>(`/profiles/${existingProfile.uuid}/`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
    return mapProfileToAppProfile(profile);
  }

  const profile = await request<ApiProfile>("/profiles/", {
    method: "POST",
    body: payload,
    auth: true,
  });
  return mapProfileToAppProfile(profile);
}

export async function updateMyProfileSettings(payload: {
  allowDateSuggestions?: boolean;
  spotifyTrack?: AppSpotifyTrack | null;
  accentColor?: string;
}) {
  const existingProfile = await fetchMyProfile();
  const profile = await request<ApiProfile>(`/profiles/${existingProfile.uuid}/`, {
    method: "PATCH",
    body: {
      ...(payload.allowDateSuggestions !== undefined
        ? { allow_date_suggestions: payload.allowDateSuggestions }
        : {}),
      ...(payload.spotifyTrack === undefined
        ? {}
        : payload.spotifyTrack
          ? {
              spotify_track_id: payload.spotifyTrack.id,
              spotify_track_name: payload.spotifyTrack.name,
              spotify_artist_name: payload.spotifyTrack.artist,
              spotify_track_url: payload.spotifyTrack.url,
              spotify_album_image_url: payload.spotifyTrack.imageUrl,
              spotify_preview_url: payload.spotifyTrack.previewUrl || "",
            }
          : {
              spotify_track_id: "",
              spotify_track_name: "",
              spotify_artist_name: "",
              spotify_track_url: "",
              spotify_album_image_url: "",
              spotify_preview_url: "",
            }),
      ...(payload.accentColor !== undefined
        ? { accent_color: normalizeAccentColor(payload.accentColor) }
        : {}),
    },
    auth: true,
  });
  return mapProfileToAppProfile(profile);
}

export async function uploadProfilePhoto(payload: {
  file: File;
  order: number;
  isPrimary?: boolean;
  photoId?: number;
  clientRequestId?: string;
}) {
  const formData = new FormData();
  formData.append("image", payload.file);
  formData.append("order", String(payload.order));
  formData.append("is_primary", String(Boolean(payload.isPrimary)));
  if (payload.clientRequestId) {
    formData.append("client_request_id", payload.clientRequestId);
  }

  const path = payload.photoId ? `/photos/${payload.photoId}/` : "/photos/";
  const method: HttpMethod = payload.photoId ? "PATCH" : "POST";

  return request<ApiPhoto>(path, {
    method,
    body: formData,
    auth: true,
  });
}

export async function deleteProfilePhoto(photoId: number) {
  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  const response = await fetch(`${API_BASE_URL}/photos/${photoId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (response.status === 401) {
    const nextAccessToken = await refreshAccessToken();
    await fetch(`${API_BASE_URL}/photos/${photoId}/`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${nextAccessToken}`,
        "ngrok-skip-browser-warning": "true",
      },
    });
    return;
  }

  if (!response.ok && response.status !== 204) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      getErrorMessage(payload, "Não foi possível remover a foto."),
      response.status,
    );
  }
}

export async function fetchDiscoverProfiles() {
  const profiles = await request<ApiProfile[]>("/profiles/discover/", { auth: true });
  return profiles.map(mapProfileToCard);
}

export async function createConnection(payload: {
  to_user: number;
  status: "like" | "pass" | "superlike";
}) {
  const response = await request<{
    match: ApiMatch | null;
  }>("/connections/", {
    method: "POST",
    body: payload,
    auth: true,
  });

  return response.match
    ? {
        id: String(response.match.id),
        conversationId: response.match.conversation_id,
        user: mapProfileToCard(response.match.other_user),
      }
    : null;
}

export async function fetchMatches() {
  const [matches, conversations] = await Promise.all([
    request<ApiMatch[]>("/connections/matches/", { auth: true }),
    request<ApiConversationSummary[]>("/conversations/", { auth: true }),
  ]);

  const conversationById = new Map(conversations.map((conversation) => [conversation.id, conversation]));

  return matches.map<AppMatch>((match) => {
    const conversation = match.conversation_id
      ? conversationById.get(match.conversation_id)
      : undefined;

    return {
      id: String(match.id),
      conversationId: match.conversation_id,
      user: mapProfileToCard(match.other_user),
      lastMessage: conversation?.last_message || "Nova conexão!",
      timestamp: formatTimestamp(conversation?.updated_at || match.created_at),
      unread: (conversation?.unread_count || 0) > 0,
    };
  });
}

export async function fetchMessages(conversationId: number, currentUserId?: number) {
  const messages = await request<ApiMessage[]>(`/messages/?conversation=${conversationId}`, {
    auth: true,
  });
  const resolvedCurrentUserId = currentUserId ?? (await fetchCurrentUser()).id;

  return messages.map((message) => mapApiMessageToAppMessage(message, resolvedCurrentUserId));
}

export async function sendMessage(payload: {
  conversationId: number;
  content?: string;
  file?: File | null;
  type?: "text" | "image" | "video" | "story_reply" | "date_suggestion";
  isViewOnce?: boolean;
  storyId?: number | null;
  replyToMessageId?: string | null;
  currentUserId?: number;
  clientRequestId?: string;
  providerPayload?: Record<string, unknown> | null;
}) {
  const body = new FormData();
  body.append("conversation", String(payload.conversationId));
  body.append("content", payload.content || "");
  body.append("message_type", payload.type || "text");
  body.append("is_view_once", String(Boolean(payload.isViewOnce)));
  if (payload.clientRequestId) {
    body.append("client_request_id", payload.clientRequestId);
  }
  if (payload.file) {
    body.append("media", payload.file);
  }
  if (payload.storyId) {
    body.append("story", String(payload.storyId));
  }
  if (payload.replyToMessageId) {
    body.append("reply_to_message", payload.replyToMessageId);
  }
  if (payload.providerPayload) {
    body.append("provider_payload", JSON.stringify(payload.providerPayload));
  }
  const message = await request<ApiMessage>("/messages/", {
    method: "POST",
    body,
    auth: true,
  });
  const resolvedCurrentUserId = payload.currentUserId ?? (await fetchCurrentUser()).id;

  return mapApiMessageToAppMessage(message, resolvedCurrentUserId);
}

export async function markConversationAsRead(conversationId: number) {
  return request<{ updated: number }>("/messages/mark-read/", {
    method: "POST",
    body: {
      conversation_id: conversationId,
    },
    auth: true,
  });
}

export async function reactToMessage(messageId: string, emoji: string) {
  const reaction = await request<ApiMessageReaction>(`/messages/${messageId}/reactions/`, {
    method: "POST",
    body: { emoji },
    auth: true,
  });
  return {
    id: reaction.id,
    emoji: reaction.emoji,
    userName: reaction.user.email,
  };
}

export async function consumeViewOnceMessage(messageId: string) {
  return request(`/messages/${messageId}/consume-view-once/`, {
    method: "POST",
    auth: true,
  });
}

export async function fetchStoriesFeed() {
  const stories = await request<ApiStory[]>("/stories/feed/", { auth: true });
  return stories.map(mapApiStory);
}

export async function fetchMyStories() {
  const stories = await request<ApiStory[]>("/stories/", { auth: true });
  return stories.map(mapApiStory);
}

export async function createStory(payload: {
  file: File;
  mediaType: "image" | "video";
  caption?: string;
  clientRequestId?: string;
}) {
  const normalizedCaption = payload.caption?.trim() ?? "";
  const body = new FormData();
  body.append("media", payload.file);
  body.append("media_type", payload.mediaType);
  body.append("caption", normalizedCaption);
  if (payload.clientRequestId) {
    body.append("client_request_id", payload.clientRequestId);
  }
  const story = await request<ApiStory>("/stories/", {
    method: "POST",
    body,
    auth: true,
  });
  return mapApiStory(story);
}

export async function registerStoryView(storyId: number) {
  return request(`/stories/${storyId}/views/`, {
    method: "POST",
    auth: true,
  });
}

export async function reactToStory(storyId: number, emoji: string) {
  const reaction = await request<ApiStoryReaction>(`/stories/${storyId}/reactions/`, {
    method: "POST",
    body: { emoji },
    auth: true,
  });
  return {
    id: reaction.id,
    emoji: reaction.emoji,
    userName: (reaction.user_display_name ?? "").trim() || reaction.user.email,
  };
}

export async function replyToStory(storyId: number, content: string, currentUserId?: number) {
  const message = await request<ApiMessage>(`/stories/${storyId}/reply/`, {
    method: "POST",
    body: { content },
    auth: true,
  });
  const resolvedCurrentUserId = currentUserId ?? (await fetchCurrentUser()).id;

  return mapApiMessageToAppMessage(message, resolvedCurrentUserId);
}

export async function createBlock(blockedUserId: number, reason?: string) {
  return request("/blocks/", {
    method: "POST",
    body: {
      blocked_user: blockedUserId,
      reason: reason || "",
    },
    auth: true,
  });
}

export async function fetchLikesReceived(offset = 0, limit = 10) {
  const response = await request<{
    visible: boolean;
    count: number;
    next_offset: number | null;
    results: ApiLikeReceived[];
  }>(`/connections/likes-received/?offset=${offset}&limit=${limit}`, {
    auth: true,
  });
  return {
    items: response.results.map<AppLikeReceived>((item) => ({
      connectionId: item.connection_id,
      status: item.status,
      visible: item.visible,
      profile: item.profile ? mapProfileToCard(item.profile) : null,
    })),
    nextOffset: response.next_offset,
    count: response.count,
  };
}

export async function unlockLikesReceived() {
  return request<{ detail: string; unlocked_until: string }>("/connections/likes-received/unlock/", {
    method: "POST",
    auth: true,
  });
}

export async function fetchWallet() {
  const [wallet, ledger] = await Promise.all([
    request<ApiWallet>("/wallet/", { auth: true }),
    request<ApiWalletEntry[]>("/wallet/ledger/", { auth: true }),
  ]);
  return mapApiWallet({ ...wallet, entries: ledger });
}

export async function rewardVideoWatch() {
  return request<{ success: boolean; detail: string }>("/wallet/reward-video/", {
    method: "POST",
    auth: true,
  });
}

interface ApiAbacatePayBillingResult {
  checkout_url?: string;
  demo?: boolean;
  detail?: string;
}

interface ApiAbacatePayPixResult {
  pix_code?: string;
  qr_code_image?: string;
  demo?: boolean;
  detail?: string;
}

export async function createAbacatePayBilling(planId: number, cpf = "") {
  return request<ApiAbacatePayBillingResult>("/payments/intents/", {
    method: "POST",
    body: { plan_id: planId, method: "card", cpf },
    auth: true,
  });
}

export async function createAbacatePayPix(planId: number, cpf: string) {
  return request<ApiAbacatePayPixResult>("/payments/intents/", {
    method: "POST",
    body: { plan_id: planId, method: "pix", cpf },
    auth: true,
  });
}

export async function undoLastConnection(): Promise<{
  undone_connection_id: number;
  affected_match_id: number | null;
  profile: AppUserProfile;
}> {
  const data = await request<{
    undone_connection_id: number;
    affected_match_id: number | null;
    profile: ApiProfile;
  }>("/connections/undo/", { method: "POST", auth: true });
  return {
    ...data,
    profile: mapProfileToCard(data.profile),
  };
}

export async function fetchPremiumPlans() {
  const plans = await request<ApiPremiumPlan[]>("/premium/plans/", { auth: true });
  return plans.map(mapApiPremiumPlan);
}

export async function fetchMySubscriptions() {
  const subscriptions = await request<ApiSubscription[]>("/premium/subscriptions/", { auth: true });
  return subscriptions.map(mapApiSubscription);
}

export async function createVerificationAttempt(file: File) {
  const body = new FormData();
  body.append("image", file);
  return request("/verification/attempts/", {
    method: "POST",
    body,
    auth: true,
  });
}

export async function fetchVerificationAttempts() {
  const attempts = await request<ApiVerificationAttempt[]>("/verification/attempts/", { auth: true });
  return attempts.map(mapApiVerificationAttempt);
}

export async function sendLocationPing(payload: {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}) {
  return request("/locations/ping/", {
    method: "POST",
    body: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy_meters: payload.accuracyMeters,
    },
    auth: true,
  });
}

export async function fetchDateReadiness(conversationId: string) {
  const data = await request<{
    ready: boolean;
    message_count: number;
    detected_interests: string[];
    suggested_categories: string[];
    category_labels: string[];
  }>(`/conversations/${conversationId}/date-readiness/`, { auth: true });
  return {
    ready: data.ready,
    messageCount: data.message_count,
    detectedInterests: data.detected_interests,
    suggestedCategories: data.suggested_categories,
    categoryLabels: data.category_labels,
  };
}

export async function fetchDateSuggestions(matchId: string, radiusKm = 5, categories?: string[], query?: string) {
  let url = `/matches/${matchId}/date-suggestions/?radius=${radiusKm}`;
  if (categories && categories.length > 0) {
    url += `&categories=${categories.join(",")}`;
  }
  if (query && query.trim()) {
    url += `&query=${encodeURIComponent(query.trim())}`;
  }
  const suggestions = await request<Array<{
    name: string;
    rating?: number;
    vicinity?: string;
    distance_km: number;
    maps_url: string;
    latitude: number;
    longitude: number;
  }>>(url, { auth: true });
  return suggestions.map<DateSuggestion>((item) => ({
    name: item.name,
    rating: item.rating,
    vicinity: item.vicinity,
    distanceKm: item.distance_km,
    mapsUrl: item.maps_url,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

export async function fetchCupidoRecommendations() {
  return request("/cupido/recommendations/", { auth: true });
}

export async function searchSpotifyTracks(query: string) {
  if (!query.trim()) {
    return [];
  }
  return request<Array<{
    id: string;
    name: string;
    artist: string;
    url: string;
    image_url: string;
    preview_url?: string | null;
  }>>(`/integrations/spotify/search/?q=${encodeURIComponent(query.trim())}`, { auth: true })
    .then((results) => results.map<AppSpotifyTrack>((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artist,
      url: track.url,
      imageUrl: track.image_url,
      previewUrl: track.preview_url ?? null,
    })));
}
