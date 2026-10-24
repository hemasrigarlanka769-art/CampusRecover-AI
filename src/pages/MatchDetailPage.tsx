import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileCheck2,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AIMatch, Claim } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface MatchDetailPageProps {
  match: AIMatch;
  onBack: () => void;
  onNavigateToMessages: (conversationId?: string) => void;
  onClaimCreated: () => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({
  match,
  onBack,
  onNavigateToMessages,
  onClaimCreated,
}) => {
  const { user } = useAuth();
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [isFlagged, setIsFlagged] = useState(match.isFlaggedIncorrect);
  const [flagFeedback, setFlagFeedback] = useState<string | null>(null);

  // Claim questionnaire state
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleReportIncorrect = async () => {
    try {
      await api.reportIncorrectMatch(match.id);
      setIsFlagged(true);
      setFlagFeedback('Feedback received. Our AI matching model will tune its weights accordingly.');
      setTimeout(() => setFlagFeedback(null), 4000);
    } catch {
      // Fallback
      setIsFlagged(true);
    }
  };

  const handleStartClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setIsSubmittingClaim(true);

    try {
      await api.createClaim({
        lostItemId: match.lostItemId,
        foundItemId: match.foundItemId,
        verificationAnswers: [
          {
            question: 'What color or unique feature is on the zipper/casing/rim?',
            answer: q1,
          },
          {
            question: 'What stickers, marks, or accessories were present?',
            answer: q2,
          },
          {
            question: 'What items or contents were inside or attached?',
            answer: q3,
          },
        ],
        proofNotes,
      });

      setClaimSuccess(true);
      onClaimCreated();
    } catch (err: any) {
      setClaimError(err.message || 'Failed to submit ownership claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleContactFinder = async () => {
    try {
      const conv = await api.createConversation({
        recipientId: match.foundItem.userId,
        recipientName: match.foundItem.userName,
        itemTitle: match.foundItem.itemName,
        matchId: match.id,
      });
      onNavigateToMessages(conv.id);
    } catch {
      onNavigateToMessages();
    }
  };

  const scoreClassColor =
    match.overallScore >= 90
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : match.overallScore >= 75
      ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
      : 'text-amber-600 bg-amber-50 border-amber-200';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Matches List</span>
        </button>

        <div className="flex items-center gap-2">
          {isFlagged ? (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
              Flagged as Incorrect Match
            </span>
          ) : (
            <button
              onClick={handleReportIncorrect}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              Report Incorrect Match
            </button>
          )}
        </div>
      </div>

      {flagFeedback && (
        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
          {flagFeedback}
        </div>
      )}

      {/* Hero Match Gauge Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multimodal Match Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {match.classification.replace('_', ' ')} Match Confidence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            Our hybrid matching model analyzed verbal semantics, vision features, spatial campus coordinates, and timestamp deltas.
          </p>
        </div>

        {/* Big Overall Confidence Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 min-w-[200px]">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold font-mono tabular-nums text-slate-900">
              {match.overallScore}
            </span>
            <span className="text-xl font-bold text-slate-400">%</span>
          </div>
          <span className={`mt-2 px-2.5 py-0.5 rounded text-xs font-bold border ${scoreClassColor}`}>
            {match.classification.replace('_', ' ')} SIMILARITY
          </span>
          <span className="text-[10px] text-slate-500 mt-2 text-center">
            Human verification required before return
          </span>
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON: LOST VS FOUND */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LOST ITEM */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Reported Lost Item</h2>
            </div>
            <span className="text-xs text-slate-500">By {match.lostItem.userName}</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              {match.lostItem.images && match.lostItem.images.length > 0 ? (
                <img
                  src={match.lostItem.images[0]}
                  alt="Lost Item"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No image attached
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{match.lostItem.itemName}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{match.lostItem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
              <div>
                <span className="text-slate-600">Category</span>
                <p className="font-semibold text-slate-900 mt-0.5">{match.lostItem.category}</p>
              </div>
              <div>
                <span className="text-slate-600">Color</span>
                <p className="font-semibold text-slate-900 mt-0.5">{match.lostItem.color}</p>
              </div>
              <div>
                <span className="text-slate-600">Brand / Model</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {match.lostItem.brand || 'N/A'} {match.lostItem.model || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Building</span>
                <p className="font-semibold text-slate-900 mt-0.5">{match.lostItem.building}</p>
              </div>
              <div>
                <span className="text-slate-600">Reported Date</span>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                  {match.lostItem.dateLost}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Distinguishing Mark</span>
                <p className="font-semibold text-slate-900 mt-0.5 truncate">
                  {match.lostItem.identifyingMarks || 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500">
            Case ID: <span className="font-mono">{match.lostItemId}</span>
          </div>
        </div>

        {/* FOUND ITEM */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Reported Found Item</h2>
            </div>
            <span className="text-xs text-slate-500">Turned in by {match.foundItem.userName}</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              {match.foundItem.images && match.foundItem.images.length > 0 ? (
                <img
                  src={match.foundItem.images[0]}
                  alt="Found Item"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No image attached
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{match.foundItem.itemName}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{match.foundItem.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
              <div>
                <span className="text-slate-600">Category</span>
                <p className="font-semibold text-slate-900 mt-0.5">{match.foundItem.category}</p>
              </div>
              <div>
                <span className="text-slate-600">Color</span>
                <p className="font-semibold text-slate-900 mt-0.5">{match.foundItem.color}</p>
              </div>
              <div>
                <span className="text-slate-600">Brand / Model</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {match.foundItem.brand || 'N/A'} {match.foundItem.model || ''}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Building</span>
                <p className="font-semibold text-slate-900 mt-0.5">{match.foundItem.building}</p>
              </div>
              <div>
                <span className="text-slate-600">Found Date</span>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                  {match.foundItem.dateFound}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Current Storage</span>
                <p className="font-semibold text-slate-900 mt-0.5 truncate">
                  {match.foundItem.internalOfficeStorage || 'Circulation Desk'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500">
            Case ID: <span className="font-mono">{match.foundItemId}</span>
          </div>
        </div>
      </div>

      {/* WHY THIS MATCH? (AI EXPLAINABILITY BREAKDOWN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Explainability: Why was this match recommended?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Every match is calculated across 5 weighted dimensions to avoid false positives.
          </p>
        </div>

        {/* 5-Factor Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Image Similarity</span>
              <span className="font-mono font-bold text-slate-900">{match.imageSimilarity}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${match.imageSimilarity}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600">Weight: 35%</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Semantic Text</span>
              <span className="font-mono font-bold text-slate-900">{match.textSimilarity}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${match.textSimilarity}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600">Weight: 35%</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Metadata</span>
              <span className="font-mono font-bold text-slate-900">{match.metadataSimilarity}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${match.metadataSimilarity}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600">Weight: 20%</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Campus Location</span>
              <span className="font-mono font-bold text-slate-900">{match.locationSimilarity}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${match.locationSimilarity}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600">Weight: 5%</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Time Proximity</span>
              <span className="font-mono font-bold text-slate-900">{match.timeSimilarity}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${match.timeSimilarity}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-600">Weight: 5%</span>
          </div>
        </div>

        {/* Explainability Checklist */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Verified Matching Factors:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {match.reasons.map((reason, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Is this your item? Start an official ownership verification claim to schedule return.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleContactFinder}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Finder</span>
          </button>

          <button
            onClick={() => setClaimModalOpen(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Verify Ownership &amp; Claim Item</span>
          </button>
        </div>
      </div>

      {/* OWNERSHIP VERIFICATION QUESTIONNAIRE MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ownership Verification</h3>
                  <p className="text-xs text-slate-500">Private questionnaire for fraud prevention</p>
                </div>
              </div>
              <button
                onClick={() => setClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {claimSuccess ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Claim Submitted Successfully!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your verification answers were sent to the Finder (<strong>{match.foundItem.userName}</strong>). You can now chat directly with the finder to verify ownership and arrange the handover!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={handleContactFinder}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat with Finder ({match.foundItem.userName}) Now</span>
                  </button>
                  <button
                    onClick={() => {
                      setClaimModalOpen(false);
                      onClaimCreated();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    View in Claims Center
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartClaim} className="p-6 space-y-4 text-xs">
                {claimError && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                    {claimError}
                  </div>
                )}

                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-indigo-900 leading-relaxed">
                  <p className="font-semibold mb-0.5">Why are these questions required?</p>
                  To protect campus belongings, finders compare your answers against unreleased confidential details (e.g. stickers, specific contents, cord colors).
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Question 1: What color or unique feature is on the zipper pull, casing, or rim?
                  </label>
                  <input
                    type="text"
                    required
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    placeholder="e.g. Neon orange paracord tie, slight dent on bottom edge"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Question 2: What specific stickers, initial engravings, or marks are on it?
                  </label>
                  <input
                    type="text"
                    required
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    placeholder="e.g. Hologram HackCampus sticker top-right, scratched initials 'JH'"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Question 3: What items, dongles, or specific contents were inside the case/bag?
                  </label>
                  <input
                    type="text"
                    required
                    value={q3}
                    onChange={(e) => setQ3(e.target.value)}
                    placeholder="e.g. Gray multi-port dongle, blue highlighter, ME 301 lecture notes"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Additional Proof or Verification Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="e.g. I can unlock with university login screen / fingerprint at the library desk."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClaim}
                    className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingClaim ? 'Submitting Claim...' : 'Submit Verification Answers'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
