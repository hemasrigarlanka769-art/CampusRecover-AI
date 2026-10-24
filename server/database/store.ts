import crypto from 'crypto';
import {
  User,
  LostItem,
  FoundItem,
  AIMatch,
  Claim,
  Conversation,
  Message,
  Notification,
  AuditLog,
  AIWeightsConfig,
  CampusBuilding,
} from '../../src/types/index.js';

// Password hashing using Node.js crypto PBKDF2
export function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// In-Memory Database Store with initial seed data
class DatabaseStore {
  users: Map<string, User & { passwordHash: string }> = new Map();
  lostItems: Map<string, LostItem> = new Map();
  foundItems: Map<string, FoundItem> = new Map();
  matches: Map<string, AIMatch> = new Map();
  claims: Map<string, Claim> = new Map();
  conversations: Map<string, Conversation> = new Map();
  messages: Map<string, Message[]> = new Map();
  notifications: Map<string, Notification[]> = new Map();
  auditLogs: AuditLog[] = [];
  aiWeights: AIWeightsConfig = {
    textWeight: 0.35,
    imageWeight: 0.35,
    metadataWeight: 0.20,
    locationWeight: 0.05,
    timeWeight: 0.05,
    minThreshold: 60,
  };

  campusBuildings: CampusBuilding[] = [
    { id: 'b_de', name: 'DE Block', code: 'DE', zone: 'Academic Wing', lat: 18.0647, lng: 83.4052, lostCount: 0, foundCount: 0 },
    { id: 'b_cse', name: 'CSE Block', code: 'CSE', zone: 'Academic Wing', lat: 18.0652, lng: 83.4060, lostCount: 0, foundCount: 0 },
    { id: 'b_it', name: 'IT Block', code: 'IT', zone: 'Academic Wing', lat: 18.0656, lng: 83.4062, lostCount: 0, foundCount: 0 },
    { id: 'b_civil', name: 'Civil Block', code: 'CIVIL', zone: 'Academic Wing', lat: 18.0642, lng: 83.4057, lostCount: 0, foundCount: 0 },
    { id: 'b_canteen', name: 'Canteen', code: 'CANTEEN', zone: 'Food & Dining', lat: 18.0650, lng: 83.4075, lostCount: 0, foundCount: 0 },
    { id: 'b_freshchill', name: 'Fresh Chill', code: 'FRESH_CHILL', zone: 'Food & Dining', lat: 18.0654, lng: 83.4076, lostCount: 0, foundCount: 0 },
    { id: 'b_bakers', name: 'Bakers Corner', code: 'BAKERS_CORNER', zone: 'Food & Dining', lat: 18.0657, lng: 83.4077, lostCount: 0, foundCount: 0 },
    { id: 'b_centralpark', name: 'Central Park', code: 'CENTRAL_PARK', zone: 'Central Campus', lat: 18.0650, lng: 83.4065, lostCount: 0, foundCount: 0 },
    { id: 'b_admin', name: 'Admin Block', code: 'ADMIN', zone: 'Administration', lat: 18.0649, lng: 83.4068, lostCount: 0, foundCount: 0 },
    { id: 'b_bank', name: 'Bank', code: 'BANK', zone: 'Campus Services', lat: 18.0646, lng: 83.4070, lostCount: 0, foundCount: 0 },
    { id: 'b_stationary', name: 'Stationary', code: 'STATIONARY', zone: 'Campus Services', lat: 18.0647, lng: 83.4071, lostCount: 0, foundCount: 0 },
    { id: 'b_gate', name: 'Main Gate & Security Post', code: 'GATE', zone: 'East Entrance', lat: 18.0645, lng: 83.4072, lostCount: 0, foundCount: 0 },
  ];

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // Fresh launch: Neutral, anonymous initial system accounts
    const initialUsers: Array<User & { passwordHash: string }> = [
      {
        id: 'usr_admin',
        name: 'MVGR Campus Safety Administrator',
        email: 'admin@mvgrce.edu.in',
        studentId: 'MVGR-ADM-01',
        role: 'ADMIN',
        department: 'Campus Security & Administration',
        campus: 'MVGR College of Engineering',
        isVerified: true,
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword('Admin123!'),
      },
      {
        id: 'usr_staff',
        name: 'Main Gate Lost & Found Desk',
        email: 'security.gate@mvgrce.edu.in',
        studentId: 'MVGR-SEC-01',
        role: 'CAMPUS_STAFF',
        department: 'Central Security Post',
        campus: 'MVGR College of Engineering',
        isVerified: true,
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword('Staff123!'),
      },
      {
        id: 'usr_student_demo',
        name: 'Campus Student Member',
        email: 'student@mvgrce.edu.in',
        studentId: '21331A0401',
        role: 'STUDENT',
        department: 'ECE Department',
        campus: 'MVGR College of Engineering',
        isVerified: true,
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword('Student123!'),
      },
    ];

    for (const u of initialUsers) {
      this.users.set(u.id, u);
    }

    // Fresh system: No prior used items, claims, or personal names presented.
    // The database starts clean for new users to register and report items!
    this.auditLogs.unshift({
      id: `log_init_${Date.now()}`,
      actorId: 'usr_admin',
      actorName: 'System Setup',
      actorRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZED',
      targetType: 'System',
      targetId: 'mvgr_campus_recover',
      details: 'CampusRecover AI initialized for MVGR College of Engineering with zero prior usage history.',
      timestamp: new Date().toISOString(),
    });
  }
}

export const db = new DatabaseStore();
