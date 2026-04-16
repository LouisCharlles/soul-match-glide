export interface UserSummary {
  id: number;
  email: string;
  is_active: boolean;
  date_joined: string;
}

export interface AppInterest {
  id: number;
  name: string;
}

export interface AppSpotifyTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  imageUrl: string;
  previewUrl?: string | null;
}

export interface AppStoryReaction {
  id: number;
  emoji: string;
  userName: string;
}

export interface AppStory {
  id: number;
  authorId: number;
  authorName: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
  viewersCount: number;
  reactions: AppStoryReaction[];
}

export interface AppPhoto {
  id: number;
  url: string;
  isPrimary: boolean;
  order: number;
}

export type ReportReason = "spam" | "fake" | "abuse" | "inappropriate" | "other";

export interface AppReport {
  id: number;
  reportedUserId: number;
  reason: ReportReason;
  details: string;
  status: string;
  createdAt: string;
}

export interface AppUserProfile {
  id: string;
  userId: number;
  name: string;
  age: number;
  gender?: string;
  location: string;
  distance: string;
  bio: string;
  occupation: string;
  education: string;
  interests: string[];
  photos: string[];
  online: boolean;
  verified?: boolean;
  relationshipIntent?: string;
}

export interface ProfileStats {
  likes_sent: number;
  matches: number;
  conversations: number;
}

export interface AppProfile extends AppUserProfile {
  uuid: string;
  course: string;
  locationCity: string;
  locationState: string;
  gender: string;
  sexualOrientation: string;
  showAge: boolean;
  allowVideoCalls: boolean;
  allowDateSuggestions: boolean;
  allowStudyMatch: boolean;
  invisibleMode: boolean;
  relationshipIntent: string;
  spotifyTrack: AppSpotifyTrack | null;
  interestItems: AppInterest[];
  photoItems: AppPhoto[];
  stats: ProfileStats;
}

export interface ProfileFormValues {
  name: string;
  age: number;
  bio: string;
  occupation: string;
  education: string;
  course: string;
  city: string;
  state: string;
  gender: string;
  sexualOrientation: string;
  relationshipIntent: string;
  interestIds: number[];
  photos: string[];
  showAge: boolean;
  allowVideoCalls: boolean;
  allowDateSuggestions: boolean;
  allowStudyMatch: boolean;
  invisibleMode: boolean;
}

export interface AppMatch {
  id: string;
  conversationId: number | null;
  user: AppUserProfile;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export interface AppMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  isMine: boolean;
  type?: "text" | "image" | "video" | "story_reply";
  mediaUrl?: string | null;
  isViewOnce?: boolean;
  consumedAt?: string | null;
  storyId?: number | null;
  replyToMessageId?: string | null;
  reactions?: Array<{ id: number; emoji: string; userName: string }>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends LoginPayload {
  name: string;
  age: number;
  confirm_password: string;
}

export interface AppWalletEntry {
  id: number;
  entryType: string;
  ribbonsDelta: number;
  heartsDelta: number;
  rewindsDelta: number;
  description: string;
  createdAt: string;
}

export interface AppWallet {
  ribbons: number;
  hearts: number;
  rewinds: number;
  entries: AppWalletEntry[];
}

export interface AppPremiumPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  likesPerDay: number;
  canSeeWhoLiked: boolean;
  hasUnlimitedSwipes: boolean;
  hasPriorityBoost: boolean;
  hasVideoCalls: boolean;
}

export interface AppSubscription {
  id: number;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  plan: AppPremiumPlan;
}

export interface AppVerificationAttempt {
  id: number;
  status: string;
  score: number | null;
  rejectionReason: string;
  provider: string;
  providerPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  selfieUrl: string | null;
}

export interface AppLikeReceived {
  connectionId: number;
  status: string;
  visible: boolean;
  profile: AppUserProfile | null;
}

export interface DateSuggestion {
  name: string;
  rating?: number;
  vicinity?: string;
  distanceKm: number;
  mapsUrl: string;
  latitude: number;
  longitude: number;
}
