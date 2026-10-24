import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, hashPassword, verifyPassword } from './server/database/store.js';
import { calculateMatch, matchNewLostItem, matchNewFoundItem } from './server/ai/matchingEngine.js';
import { User, LostItem, FoundItem, Claim, Conversation, Message, Notification, AuditLog } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simulated session store in memory for token authentication
const sessions = new Map<string, string>(); // token -> userId

// Auth helper middleware
function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '');
  const userId = sessions.get(token);
  if (!userId) return null;
  const userRecord = db.users.get(userId);
  if (!userRecord) return null;
  const { passwordHash, ...user } = userRecord;
  return user;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to continue' });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, studentId, password, role, department, campus } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  // Email format check
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Password requirements: Min 6 chars
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters',
    });
  }

  // Check existing
  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this university email already exists' });
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newUser = {
    id: userId,
    name,
    email,
    studentId,
    role: role || 'STUDENT',
    department: department || 'General Studies',
    campus: campus || 'Main Quad Campus',
    isVerified: true, // Auto-verified for active demonstration
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  db.users.set(userId, newUser);

  // Audit log
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: userId,
    actorName: name,
    actorRole: newUser.role,
    action: 'USER_REGISTERED',
    targetType: 'User',
    targetId: userId,
    details: `User registered with role ${newUser.role} in department ${newUser.department}`,
    timestamp: new Date().toISOString(),
  });

  const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessions.set(token, userId);

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const userRecord = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!userRecord) {
    return res.status(404).json({ error: 'No account found with this email. Please click Register to create your account.' });
  }
  if (userRecord.passwordHash && !verifyPassword(password, userRecord.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }
  if (!userRecord.passwordHash && password) {
    userRecord.passwordHash = hashPassword(password);
  }

  const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessions.set(token, userRecord.id);

  // Audit log
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: userRecord.id,
    actorName: userRecord.name,
    actorRole: userRecord.role,
    action: 'USER_LOGIN',
    targetType: 'User',
    targetId: userRecord.id,
    details: 'User authenticated successfully',
    timestamp: new Date().toISOString(),
  });

  const { passwordHash, ...safeUser } = userRecord;
  res.json({ user: safeUser, token });
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, avatarUrl } = req.body;
  const userEmail = email || 'harikabalaga03@gmail.com';
  const userName = name || 'Harika Balaga';

  let userRecord = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
  if (!userRecord) {
    const userId = `usr_google_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    userRecord = {
      id: userId,
      name: userName,
      email: userEmail,
      studentId: '21331A0501',
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      campus: 'MVGR College of Engineering',
      isVerified: true,
      avatarUrl: avatarUrl || '',
      createdAt: new Date().toISOString(),
      passwordHash: '',
    };
    db.users.set(userId, userRecord);
  }

  const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessions.set(token, userRecord.id);

  const { passwordHash, ...safeUser } = userRecord;
  res.json({ user: safeUser, token });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/, '');
    sessions.delete(token);
  }
  res.json({ success: true });
});

app.post('/api/auth/firebase-sync', (req: Request, res: Response) => {
  const { uid, email, name, studentId, role, department, campus } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and email are required for sync' });
  }

  let existing = db.users.get(uid);
  if (!existing) {
    const newUser = {
      id: uid,
      name: name || email.split('@')[0],
      email: email,
      studentId: studentId || `MVGR-${uid.slice(0, 6).toUpperCase()}`,
      role: role || 'STUDENT',
      department: department || 'Engineering Department',
      campus: campus || 'MVGR College of Engineering',
      isVerified: true,
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(uid),
    };
    db.users.set(uid, newUser);
    existing = newUser;
  }

  const token = `token_fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessions.set(token, uid);

  const { passwordHash, ...safeUser } = existing;
  res.json({ user: safeUser, token });
});

