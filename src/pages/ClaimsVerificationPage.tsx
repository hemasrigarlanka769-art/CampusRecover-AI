import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Calendar,
  XCircle,
  HelpCircle,
  Building,
  UserCheck,
  Check,
  KeyRound,
  QrCode,
  Printer,
  Copy,
  CheckCheck,
  ShieldAlert,
  Award,
  MessageSquare,
  Lock,
  Unlock,
  Send,
} from 'lucide-react';
import { Claim, ClaimStatus, Message } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CAMPUS_LOCATIONS } from '../data/locations.js';

interface ClaimsVerificationPageProps {
  claims: Claim[];
  onRefreshClaims: () => Promise<void>;
  setCurrentTab: (tab: string) => void;
}

export const ClaimsVerificationPage: React.FC<ClaimsVerificationPageProps> = ({
  claims,
  onRefreshClaims,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(claims[0] || null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [meetingLocationInput, setMeetingLocationInput] = useState('Admin Block');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Quick Chat Modal state
  const [quickChatOpen, setQuickChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Handover verification form states
  const [enteredHandoverPin, setEnteredHandoverPin] = useState('');
  const [selectedHandoverSpot, setSelectedHandoverSpot] = useState('Admin Block');
  const [witnessRole, setWitnessRole] = useState('Campus Security Desk');
  const [checklist, setChecklist] = useState({
    idVerified: true,
    itemVerified: true,
    conditionConfirmed: true,
  });
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  const isClaimant = user?.id === selectedClaim?.claimantId;
  const isFinder = user?.id === selectedClaim?.finderId;
  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'CAMPUS_STAFF';

  // Open Quick Chat with Claimant
  const handleOpenChatWithClaimant = async () => {
    if (!selectedClaim) return;
    setActionError(null);
    setIsUpdating(true);
    try {
      const res = await api.initiateClaimChat(selectedClaim.id);
      setSelectedClaim({
        ...selectedClaim,
        chattedWithClaimant: true,
        conversationId: res.conversationId,
      });

      // Fetch messages for this conversation
      const msgs = await api.getMessages(res.conversationId);
      setChatMessages(msgs);
      setQuickChatOpen(true);
      await onRefreshClaims();
    } catch (err: any) {
      setActionError(err.message || 'Failed to open chat');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedClaim?.conversationId) return;
    setIsSendingMessage(true);
    try {
      const msg = await api.sendMessage(selectedClaim.conversationId, { content: newMessageText.trim() });
      setChatMessages((prev) => [...prev, msg]);
      setNewMessageText('');
      setSelectedClaim((prev) => prev ? { ...prev, chattedWithClaimant: true } : null);
      await onRefreshClaims();
    } catch (err: any) {
      setActionError(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (status: ClaimStatus) => {
    if (!selectedClaim) return;
    setActionError(null);

    // Rule: Verification can be allowed ONLY by the Finder after chatting with the claimant (loser)
    if (status === 'VERIFIED') {
      if (!isFinder) {
        setActionError('Verification of claim can be allowed ONLY by the Finder who found the item.');
        return;
      }
      if (!selectedClaim.chattedWithClaimant) {
        setActionError('You must chat with the claimant (loser) first before verifying their claim.');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const updated = await api.updateClaimStatus(selectedClaim.id, {
        status,
        adminNotes: adminNotesInput || selectedClaim.adminNotes,
        meetingLocation: meetingLocationInput || selectedClaim.meetingLocation,
      });
      setSelectedClaim(updated);
      await onRefreshClaims();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update claim status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSecureHandoverVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setHandoverError(null);
    setIsUpdating(true);

    try {
      if (!enteredHandoverPin.trim()) {
        throw new Error('Please enter the 6-digit Handover PIN from the claimant.');
      }
      if (!checklist.idVerified || !checklist.itemVerified || !checklist.conditionConfirmed) {
        throw new Error('Please complete all 3 security checklist items before final handover.');
      }

      const updated = await api.verifyHandover(selectedClaim.id, {
        code: enteredHandoverPin.trim(),
        location: selectedHandoverSpot,
        witnessRole,
        checklist,
      });

      setSelectedClaim(updated);
      await onRefreshClaims();

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setHandoverError(err.message || 'Verification failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyPinToClipboard = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const workflowSteps = [
    { num: 1, label: 'Claim Submitted', done: true },
    { num: 2, label: 'Chat Verification', done: Boolean(selectedClaim?.chattedWithClaimant) },
    { num: 3, label: 'Finder Approval', done: selectedClaim?.status === 'VERIFIED' || selectedClaim?.status === 'RETURNED' },
    { num: 4, label: 'PIN Generated', done: selectedClaim?.status === 'VERIFIED' || selectedClaim?.status === 'RETURNED' },
    { num: 5, label: 'Meet at Checkpoint', done: selectedClaim?.status === 'VERIFIED' || selectedClaim?.status === 'RETURNED' },
    { num: 6, label: 'Physical ID Check', done: selectedClaim?.status === 'RETURNED' || Boolean(selectedClaim?.handoverChecklist?.idVerified) },
    { num: 7, label: 'Handover Verified', done: selectedClaim?.status === 'RETURNED' },
    { num: 8, label: 'Official Receipt', done: selectedClaim?.status === 'RETURNED' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Ownership Verification &amp; Secure Handover
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Finder Verification Protocol</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verification of claim is permitted strictly by the finder after chatting with the claimant, followed by PIN verification and physical handover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('map')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>View Campus Landmarks</span>
          </button>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active Claims Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When potential matches are detected between reported lost and found items, submit an ownership claim to initiate private verification and secure handover.
          </p>
          <button
            onClick={() => setCurrentTab('matches')}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Explore AI Matches
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Claims List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>ACTIVE CASES ({claims.length})</span>
              <span>Select case</span>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {claims.map((claim) => {
                const isSelected = selectedClaim?.id === claim.id;
                const claimIsFinder = user?.id === claim.finderId;
                return (
                  <button
                    key={claim.id}
                    onClick={() => {
                      setSelectedClaim(claim);
                      setMeetingLocationInput(claim.meetingLocation || 'Admin Block');
                      setSelectedHandoverSpot(claim.handoverLocation || claim.meetingLocation || 'Admin Block');
                      setActionError(null);
                      setHandoverError(null);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-indigo-600 truncate">
                        {claim.foundItemTitle}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          claim.status === 'RETURNED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'VERIFIED'
                            ? 'bg-blue-100 text-blue-800'
                            : claim.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      Claimant: <span className="font-semibold">{claim.claimantName}</span>
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{claim.handoverLocation || claim.meetingLocation || 'Admin Block'}</span>
                      </span>
                      {claimIsFinder ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          You are Finder
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>Chat with Finder</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Claim Detail & Handover Workflow */}
          {selectedClaim && (
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedClaim.foundItemTitle}</h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedClaim.status === 'RETURNED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedClaim.status === 'VERIFIED'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedClaim.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedClaim.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Case #{selectedClaim.id} · Submitted on {new Date(selectedClaim.createdAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={handleOpenChatWithClaimant}
                  className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with {isFinder ? 'Claimant (Loser)' : 'Finder'}</span>
                </button>
              </div>

              {actionError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* 8-Step Progress Workflow */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Verification &amp; Handover Progression
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {workflowSteps.map((s) => (
                    <div
                      key={s.num}
                      className={`p-2 rounded-lg text-center transition-all ${
                        s.done
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold'
                          : 'bg-slate-50 border border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-[10px]">Step {s.num}</div>
                      <div className="text-[10px] font-medium truncate mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participants Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    Claimant (Loser / Owner)
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">{selectedClaim.claimantName}</p>
                  <p className="text-slate-500">{selectedClaim.claimantEmail}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    Finder (Current Custodian)
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">{selectedClaim.finderName}</p>
                  <p className="text-slate-500">{selectedClaim.finderEmail}</p>
                </div>
              </div>

              {/* Private Ownership Verification Q&A */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Private Ownership Verification Q&amp;A</span>
                  </h3>
                  <span className="text-[11px] text-slate-600">Cross-examine these answers during chat</span>
                </div>

                <div className="space-y-2.5">
                  {selectedClaim.verificationAnswers.map((qa, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{qa.question}</span>
                      </p>
                      <p className="pl-5 text-slate-700 font-medium bg-white p-2 rounded-lg border border-slate-200">
                        "{qa.answer}"
                      </p>
                    </div>
                  ))}

                  {selectedClaim.proofNotes && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                      <span className="font-bold text-indigo-900">Claimant Notes: </span>
                      <span className="text-slate-700">{selectedClaim.proofNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: FINDER VERIFICATION GATEWAY (ONLY FINDER CAN VERIFY AFTER CHATTING WITH LOSER) */}
              {selectedClaim.status === 'PENDING' && (
                <div>
                  {!isFinder ? (
                    /* Claimant / Non-finder view: Direct chat access with Finder */
                    <div className="p-5 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 rounded-2xl border-2 border-indigo-200 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-950">
                          <MessageSquare className="w-5 h-5 text-indigo-600" />
                          <span className="font-bold text-sm">Direct Access to Chat with Finder ({selectedClaim.finderName})</span>
                        </div>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          Direct Communication Open
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        You requested a claim for this item. You can chat with the finder (<strong>{selectedClaim.finderName}</strong>) right now to describe unique marks, answer verification questions, and coordinate your secure handover at MVGR campus!
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          onClick={handleOpenChatWithClaimant}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 text-xs"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat with Finder ({selectedClaim.finderName}) Now</span>
                        </button>
                        <button
                          onClick={() => setCurrentTab('messages')}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors text-xs flex items-center gap-1.5"
                        >
                          <span>Open in Full Messages Center</span>
                        </button>
                      </div>
                    </div>
                  ) : !selectedClaim.chattedWithClaimant ? (
                    /* Finder view, but has NOT chatted with claimant (loser) yet */
                    <div className="p-5 bg-amber-50/90 rounded-2xl border-2 border-amber-300 space-y-4">
                      <div className="flex items-center gap-2 text-amber-950">
                        <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm">Step 1: Chat with Claimant (Loser) Required</h4>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Before verifying this claim, you must chat with the claimant (<strong>{selectedClaim.claimantName}</strong>) to confirm unique details and verify true ownership.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                        <p className="font-semibold">Questions to ask the claimant in chat:</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                          <li>Ask about identifying marks, stickers, or scratches not visible in public photos.</li>
                          <li>Confirm what was inside the pockets or bag.</li>
                          <li>Confirm exact location on campus (DE Block, CSE Block, Canteen, Admin Block, etc.).</li>
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          onClick={handleOpenChatWithClaimant}
                          disabled={isUpdating}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat with Claimant ({selectedClaim.claimantName}) Now</span>
                        </button>

                        <button
                          disabled
                          className="px-4 py-2.5 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-1.5"
                          title="Chat with claimant first"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Verify Ownership (Locked)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Finder view: Chat is completed -> Can now verify and proceed to next steps! */
                    <div className="p-5 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                        <div className="flex items-center gap-2 text-emerald-950">
                          <Unlock className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm">Step 2: Finder Ownership Verification &amp; Checkpoint</h4>
                            <p className="text-xs text-emerald-800">
                              Chat completed with claimant ({selectedClaim.claimantName}). Assign a campus checkpoint to approve the claim and proceed to physical handover.
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] bg-emerald-200 text-emerald-900 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Chat Verified</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Campus Handover Checkpoint
                          </label>
                          <select
                            value={meetingLocationInput}
                            onChange={(e) => setMeetingLocationInput(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
                          >
                            {CAMPUS_LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.name}>
                                {loc.name} ({loc.zone})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Finder Verification Notes
                          </label>
                          <input
                            type="text"
                            value={adminNotesInput}
                            onChange={(e) => setAdminNotesInput(e.target.value)}
                            placeholder="e.g. Claimant confirmed specific scratches in chat"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateStatus('VERIFIED')}
                          disabled={isUpdating}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Verify Ownership &amp; Proceed to Handover PIN</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus('REJECTED')}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors"
                        >
                          Reject Claim
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECURE HANDOVER VERIFICATION MODULE (NEXT STEPS AFTER VERIFICATION) */}
              {(selectedClaim.status === 'VERIFIED' || selectedClaim.status === 'HANDOVER_PENDING') && (
                <div className="p-6 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 rounded-2xl border-2 border-indigo-200 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">
                          Secure Campus Handover Verification Protocol
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Designated Meeting Checkpoint: <strong>{selectedClaim.meetingLocation || selectedClaim.handoverLocation || 'Admin Block'}</strong>.
                      </p>
                    </div>

                    <span className="text-[11px] px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg shadow-2xs">
                      Handover In Progress
                    </span>
                  </div>

                  {/* Claimant View: Handover Pass with PIN */}
                  {isClaimant && (
                    <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Your Secure Handover Pass
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Bring your student/staff ID card to <strong>{selectedClaim.meetingLocation || 'Admin Block'}</strong>. When receiving your item, present this 6-digit Handover PIN to the Finder (<strong>{selectedClaim.finderName}</strong>) to authorize the final return:
                      </p>

                      <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-xl">
                        <div className="flex-1 font-mono font-black text-2xl sm:text-3xl tracking-widest text-emerald-400">
                          {selectedClaim.handoverCode || '729104'}
                        </div>
                        <button
                          onClick={() => copyPinToClipboard(selectedClaim.handoverCode || '729104')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          {copiedPin ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Do not share this PIN until you have physically inspected your item and confirmed its condition.
                      </p>

                      <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Need to coordinate your arrival?</span>
                        <button
                          onClick={handleOpenChatWithClaimant}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Finder ({selectedClaim.finderName})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Finder / Staff Handover Verification Form */}
                  {(isFinder || isStaffOrAdmin) && (
                    <form onSubmit={handleSecureHandoverVerify} className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Finder Final Handover PIN Entry</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">Dual-verification required</span>
                      </div>

                      {handoverError && (
                        <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{handoverError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Campus Handover Spot
                          </label>
                          <select
                            value={selectedHandoverSpot}
                            onChange={(e) => setSelectedHandoverSpot(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            {CAMPUS_LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.name}>
                                {loc.name} ({loc.description})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Witness Role / Checkpoint Desk
                          </label>
                          <select
                            value={witnessRole}
                            onChange={(e) => setWitnessRole(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="Campus Security Desk">Main Gate Security Desk</option>
                            <option value="Admin Block Helpdesk">Admin Block Central Helpdesk</option>
                            <option value="Department Coordinator">Department Staff Coordinator</option>
                            <option value="Direct Peer Witness">Direct Peer Student Witness</option>
                          </select>
                        </div>
                      </div>

                      {/* 3-Point Security Checklist */}
                      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                          Mandatory Handover Verification Checklist
                        </span>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.idVerified}
                            onChange={(e) => setChecklist({ ...checklist, idVerified: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-800">
                            Verified Claimant's Student/Staff ID Card &amp; Roll Number
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.itemVerified}
                            onChange={(e) => setChecklist({ ...checklist, itemVerified: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-800">
                            Confirmed physical identifying features &amp; ownership answers match item
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.conditionConfirmed}
                            onChange={(e) => setChecklist({ ...checklist, conditionConfirmed: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-800">
                            Claimant inspected and accepted physical condition of returned property
                          </span>
                        </label>
                      </div>

                      {/* PIN Entry */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Enter Claimant's 6-Digit Handover PIN <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="e.g. 729104"
                            value={enteredHandoverPin}
                            onChange={(e) => setEnteredHandoverPin(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-4 py-2 font-mono text-base font-bold tracking-widest border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>{isUpdating ? 'Verifying...' : 'Verify Handover'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          The claimant can view this PIN on their active claims screen.
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* OFFICIAL RETURN RECEIPT & CERTIFICATE */}
              {selectedClaim.status === 'RETURNED' && (
                <div className="p-6 bg-white rounded-2xl border-2 border-emerald-500/80 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Official Campus Property Handover Receipt
                        </h3>
                        <p className="text-xs text-slate-500">
                          Receipt #{selectedClaim.handoverReceiptId || `REC-MVGR-${selectedClaim.id.slice(-6)}`} · MVGR Campus Recover
                        </p>
                      </div>
                    </div>

                    <span className="self-start sm:self-auto text-xs px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>VERIFIED &amp; RETURNED</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 bg-slate-50 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-600 font-semibold uppercase block">Handover Location</span>
                      <span className="font-bold text-slate-900">{selectedClaim.handoverLocation || selectedClaim.meetingLocation || 'Admin Block'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-600 font-semibold uppercase block">Returned Date &amp; Time</span>
                      <span className="font-bold text-slate-900">
                        {selectedClaim.returnedAt ? new Date(selectedClaim.returnedAt).toLocaleString() : 'Verified Today'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-600 font-semibold uppercase block">Verified Claimant</span>
                      <span className="font-bold text-slate-900">{selectedClaim.claimantName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-600 font-semibold uppercase block">Verified Witness / Staff</span>
                      <span className="font-bold text-slate-900">{selectedClaim.handoverWitness || 'Campus Security'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Cryptographic Handover PIN verified successfully. Case officially resolved and archived.</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* QUICK CHAT MODAL */}
      {quickChatOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Chat with {isFinder ? `${selectedClaim.claimantName} (Claimant/Loser)` : `${selectedClaim.finderName} (Finder)`}
                </h3>
                <p className="text-xs text-indigo-100 truncate mt-0.5">
                  Item: {selectedClaim.foundItemTitle}
                </p>
              </div>
              <button
                onClick={() => setQuickChatOpen(false)}
                className="w-8 h-8 rounded-lg bg-indigo-700/60 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 min-h-[250px] max-h-[400px]">
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 text-center">
                🔐 Confidential Verification Chat. Confirm identifying features before approving handover.
              </div>

              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No messages yet. Send a greeting or ask verification questions below!
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500 mb-0.5">{m.senderName}</span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type your verification message..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSendingMessage || !newMessageText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
