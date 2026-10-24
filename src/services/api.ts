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
} from '../types/index.js';
import {
  createLostItemFirestore,
  createFoundItemFirestore,
  createMatchFirestore,
  createClaimFirestore,
  updateClaimFirestore,
  getLostItemsFirestore,
  getFoundItemsFirestore,
  getMatchesFirestore,
  getClaimsFirestore,
  sendMessageFirestore,
  getMessagesFirestore,
  getNotificationsFirestore,
} from './firebase.js';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('campusrecover_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Sync Firebase Auth with Backend
  async syncFirebaseUser(userData: {
    uid: string;
    email: string;
    name?: string;
    studentId?: string;
    role?: string;
    department?: string;
    campus?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/firebase-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sync Firebase session');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('campusrecover_token', data.token);
    }
    return data;
  },

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('campusrecover_token', data.token);
    }
    return data;
  },

  async register(data: {
    name: string;
    email: string;
    studentId: string;
    password: string;
    role: string;
    department: string;
    campus: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    const result = await res.json();
    if (result.token) {
      localStorage.setItem('campusrecover_token', result.token);
    }
    return result;
  },

  async googleLogin(payload?: { email?: string; name?: string; avatarUrl?: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to authenticate with Google');
    }
    const result = await res.json();
    if (result.token) {
      localStorage.setItem('campusrecover_token', result.token);
    }
    return result;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('campusrecover_token');
  },

  // Lost Items
  async getLostItems(params?: { search?: string; category?: string; status?: string; building?: string }): Promise<LostItem[]> {
    try {
      // First try Firestore
      const firestoreItems = await getLostItemsFirestore();
      if (firestoreItems && firestoreItems.length > 0) {
        let filtered = firestoreItems;
        if (params?.category && params.category !== 'ALL') {
          filtered = filtered.filter((i) => i.category === params.category);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (i) => i.itemName.toLowerCase().includes(s) || i.description.toLowerCase().includes(s)
          );
        }
        return filtered;
      }
    } catch (e) {
      console.warn('Firestore getLostItems fallback:', e);
    }

    const q = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/lost${q ? `?${q}` : ''}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load lost items');
    return res.json();
  },

  async getLostItem(id: string): Promise<LostItem> {
    const res = await fetch(`${API_BASE}/lost/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load lost report');
    return res.json();
  },

  async createLostItem(data: Partial<LostItem>): Promise<{ item: LostItem; matchCount: number; matches: AIMatch[] }> {
    const res = await fetch(`${API_BASE}/lost`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit lost report');
    }
    const result = await res.json();
    // Persist to Firestore
    try {
      if (result.item) {
        await createLostItemFirestore(result.item);
      }
      if (result.matches && Array.isArray(result.matches)) {
        for (const m of result.matches) {
          await createMatchFirestore(m);
        }
      }
    } catch (e) {
      console.warn('Error saving lost item to Firestore:', e);
    }
    return result;
  },

  // Found Items
  async getFoundItems(params?: { search?: string; category?: string; status?: string; building?: string }): Promise<FoundItem[]> {
    try {
      // First try Firestore
      const firestoreItems = await getFoundItemsFirestore();
      if (firestoreItems && firestoreItems.length > 0) {
        let filtered = firestoreItems;
        if (params?.category && params.category !== 'ALL') {
          filtered = filtered.filter((i) => i.category === params.category);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (i) => i.itemName.toLowerCase().includes(s) || i.description.toLowerCase().includes(s)
          );
        }
        return filtered;
      }
    } catch (e) {
      console.warn('Firestore getFoundItems fallback:', e);
    }

    const q = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/found${q ? `?${q}` : ''}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load found items');
    return res.json();
  },

  async getFoundItem(id: string): Promise<FoundItem> {
    const res = await fetch(`${API_BASE}/found/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load found report');
    return res.json();
  },

  async createFoundItem(data: Partial<FoundItem>): Promise<{ item: FoundItem; matchCount: number; matches: AIMatch[] }> {
    const res = await fetch(`${API_BASE}/found`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit found report');
    }
    const result = await res.json();
    // Persist to Firestore
    try {
      if (result.item) {
        await createFoundItemFirestore(result.item);
      }
      if (result.matches && Array.isArray(result.matches)) {
        for (const m of result.matches) {
          await createMatchFirestore(m);
        }
      }
    } catch (e) {
      console.warn('Error saving found item to Firestore:', e);
    }
    return result;
  },

  // Matches
  async getMatches(): Promise<AIMatch[]> {
    try {
      const fsMatches = await getMatchesFirestore();
      if (fsMatches && fsMatches.length > 0) {
        return fsMatches;
      }
    } catch (e) {
      console.warn('Firestore getMatches fallback:', e);
    }

    const res = await fetch(`${API_BASE}/matches`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load AI matches');
    return res.json();
  },

  async getMatch(id: string): Promise<AIMatch> {
    const res = await fetch(`${API_BASE}/matches/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load AI match');
    return res.json();
  },

  async runMatching(): Promise<{ count: number; total: number }> {
    const res = await fetch(`${API_BASE}/matches/run`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger AI matching');
    const result = await res.json();
    return result;
  },

  async reportIncorrectMatch(id: string): Promise<void> {
    await fetch(`${API_BASE}/matches/${id}/report`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  // Claims
  async getClaims(): Promise<Claim[]> {
    try {
      const fsClaims = await getClaimsFirestore();
      if (fsClaims && fsClaims.length > 0) {
        return fsClaims;
      }
    } catch (e) {
      console.warn('Firestore getClaims fallback:', e);
    }

    const res = await fetch(`${API_BASE}/claims`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load claims');
    return res.json();
  },

  async createClaim(data: {
    lostItemId: string;
    foundItemId: string;
    verificationAnswers: { question: string; answer: string }[];
    proofNotes?: string;
  }): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit ownership claim');
    }
    const claim = await res.json();
    try {
      await createClaimFirestore(claim);
    } catch (e) {
      console.warn('Firestore save claim warning:', e);
    }
    return claim;
  },

  async updateClaimStatus(id: string, update: { status: string; adminNotes?: string; meetingLocation?: string }): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update claim status');
    const updated = await res.json();
    try {
      await updateClaimFirestore(id, update as any);
    } catch (e) {
      console.warn('Firestore update claim warning:', e);
    }
    return updated;
  },

  async initiateClaimChat(claimId: string): Promise<{ success: boolean; conversationId: string; claim: Claim }> {
    const res = await fetch(`${API_BASE}/claims/${claimId}/chat-initiated`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to initiate claim chat');
    return res.json();
  },

  async confirmReturn(id: string): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims/${id}/confirm-return`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to confirm return');
    const claim = await res.json();
    try {
      await updateClaimFirestore(id, { status: 'RETURNED' });
    } catch (e) {
      console.warn('Firestore confirm return warning:', e);
    }
    return claim;
  },

  async verifyHandover(
    id: string,
    data: {
      code: string;
      location: string;
      witnessRole?: string;
      checklist?: { idVerified: boolean; itemVerified: boolean; conditionConfirmed: boolean };
    }
  ): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims/${id}/handover-verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Handover verification failed');
    }
    const claim = await res.json();
    try {
      await updateClaimFirestore(id, claim);
    } catch (e) {
      console.warn('Firestore confirm handover warning:', e);
    }
    return claim;
  },

  // Conversations & Messages
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async createConversation(data: { recipientId: string; recipientName?: string; itemTitle?: string; matchId?: string; claimId?: string }): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to start conversation');
    return res.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const fsMsgs = await getMessagesFirestore(conversationId);
      if (fsMsgs && fsMsgs.length > 0) {
        return fsMsgs;
      }
    } catch (e) {
      console.warn('Firestore getMessages fallback:', e);
    }

    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load messages');
    return res.json();
  },

  async sendMessage(conversationId: string, data: { content: string; attachmentUrl?: string; isE2EE?: boolean }): Promise<Message> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send message');
    const message = await res.json();
    try {
      await sendMessageFirestore(conversationId, message);
    } catch (e) {
      console.warn('Firestore sendMessage warning:', e);
    }
    return message;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  // Campus Buildings
  async getCampusBuildings(): Promise<CampusBuilding[]> {
    const res = await fetch(`${API_BASE}/campus/buildings`);
    if (!res.ok) throw new Error('Failed to load campus locations');
    return res.json();
  },

  // Admin & System
  async getAdminStats(): Promise<{
    usersCount: number;
    lostCount: number;
    foundCount: number;
    matchesCount: number;
    claimsCount: number;
    resolvedCount: number;
    categoryStats: { category: string; count: number }[];
    locationStats: { building: string; count: number }[];
    weights: AIWeightsConfig;
    auditLogs: AuditLog[];
  }> {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load admin stats');
    return res.json();
  },

  async updateAIWeights(weights: Partial<AIWeightsConfig>): Promise<AIWeightsConfig> {
    const res = await fetch(`${API_BASE}/admin/ai-weights`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(weights),
    });
    if (!res.ok) throw new Error('Failed to update weights');
    return res.json();
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  async updateUserRole(id: string, role: string): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update user role');
    return res.json();
  },

  async getAiConfig(): Promise<AIWeightsConfig> {
    const res = await fetch(`${API_BASE}/admin/ai-config`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load AI config');
    return res.json();
  },

  async updateAiConfig(config: Partial<AIWeightsConfig>): Promise<AIWeightsConfig> {
    const res = await fetch(`${API_BASE}/admin/ai-config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update AI config');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
};