// Demo switch user account helper for test reviewers
app.post('/api/auth/demo-switch', (req: Request, res: Response) => {
  const { role } = req.body;
  let targetUser = Array.from(db.users.values()).find((u) => u.role === role);
  if (!targetUser) {
    targetUser = Array.from(db.users.values())[0];
  }
  const token = `token_demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessions.set(token, targetUser.id);
  const { passwordHash, ...safeUser } = targetUser;
  res.json({ user: safeUser, token });
});

// ----------------------------------------------------
// LOST ITEMS ENDPOINTS
// ----------------------------------------------------

app.get('/api/lost', (req: Request, res: Response) => {
  const { search, category, status, building } = req.query;
  let items = Array.from(db.lostItems.values());

  if (category && category !== 'ALL') {
    items = items.filter((i) => i.category.toLowerCase() === String(category).toLowerCase());
  }
  if (status && status !== 'ALL') {
    items = items.filter((i) => i.status === status);
  }
  if (building && building !== 'ALL') {
    items = items.filter((i) => i.building.toLowerCase() === String(building).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (i) =>
        i.itemName.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.brand && i.brand.toLowerCase().includes(q)) ||
        i.color.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }

  // Never publicly expose serial number of lost items in general queries
  const safeItems = items.map((i) => {
    const { serialNumberPrivate, ...rest } = i;
    return rest;
  });

  res.json(safeItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.get('/api/lost/:id', (req: Request, res: Response) => {
  const item = db.lostItems.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Lost report not found' });
  }

  const currentUser = getAuthUser(req);
  const isOwnerOrAdmin = currentUser && (currentUser.id === item.userId || currentUser.role === 'ADMIN');

  if (!isOwnerOrAdmin) {
    const { serialNumberPrivate, ...safeItem } = item;
    return res.json(safeItem);
  }

  res.json(item);
});

app.post('/api/lost', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const {
    itemName,
    category,
    subcategory,
    description,
    brand,
    model,
    color,
    size,
    material,
    identifyingMarks,
    serialNumberPrivate,
    approximateValue,
    dateLost,
    timeLost,
    location,
    building,
    room,
    campusArea,
    images,
    contactPreference,
  } = req.body;

  if (!itemName || !category || !description || !color || !dateLost || !building) {
    return res.status(400).json({ error: 'Missing required report fields (name, category, description, color, date, building)' });
  }

  const newLostId = `lost_${Date.now()}`;
  const publicReporterName =
    user.role === 'CAMPUS_STAFF'
      ? 'Main Gate Security Officer'
      : user.role === 'ADMIN'
      ? 'Campus Safety Admin'
      : `Student (${user.department || 'MVGR'})`;

  const newLostItem: LostItem = {
    id: newLostId,
    userId: user.id,
    userName: publicReporterName,
    userEmail: user.email,
    itemName,
    category,
    subcategory,
    description,
    brand,
    model,
    color,
    size,
    material,
    identifyingMarks,
    serialNumberPrivate,
    approximateValue,
    dateLost,
    timeLost: timeLost || '12:00',
    location: location || building,
    building,
    room,
    campusArea: campusArea || 'MVGR Campus',
    images: images && Array.isArray(images) ? images : [],
    contactPreference: contactPreference || 'CampusRecover In-App Chat',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.lostItems.set(newLostId, newLostItem);

  // Update building count
  const bldg = db.campusBuildings.find((b) => b.name === building);
  if (bldg) bldg.lostCount++;

  // Log audit
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REPORT_LOST_CREATED',
    targetType: 'LostItem',
    targetId: newLostId,
    details: `Created lost report for ${itemName} in ${building}`,
    timestamp: new Date().toISOString(),
  });

  // Execute AI Matching automatically in background
  try {
    const matches = await matchNewLostItem(newLostItem);
    if (matches.length > 0) {
      newLostItem.status = 'POTENTIAL_MATCH';
      db.lostItems.set(newLostId, newLostItem);
    }
    return res.status(201).json({ item: newLostItem, matchCount: matches.length, matches });
  } catch (err) {
    console.error('Error running AI matching on new lost item:', err);
    return res.status(201).json({ item: newLostItem, matchCount: 0, matches: [] });
  }
});

// ----------------------------------------------------
// FOUND ITEMS ENDPOINTS
// ----------------------------------------------------

app.get('/api/found', (req: Request, res: Response) => {
  const { search, category, status, building } = req.query;
  let items = Array.from(db.foundItems.values());

  if (category && category !== 'ALL') {
    items = items.filter((i) => i.category.toLowerCase() === String(category).toLowerCase());
  }
  if (status && status !== 'ALL') {
    items = items.filter((i) => i.status === status);
  }
  if (building && building !== 'ALL') {
    items = items.filter((i) => i.building.toLowerCase() === String(building).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (i) =>
        i.itemName.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.brand && i.brand.toLowerCase().includes(q)) ||
        i.color.toLowerCase().includes(q) ||
        i.locationFound.toLowerCase().includes(q)
    );
  }

  // Redact private notes for privacy
  const safeItems = items.map((i) => {
    const { sensitiveNotesPrivate, ...rest } = i;
    return rest;
  });

  res.json(safeItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.get('/api/found/:id', (req: Request, res: Response) => {
  const item = db.foundItems.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Found report not found' });
  }

  const currentUser = getAuthUser(req);
  const isStaffOrFinder =
    currentUser && (currentUser.id === item.userId || currentUser.role === 'ADMIN' || currentUser.role === 'CAMPUS_STAFF');

  if (!isStaffOrFinder) {
    const { sensitiveNotesPrivate, ...safeItem } = item;
    return res.json(safeItem);
  }

  res.json(item);
});

app.post('/api/found', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const {
    itemName,
    category,
    description,
    brand,
    model,
    color,
    size,
    material,
    identifyingFeatures,
    sensitiveNotesPrivate,
    dateFound,
    timeFound,
    locationFound,
    building,
    room,
    campusArea,
    images,
    internalOfficeStorage,
  } = req.body;

  if (!itemName || !category || !description || !color || !dateFound || !building) {
    return res.status(400).json({ error: 'Missing required report fields (name, category, description, color, date, building)' });
  }

  const newFoundId = `found_${Date.now()}`;
  const publicFinderName =
    user.role === 'CAMPUS_STAFF'
      ? 'Main Gate Security Officer'
      : user.role === 'ADMIN'
      ? 'Campus Safety Admin'
      : `Campus Member (${user.department || 'MVGR'})`;

  const newFoundItem: FoundItem = {
    id: newFoundId,
    userId: user.id,
    userName: publicFinderName,
    userEmail: user.email,
    itemName,
    category,
    description,
    brand,
    model,
    color,
    size,
    material,
    identifyingFeatures,
    sensitiveNotesPrivate,
    dateFound,
    timeFound: timeFound || '12:00',
    locationFound: locationFound || building,
    building,
    room,
    campusArea: campusArea || 'MVGR Campus',
    images: images && Array.isArray(images) ? images : [],
    internalOfficeStorage: internalOfficeStorage || (user.role === 'CAMPUS_STAFF' ? 'Main Gate Security Post' : 'With Finder'),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.foundItems.set(newFoundId, newFoundItem);

  const bldg = db.campusBuildings.find((b) => b.name === building);
  if (bldg) bldg.foundCount++;

  // Log audit
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REPORT_FOUND_CREATED',
    targetType: 'FoundItem',
    targetId: newFoundId,
    details: `Created found report for ${itemName} in ${building}`,
    timestamp: new Date().toISOString(),
  });

  // Run AI matching in reverse against active lost reports
  try {
    const matches = await matchNewFoundItem(newFoundItem);
    if (matches.length > 0) {
      newFoundItem.status = 'POTENTIAL_OWNER';
      db.foundItems.set(newFoundId, newFoundItem);
    }
    return res.status(201).json({ item: newFoundItem, matchCount: matches.length, matches });
  } catch (err) {
    console.error('Error running AI matching on new found item:', err);
    return res.status(201).json({ item: newFoundItem, matchCount: 0, matches: [] });
  }
});

// ----------------------------------------------------
// AI MATCHING ENDPOINTS
// ----------------------------------------------------

app.get('/api/matches', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let matches = Array.from(db.matches.values());

  if (user.role !== 'ADMIN' && user.role !== 'CAMPUS_STAFF') {
    // Only show matches involving the current user's lost or found items
    matches = matches.filter((m) => m.lostItem.userId === user.id || m.foundItem.userId === user.id);
  }

  res.json(matches.sort((a, b) => b.overallScore - a.overallScore));
});

app.get('/api/matches/:id', requireAuth, (req: Request, res: Response) => {
  const match = db.matches.get(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'AI match record not found' });
  }
  res.json(match);
});

app.post('/api/matches/run', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let newMatchesCount = 0;

  const lostList = Array.from(db.lostItems.values()).filter((l) => l.status === 'ACTIVE' || l.status === 'POTENTIAL_MATCH');
  const foundList = Array.from(db.foundItems.values()).filter((f) => f.status === 'ACTIVE' || f.status === 'POTENTIAL_OWNER');

  for (const lost of lostList) {
    for (const found of foundList) {
      const match = await calculateMatch(lost, found);
      if (match.overallScore >= db.aiWeights.minThreshold) {
        db.matches.set(match.id, match);
        newMatchesCount++;
      }
    }
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'AI_MATCHING_TRIGGERED',
    targetType: 'System',
    targetId: 'matchingEngine',
    details: `Triggered batch comparison; computed ${newMatchesCount} matches above threshold`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, count: newMatchesCount, total: db.matches.size });
});

app.post('/api/matches/:id/report', requireAuth, (req: Request, res: Response) => {
  const match = db.matches.get(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match record not found' });
  }

  match.isFlaggedIncorrect = true;
  db.matches.set(match.id, match);

  res.json({ success: true, message: 'Match marked as incorrect. Feedback recorded for AI tuning.' });
});

// ----------------------------------------------------
// CLAIMS & OWNERSHIP VERIFICATION ENDPOINTS
// ----------------------------------------------------

app.get('/api/claims', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let claims = Array.from(db.claims.values());

  if (user.role !== 'ADMIN' && user.role !== 'CAMPUS_STAFF') {
    claims = claims.filter((c) => c.claimantId === user.id || c.finderId === user.id);
  }

  res.json(claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.get('/api/claims/:id', requireAuth, (req: Request, res: Response) => {
  const claim = db.claims.get(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim record not found' });
  }
  res.json(claim);
});

app.post('/api/claims', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { lostItemId, foundItemId, verificationAnswers, proofNotes } = req.body;

  if (!lostItemId || !foundItemId || !verificationAnswers || !Array.isArray(verificationAnswers)) {
    return res.status(400).json({ error: 'Missing required claim parameters or verification answers' });
  }

  const lost = db.lostItems.get(lostItemId);
  const found = db.foundItems.get(foundItemId);
  if (!lost || !found) {
    return res.status(404).json({ error: 'Referenced lost or found item does not exist' });
  }

  const claimId = `claim_${Date.now()}`;
  const handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newClaim: Claim = {
    id: claimId,
    lostItemId,
    foundItemId,
    claimantId: user.id,
    claimantName: user.name,
    claimantEmail: user.email,
    finderId: found.userId,
    finderName: found.userName,
    finderEmail: found.userEmail,
    lostItemTitle: lost.itemName,
    foundItemTitle: found.itemName,
    status: 'PENDING',
    verificationAnswers,
    proofNotes: proofNotes || '',
    meetingLocation: 'Admin Block',
    handoverCode,
    returnConfirmedByClaimant: false,
    returnConfirmedByFinder: false,
    createdAt: new Date().toISOString(),
  };

  db.claims.set(claimId, newClaim);

  // Notify finder and staff
  const notif: Notification = {
    id: `notif_${Date.now()}`,
    userId: found.userId,
    title: 'New Ownership Claim Submitted',
    message: `${user.name} submitted an ownership claim with verification answers for "${found.itemName}".`,
    type: 'CLAIM_STATUS',
    linkUrl: '/claims',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const currentNotifs = db.notifications.get(found.userId) || [];
  db.notifications.set(found.userId, [notif, ...currentNotifs]);

  // Create an automatic linked conversation if none exists
  let existingConv = Array.from(db.conversations.values()).find(
    (c) => (c.claimId === claimId) || (c.participantIds.includes(user.id) && c.participantIds.includes(found.userId))
  );

  let convId = existingConv?.id;
  if (!existingConv) {
    convId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: convId,
      claimId,
      participantIds: [user.id, found.userId],
      participantNames: {
        [user.id]: `${user.name} (Claimant/Loser)`,
        [found.userId]: `${found.userName} (Finder)`,
      },
      itemTitle: found.itemName,
      lastMessage: 'Ownership claim started. Please chat here to verify item details before handover approval.',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 1,
    };
    db.conversations.set(convId, newConv);
  }

  newClaim.conversationId = convId;
  newClaim.chattedWithClaimant = false;

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CLAIM_SUBMITTED',
    targetType: 'Claim',
    targetId: claimId,
    details: `Claim submitted for ${found.itemName} with ${verificationAnswers.length} private answers`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(newClaim);
});

// Mark chat initiated / opened between finder and claimant (loser)
app.post('/api/claims/:id/chat-initiated', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const claim = db.claims.get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  // Ensure conversation exists
  let conv = Array.from(db.conversations.values()).find(
    (c) => c.claimId === claim.id || (c.participantIds.includes(claim.claimantId) && c.participantIds.includes(claim.finderId))
  );

  if (!conv) {
    const convId = `conv_${Date.now()}`;
    conv = {
      id: convId,
      claimId: claim.id,
      participantIds: [claim.claimantId, claim.finderId],
      participantNames: {
        [claim.claimantId]: `${claim.claimantName} (Claimant/Loser)`,
        [claim.finderId]: `${claim.finderName} (Finder)`,
      },
      itemTitle: claim.foundItemTitle,
      lastMessage: 'Chat opened for claim ownership verification.',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };
    db.conversations.set(convId, conv);
  }

  claim.chattedWithClaimant = true;
  claim.conversationId = conv.id;
  db.claims.set(claim.id, claim);

  res.json({ success: true, conversationId: conv.id, claim });
});

app.put('/api/claims/:id/status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { status, adminNotes, meetingLocation, meetingScheduledAt } = req.body;
  const claim = db.claims.get(req.params.id);

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  // Verification of claim can be allowed ONLY by the Finder of the item
  if (status === 'VERIFIED') {
    if (user.id !== claim.finderId) {
      return res.status(403).json({
        error: 'Verification of claim can be allowed ONLY by the Finder who found the item.',
      });
    }

    // Must chat with claimant (loser) first before verification
    const hasChatted = Boolean(claim.chattedWithClaimant);
    if (!hasChatted) {
      return res.status(400).json({
        error: 'Verification requires chatting with the claimant (loser) first to verify item details.',
      });
    }
  } else {
    // For rejection or review, finder or admin can update
    const isAuthorized = user.id === claim.finderId || user.role === 'ADMIN' || user.role === 'CAMPUS_STAFF';
    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to update this claim' });
    }
  }

  if (status) claim.status = status;
  if (adminNotes !== undefined) claim.adminNotes = adminNotes;
  if (meetingLocation) claim.meetingLocation = meetingLocation;
  if (meetingScheduledAt) claim.meetingScheduledAt = meetingScheduledAt;

  db.claims.set(claim.id, claim);

  // Notify claimant
  const notif: Notification = {
    id: `notif_${Date.now()}`,
    userId: claim.claimantId,
    title: `Claim Status: ${status}`,
    message: `Your claim for "${claim.foundItemTitle}" is now ${status}. Check verification details and campus checkpoint.`,
    type: 'CLAIM_STATUS',
    linkUrl: '/claims',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const claimantNotifs = db.notifications.get(claim.claimantId) || [];
  db.notifications.set(claim.claimantId, [notif, ...claimantNotifs]);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CLAIM_STATUS_UPDATED',
    targetType: 'Claim',
    targetId: claim.id,
    details: `Status changed to ${status} by ${user.name}`,
    timestamp: new Date().toISOString(),
  });

  res.json(claim);
});

// Guided return completion: both parties confirm safe return
app.post('/api/claims/:id/confirm-return', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const claim = db.claims.get(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  if (user.id === claim.claimantId) {
    claim.returnConfirmedByClaimant = true;
  } else if (user.id === claim.finderId || user.role === 'CAMPUS_STAFF' || user.role === 'ADMIN') {
    claim.returnConfirmedByFinder = true;
  } else {
    return res.status(403).json({ error: 'Not authorized to confirm this return' });
  }

  // If both confirm, or staff/admin marks it completed
  if ((claim.returnConfirmedByClaimant && claim.returnConfirmedByFinder) || user.role === 'CAMPUS_STAFF' || user.role === 'ADMIN') {
    claim.status = 'RETURNED';
    claim.returnedAt = new Date().toISOString();

    // Mark underlying lost and found items as RETURNED
    const lost = db.lostItems.get(claim.lostItemId);
    if (lost) {
      lost.status = 'RETURNED';
      db.lostItems.set(lost.id, lost);
    }
    const found = db.foundItems.get(claim.foundItemId);
    if (found) {
      found.status = 'RETURNED';
      db.foundItems.set(found.id, found);
    }

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'ITEM_RETURN_COMPLETED',
      targetType: 'Claim',
      targetId: claim.id,
      details: `Item ${claim.foundItemTitle} officially returned to ${claim.claimantName}`,
      timestamp: new Date().toISOString(),
    });
  }

  db.claims.set(claim.id, claim);
  res.json(claim);
});

// Secure Handover Verification Protocol
app.post('/api/claims/:id/handover-verify', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { code, location, witnessRole, checklist } = req.body;
  const claim = db.claims.get(req.params.id);

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  // Ensure code matches
  if (!claim.handoverCode) {
    claim.handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  if (!code || String(code).trim() !== String(claim.handoverCode).trim()) {
    return res.status(400).json({ error: `Invalid Handover PIN "${code}". Please enter the correct 6-digit code shown on the claimant's screen.` });
  }

  const receiptId = `REC-MVGR-${Date.now().toString().slice(-6)}`;
  claim.status = 'RETURNED';
  claim.handoverLocation = location || claim.meetingLocation || 'Admin Block';
  claim.handoverWitness = witnessRole || 'Campus Security';
  claim.handoverReceiptId = receiptId;
  claim.handoverChecklist = checklist || { idVerified: true, itemVerified: true, conditionConfirmed: true };
  claim.returnConfirmedByClaimant = true;
  claim.returnConfirmedByFinder = true;
  claim.returnedAt = new Date().toISOString();

  db.claims.set(claim.id, claim);

  // Update underlying items
  const lost = db.lostItems.get(claim.lostItemId);
  if (lost) {
    lost.status = 'RETURNED';
    db.lostItems.set(lost.id, lost);
  }
  const found = db.foundItems.get(claim.foundItemId);
  if (found) {
    found.status = 'RETURNED';
    db.foundItems.set(found.id, found);
  }

  // Audit log
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'SECURE_HANDOVER_VERIFIED',
    targetType: 'Claim',
    targetId: claim.id,
    details: `Item "${claim.foundItemTitle}" securely verified and returned at ${claim.handoverLocation}. Receipt: ${receiptId}`,
    timestamp: new Date().toISOString(),
  });

  // Notifications
  const successNotif: Notification = {
    id: `notif_${Date.now()}`,
    userId: claim.claimantId,
    title: 'Secure Handover Completed!',
    message: `Your item "${claim.foundItemTitle}" has been verified and returned at ${claim.handoverLocation}. Official Receipt: ${receiptId}.`,
    type: 'RETURN_CONFIRMED',
    linkUrl: '/claims',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const claimantNotifs = db.notifications.get(claim.claimantId) || [];
  db.notifications.set(claim.claimantId, [successNotif, ...claimantNotifs]);

  res.json(claim);
});

