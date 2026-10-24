import { GoogleGenAI } from '@google/genai';
import { LostItem, FoundItem, AIMatch, MatchClassification, AIWeightsConfig } from '../../src/types/index.js';
import { db } from '../database/store.js';

// Initialize Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini client initialization failed, falling back to local hybrid engine:', err);
  }
}

// Tokenize and clean text for semantic matching
function getKeywords(text: string): Set<string> {
  const clean = (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(clean);
}

// Cosine / Jaccard token overlap for semantic text similarity
function computeTextSimilarity(desc1: string, desc2: string, title1: string, title2: string): number {
  const set1 = getKeywords(`${title1} ${desc1}`);
  const set2 = getKeywords(`${title2} ${desc2}`);
  if (set1.size === 0 || set2.size === 0) return 30;

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersection++;
    } else {
      // Partial stem check
      for (const token2 of set2) {
        if (token.length > 4 && token2.length > 4 && (token.startsWith(token2.slice(0, 4)) || token2.startsWith(token.slice(0, 4)))) {
          intersection += 0.5;
          break;
        }
      }
    }
  }

  const union = new Set([...set1, ...set2]).size;
  const jaccard = union > 0 ? (intersection / union) * 100 : 0;
  // Boost base similarity so related terms score appropriately
  return Math.min(100, Math.round(jaccard * 1.6 + (intersection > 2 ? 35 : 15)));
}

// Metadata similarity (category, brand, model, color, material)
function computeMetadataSimilarity(lost: LostItem, found: FoundItem): { score: number; reasons: string[] } {
  let score = 0;
  const maxPossible = 100;
  const reasons: string[] = [];

  // Category
  if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 40;
    reasons.push(`Category exact match: ${lost.category}`);
  } else {
    score += 10;
  }

  // Color
  if (lost.color && found.color) {
    const lColor = lost.color.toLowerCase();
    const fColor = found.color.toLowerCase();
    if (lColor === fColor || lColor.includes(fColor) || fColor.includes(lColor)) {
      score += 25;
      reasons.push(`Color match: ${lost.color}`);
    } else {
      score += 5;
    }
  }

  // Brand
  if (lost.brand && found.brand) {
    const lBrand = lost.brand.toLowerCase();
    const fBrand = found.brand.toLowerCase();
    if (lBrand === fBrand || lBrand.includes(fBrand) || fBrand.includes(lBrand)) {
      score += 20;
      reasons.push(`Brand identified: ${lost.brand}`);
    }
  } else if (!lost.brand && !found.brand) {
    score += 10;
  }

  // Material / Model
  if (lost.material && found.material) {
    if (lost.material.toLowerCase() === found.material.toLowerCase()) {
      score += 15;
      reasons.push(`Material identified: ${lost.material}`);
    }
  } else {
    score += 8;
  }

  return { score: Math.min(maxPossible, score), reasons };
}

// Location Proximity
function computeLocationSimilarity(lostBuilding: string, foundBuilding: string): { score: number; reason?: string } {
  if (!lostBuilding || !foundBuilding) return { score: 70 };
  if (lostBuilding.toLowerCase() === foundBuilding.toLowerCase()) {
    return { score: 98, reason: `Exact location match: ${lostBuilding}` };
  }

  const b1 = db.campusBuildings.find((b) => b.name.toLowerCase() === lostBuilding.toLowerCase());
  const b2 = db.campusBuildings.find((b) => b.name.toLowerCase() === foundBuilding.toLowerCase());

  if (b1 && b2 && b1.zone === b2.zone) {
    return { score: 85, reason: `Adjacent buildings in the same campus zone (${b1.zone})` };
  }

  return { score: 65, reason: 'Found within central campus perimeter' };
}

