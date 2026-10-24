export type UserRole = 'STUDENT' | 'FACULTY' | 'CAMPUS_STAFF' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: UserRole;
  department: string;
  campus: string;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export type LostItemStatus =
  | 'ACTIVE'
  | 'POTENTIAL_MATCH'
  | 'MATCH_CONFIRMED'
  | 'FOUND'
  | 'RETURNED'
  | 'CLOSED';

export type FoundItemStatus =
  | 'ACTIVE'
  | 'POTENTIAL_OWNER'
  | 'OWNER_VERIFIED'
  | 'RETURNED'
  | 'DONATED_ARCHIVED'
  | 'CLOSED';

export interface LostItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  itemName: string;
  category: string;
  subcategory?: string;
  description: string;
  brand?: string;
  model?: string;
  color: string;
  size?: string;
  material?: string;
  identifyingMarks?: string;
  serialNumberPrivate?: string; // Kept private, not exposed in public lists
  approximateValue?: string;
  dateLost: string;
  timeLost?: string;
  location: string;
  building: string;
  room?: string;
  campusArea: string;
  images: string[];
  contactPreference?: string;
  status: LostItemStatus;
  createdAt: string;
}

export interface FoundItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  itemName: string;
  category: string;
  description: string;
  brand?: string;
  model?: string;
  color: string;
  size?: string;
  material?: string;
  identifyingFeatures?: string; // Redacted or private if sensitive
  sensitiveNotesPrivate?: string; // E.g. wallet ID card contents, serial numbers
  dateFound: string;
  timeFound?: string;
  locationFound: string;
  building: string;
  room?: string;
  campusArea: string;
  images: string[];
  internalOfficeStorage?: string; // E.g. "Security Desk Cabinet B4"
  status: FoundItemStatus;
  createdAt: string;
}

export type MatchClassification =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'POSSIBLE'
  | 'LOW';

export interface AIMatch {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostItem: LostItem;
  foundItem: FoundItem;
  overallScore: number; // 0 - 100
  textSimilarity: number;
  imageSimilarity: number;
  metadataSimilarity: number;
  locationSimilarity: number;
  timeSimilarity: number;
  classification: MatchClassification;
  reasons: string[];
  isReviewed: boolean;
  isFlaggedIncorrect: boolean;
  createdAt: string;
}

export type ClaimStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'HANDOVER_PENDING'
  | 'REJECTED'
  | 'RETURNED';

export interface VerificationQA {
  question: string;
  answer: string;
}

export interface HandoverChecklist {
  idVerified: boolean;
  itemVerified: boolean;
  conditionConfirmed: boolean;
}

export interface Claim {
  id: string;
  lostItemId: string;
  foundItemId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  finderId: string;
  finderName: string;
  finderEmail: string;
  lostItemTitle: string;
  foundItemTitle: string;
  status: ClaimStatus;
  verificationAnswers: VerificationQA[];
  proofNotes?: string;
  adminNotes?: string;
  meetingLocation?: string;
  meetingScheduledAt?: string;
  returnMethod?: string;
  returnConfirmedByClaimant: boolean;
  returnConfirmedByFinder: boolean;
  returnedAt?: string;
  handoverCode?: string;
  handoverLocation?: string;
  handoverWitness?: string;
  handoverChecklist?: HandoverChecklist;
  handoverReceiptId?: string;
  chattedWithClaimant?: boolean;
  conversationId?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  matchId?: string;
  claimId?: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  itemTitle: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  isE2EE?: boolean;
  readBy: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'MATCH_FOUND' | 'MESSAGE' | 'CLAIM_STATUS' | 'RETURN_CONFIRMED' | 'ADMIN_ALERT';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AIWeightsConfig {
  textWeight: number; // e.g. 0.35
  imageWeight: number; // e.g. 0.35
  metadataWeight: number; // e.g. 0.20
  locationWeight: number; // e.g. 0.05
  timeWeight: number; // e.g. 0.05
  minThreshold: number; // e.g. 60
}

export interface CampusBuilding {
  id: string;
  name: string;
  code: string;
  zone: string;
  lat: number;
  lng: number;
  lostCount: number;
  foundCount: number;
}