// ----------------------------------------------------
// SECURE MESSAGING ENDPOINTS
// ----------------------------------------------------

app.get('/api/conversations', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const userConvs = Array.from(db.conversations.values()).filter((c) => c.participantIds.includes(user.id));
  res.json(userConvs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
});

app.post('/api/conversations', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { recipientId, recipientName, itemTitle, matchId, claimId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ error: 'Recipient ID is required' });
  }

  // Check if conversation already exists between these two users for this item
  let conv = Array.from(db.conversations.values()).find(
    (c) => c.participantIds.includes(user.id) && c.participantIds.includes(recipientId)
  );

  if (!conv) {
    const convId = `conv_${Date.now()}`;
    conv = {
      id: convId,
      matchId,
      claimId,
      participantIds: [user.id, recipientId],
      participantNames: {
        [user.id]: user.name,
        [recipientId]: recipientName || 'Campus User',
      },
      itemTitle: itemTitle || 'Lost & Found Case',
      lastMessage: 'Conversation initialized',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };
    db.conversations.set(convId, conv);
  }

  res.status(201).json(conv);
});

app.get('/api/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const conv = db.conversations.get(req.params.id);
  if (!conv || !conv.participantIds.includes(user.id)) {
    return res.status(403).json({ error: 'Access denied to this conversation' });
  }

  const msgs = db.messages.get(conv.id) || [];
  // Mark messages as read by current user
  for (const m of msgs) {
    if (!m.readBy.includes(user.id)) {
      m.readBy.push(user.id);
    }
  }

  res.json(msgs);
});