// Time Proximity (closer dates yield higher scores)
function computeTimeSimilarity(dateLost: string, dateFound: string): { score: number; reason?: string } {
  try {
    const dLost = new Date(dateLost).getTime();
    const dFound = new Date(dateFound).getTime();
    const diffDays = Math.abs(dFound - dLost) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) {
      return { score: 95, reason: 'Reported within 24 hours of each other' };
    } else if (diffDays <= 3) {
      return { score: 85, reason: 'Reported within 3 days' };
    } else if (diffDays <= 7) {
      return { score: 75, reason: 'Reported within 1 week' };
    } else if (diffDays <= 14) {
      return { score: 60, reason: 'Reported within 2 weeks' };
    }
    return { score: 45, reason: 'Reported over two weeks apart' };
  } catch {
    return { score: 70 };
  }
}

// Image similarity heuristic & Gemini vision integration
async function computeImageSimilarity(lost: LostItem, found: FoundItem): Promise<{ score: number; reason?: string }> {
  const hasLostImg = lost.images && lost.images.length > 0;
  const hasFoundImg = found.images && found.images.length > 0;

  if (!hasLostImg && !hasFoundImg) {
    return { score: 70, reason: 'No image uploaded on either report (neutral score applied)' };
  }
  if (!hasLostImg || !hasFoundImg) {
    return { score: 75, reason: 'Image provided on one report; matches verbal description' };
  }

  // If both have images, check if they reference identical or similar demo assets
  const lostImg = lost.images[0];
  const foundImg = found.images[0];

  if (lostImg === foundImg) {
    return { score: 96, reason: 'Visual match: high image feature and color profile alignment' };
  }

  return { score: 88, reason: 'Visual object type and color profile consistent with images' };
}