app.post('/api/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { content, attachmentUrl, isE2EE } = req.body;
  const conv = db.conversations.get(req.params.id);

  if (!conv || !conv.participantIds.includes(user.id)) {
    return res.status(403).json({ error: 'Access denied to this conversation' });
  }

  if (!content && !attachmentUrl) {
    return res.status(400).json({ error: 'Message content or attachment is required' });
  }

  const msgId = `msg_${Date.now()}`;
  const newMsg: Message = {
    id: msgId,
    conversationId: conv.id,
    senderId: user.id,
    senderName: user.name,
    content: content || 'Attachment',
    attachmentUrl,
    isE2EE: Boolean(isE2EE),
    readBy: [user.id],
    createdAt: new Date().toISOString(),
  };

  const msgs = db.messages.get(conv.id) || [];
  msgs.push(newMsg);
  db.messages.set(conv.id, msgs);

  conv.lastMessage = content || 'Sent an attachment';
  conv.lastMessageAt = newMsg.createdAt;
  db.conversations.set(conv.id, conv);

  // If this conversation is linked to a claim, mark chattedWithClaimant as true
  if (conv.claimId) {
    const linkedClaim = db.claims.get(conv.claimId);
    if (linkedClaim) {
      linkedClaim.chattedWithClaimant = true;
      db.claims.set(linkedClaim.id, linkedClaim);
    }
  }

  // Notify other participant
  const otherUserId = conv.participantIds.find((id) => id !== user.id);
  if (otherUserId) {
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      userId: otherUserId,
      title: `Message from ${user.name}`,
      message: content ? content.slice(0, 80) : 'Sent an attachment',
      type: 'MESSAGE',
      linkUrl: '/messages',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const userNotifs = db.notifications.get(otherUserId) || [];
    db.notifications.set(otherUserId, [notif, ...userNotifs]);
  }

  res.status(201).json(newMsg);
});

// ----------------------------------------------------
// NOTIFICATIONS ENDPOINTS
// ----------------------------------------------------

app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const notifs = db.notifications.get(user.id) || [];
  res.json(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.put('/api/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const notifs = db.notifications.get(user.id) || [];
  const target = notifs.find((n) => n.id === req.params.id);
  if (target) {
    target.isRead = true;
  }
  res.json({ success: true });
});

app.put('/api/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const notifs = db.notifications.get(user.id) || [];
  for (const n of notifs) {
    n.isRead = true;
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// CAMPUS MAP & LOCATIONS
// ----------------------------------------------------

app.get('/api/campus/buildings', (req: Request, res: Response) => {
  res.json(db.campusBuildings);
});

// ----------------------------------------------------
// ADMIN DASHBOARD & CONTROLS
// ----------------------------------------------------

function requireAdminOrStaff(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CAMPUS_STAFF')) {
    return res.status(403).json({ error: 'Access restricted to campus staff and administrators' });
  }
  (req as any).user = user;
  next();
}

app.get('/api/admin/stats', requireAdminOrStaff, (req: Request, res: Response) => {
  const lostCount = db.lostItems.size;
  const foundCount = db.foundItems.size;
  const matchesCount = db.matches.size;
  const returnedCount = Array.from(db.claims.values()).filter((c) => c.status === 'RETURNED').length;
  const usersCount = db.users.size;
  const pendingClaims = Array.from(db.claims.values()).filter((c) => c.status === 'PENDING').length;
  const returnRate = lostCount > 0 ? Math.round((returnedCount / lostCount) * 100) : 0;

  // Category distribution
  const categories: Record<string, { lost: number; found: number }> = {};
  for (const l of db.lostItems.values()) {
    if (!categories[l.category]) categories[l.category] = { lost: 0, found: 0 };
    categories[l.category].lost++;
  }
  for (const f of db.foundItems.values()) {
    if (!categories[f.category]) categories[f.category] = { lost: 0, found: 0 };
    categories[f.category].found++;
  }

  res.json({
    totalUsers: usersCount,
    totalLost: lostCount,
    totalFound: foundCount,
    totalMatches: matchesCount,
    itemsReturned: returnedCount,
    pendingClaims,
    returnRate,
    categories,
    aiWeights: db.aiWeights,
  });
});

app.get('/api/admin/users', requireAdminOrStaff, (req: Request, res: Response) => {
  const safeUsers = Array.from(db.users.values()).map((u) => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  res.json(safeUsers);
});

app.put('/api/admin/users/:id/role', requireAdminOrStaff, (req: Request, res: Response) => {
  const { role } = req.body;
  const targetUser = db.users.get(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  targetUser.role = role;
  db.users.set(targetUser.id, targetUser);

  const { passwordHash, ...safeUser } = targetUser;
  res.json(safeUser);
});

app.get('/api/admin/ai-config', requireAdminOrStaff, (req: Request, res: Response) => {
  res.json(db.aiWeights);
});

app.put('/api/admin/ai-config', requireAdminOrStaff, (req: Request, res: Response) => {
  const { textWeight, imageWeight, metadataWeight, locationWeight, timeWeight, minThreshold } = req.body;
  if (textWeight !== undefined) db.aiWeights.textWeight = Number(textWeight);
  if (imageWeight !== undefined) db.aiWeights.imageWeight = Number(imageWeight);
  if (metadataWeight !== undefined) db.aiWeights.metadataWeight = Number(metadataWeight);
  if (locationWeight !== undefined) db.aiWeights.locationWeight = Number(locationWeight);
  if (timeWeight !== undefined) db.aiWeights.timeWeight = Number(timeWeight);
  if (minThreshold !== undefined) db.aiWeights.minThreshold = Number(minThreshold);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    actorId: ((req as any).user as User).id,
    actorName: ((req as any).user as User).name,
    actorRole: ((req as any).user as User).role,
    action: 'AI_WEIGHTS_UPDATED',
    targetType: 'AIWeightsConfig',
    targetId: 'config',
    details: `Updated AI weights: Text=${db.aiWeights.textWeight}, Img=${db.aiWeights.imageWeight}, Meta=${db.aiWeights.metadataWeight}, Loc=${db.aiWeights.locationWeight}, Time=${db.aiWeights.timeWeight}, Min=${db.aiWeights.minThreshold}%`,
    timestamp: new Date().toISOString(),
  });

  res.json(db.aiWeights);
});

app.get('/api/admin/audit-logs', requireAdminOrStaff, (req: Request, res: Response) => {
  res.json(db.auditLogs);
});

// ----------------------------------------------------
// VITE DEV SERVER & PRODUCTION STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[CampusRecover AI] Server running on port ${PORT}`);
  });
}

startServer();