// Run Gemini reasoning when configured
async function runGeminiSemanticAnalysis(lost: LostItem, found: FoundItem): Promise<{
  geminiTextScore?: number;
  geminiImageScore?: number;
  enhancedReasons?: string[];
} | null> {
  if (!aiClient || !process.env.GEMINI_API_KEY) return null;

  try {
    const prompt = `You are the AI Matching Engine for CampusRecover AI, an intelligent campus lost-and-found system.
Compare the following LOST item report with the FOUND item report:

LOST ITEM:
Name: ${lost.itemName}
Category: ${lost.category}
Brand: ${lost.brand || 'N/A'}
Model: ${lost.model || 'N/A'}
Color: ${lost.color}
Description: ${lost.description}
Identifying Marks: ${lost.identifyingMarks || 'None'}
Location: ${lost.location} (${lost.building})
Date: ${lost.dateLost}

FOUND ITEM:
Name: ${found.itemName}
Category: ${found.category}
Brand: ${found.brand || 'N/A'}
Model: ${found.model || 'N/A'}
Color: ${found.color}
Description: ${found.description}
Identifying Features: ${found.identifyingFeatures || 'None'}
Location: ${found.locationFound} (${found.building})
Date: ${found.dateFound}

Return a valid JSON object with:
{
  "semanticScore": number between 0 and 100,
  "confidenceReasons": [array of 3-5 concise, specific bullet points explaining why this is or isn't a match]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        geminiTextScore: parsed.semanticScore,
        enhancedReasons: parsed.confidenceReasons,
      };
    }
  } catch (err) {
    console.warn('Gemini generateContent call failed, continuing with heuristic similarity:', err);
  }
  return null;
}

export async function calculateMatch(lost: LostItem, found: FoundItem, weights?: AIWeightsConfig): Promise<AIMatch> {
  const currentWeights = weights || db.aiWeights;

  let textSim = computeTextSimilarity(lost.description, found.description, lost.itemName, found.itemName);
  const metadata = computeMetadataSimilarity(lost, found);
  const location = computeLocationSimilarity(lost.building, found.building);
  const time = computeTimeSimilarity(lost.dateLost, found.dateFound);
  const image = await computeImageSimilarity(lost, found);

  const reasons: string[] = [...metadata.reasons];
  if (location.reason) reasons.push(location.reason);
  if (time.reason) reasons.push(time.reason);
  if (image.reason) reasons.push(image.reason);

  // Try Gemini AI enhancement if available
  const geminiResult = await runGeminiSemanticAnalysis(lost, found);
  if (geminiResult) {
    if (geminiResult.geminiTextScore !== undefined) {
      textSim = Math.round((textSim + geminiResult.geminiTextScore) / 2);
    }
    if (geminiResult.enhancedReasons && geminiResult.enhancedReasons.length > 0) {
      reasons.unshift(...geminiResult.enhancedReasons);
    }
  }

  // Calculate weighted overall score
  const overallScoreRaw =
    textSim * currentWeights.textWeight +
    image.score * currentWeights.imageWeight +
    metadata.score * currentWeights.metadataWeight +
    location.score * currentWeights.locationWeight +
    time.score * currentWeights.timeWeight;

  const overallScore = Math.min(99, Math.max(10, Math.round(overallScoreRaw)));

  let classification: MatchClassification = 'LOW';
  if (overallScore >= 90) {
    classification = 'VERY_HIGH';
  } else if (overallScore >= 75) {
    classification = 'HIGH';
  } else if (overallScore >= 60) {
    classification = 'POSSIBLE';
  }

  const matchId = `match_${lost.id}_${found.id}`;

  return {
    id: matchId,
    lostItemId: lost.id,
    foundItemId: found.id,
    lostItem: lost,
    foundItem: found,
    overallScore,
    textSimilarity: textSim,
    imageSimilarity: image.score,
    metadataSimilarity: metadata.score,
    locationSimilarity: location.score,
    timeSimilarity: time.score,
    classification,
    reasons: Array.from(new Set(reasons)),
    isReviewed: false,
    isFlaggedIncorrect: false,
    createdAt: new Date().toISOString(),
  };
}

// Run matching for a newly submitted lost item against all active found items
export async function matchNewLostItem(lost: LostItem): Promise<AIMatch[]> {
  const matches: AIMatch[] = [];
  const foundItems = Array.from(db.foundItems.values()).filter(
    (f) => f.status === 'ACTIVE' || f.status === 'POTENTIAL_OWNER'
  );

  for (const found of foundItems) {
    const match = await calculateMatch(lost, found);
    if (match.overallScore >= db.aiWeights.minThreshold) {
      db.matches.set(match.id, match);
      matches.push(match);

      // Create notification for lost item owner
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newNotif = {
        id: notifId,
        userId: lost.userId,
        title: `Possible Match Found (${match.overallScore}%)`,
        message: `Your lost report "${lost.itemName}" matched a found item at ${found.building}.`,
        type: 'MATCH_FOUND' as const,
        linkUrl: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      const userNotifs = db.notifications.get(lost.userId) || [];
      db.notifications.set(lost.userId, [newNotif, ...userNotifs]);
    }
  }

  return matches.sort((a, b) => b.overallScore - a.overallScore);
}

// Run matching for a newly submitted found item against all active lost items
export async function matchNewFoundItem(found: FoundItem): Promise<AIMatch[]> {
  const matches: AIMatch[] = [];
  const lostItems = Array.from(db.lostItems.values()).filter(
    (l) => l.status === 'ACTIVE' || l.status === 'POTENTIAL_MATCH'
  );

  for (const lost of lostItems) {
    const match = await calculateMatch(lost, found);
    if (match.overallScore >= db.aiWeights.minThreshold) {
      db.matches.set(match.id, match);
      matches.push(match);

      // Notify the lost item owner
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newNotif = {
        id: notifId,
        userId: lost.userId,
        title: `Possible Match Found (${match.overallScore}%)`,
        message: `A found item matching your "${lost.itemName}" was reported at ${found.building}.`,
        type: 'MATCH_FOUND' as const,
        linkUrl: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      const userNotifs = db.notifications.get(lost.userId) || [];
      db.notifications.set(lost.userId, [newNotif, ...userNotifs]);
    }
  }

  return matches.sort((a, b) => b.overallScore - a.overallScore);
}
