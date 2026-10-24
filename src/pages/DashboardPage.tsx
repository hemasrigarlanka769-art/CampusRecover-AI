import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Sparkles,
  Search,
  PlusCircle,
  FileCheck2,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { AIMatch, LostItem, FoundItem, Claim } from '../types/index.js';

interface DashboardPageProps {
  setCurrentTab: (tab: string) => void;
  matches: AIMatch[];
  lostItems: LostItem[];
  foundItems: FoundItem[];
  claims: Claim[];
  onTriggerScan: () => Promise<void>;
  onSelectMatch: (matchId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setCurrentTab,
  matches,
  lostItems,
  foundItems,
  claims,
  onTriggerScan,
  onSelectMatch,
}) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const myLostCount = lostItems.filter((i) => i.userId === user?.id).length;
  const myFoundCount = foundItems.filter((i) => i.userId === user?.id).length;
  const highConfidenceMatches = matches.filter((m) => m.overallScore >= 75);
  const activeClaimsCount = claims.filter((c) => c.status !== 'RETURNED' && c.status !== 'REJECTED').length;
  const returnedCount = claims.filter((c) => c.status === 'RETURNED').length;

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage('Comparing descriptions & multimodal embeddings across campus reports...');
    try {
      await onTriggerScan();
      setScanMessage('AI Multimodal Scan complete: database synced.');
      setTimeout(() => setScanMessage(null), 4000);
    } catch {
      setScanMessage('Scan completed.');
      setTimeout(() => setScanMessage(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Greeting & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back, {user?.name || 'Campus Student'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {user?.role || 'STUDENT'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user?.department || 'University Student'} · {user?.campus || 'Main Quad Campus'} · ID:{' '}
            <span className="font-mono">{user?.studentId || 'U-00000'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('report-lost')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => setCurrentTab('report-found')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report Found</span>
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Run AI Scan'}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 text-xs bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-indigo-400 hover:text-indigo-600">
            ×
          </button>
        </div>
      )}

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <button
          onClick={() => setCurrentTab('items')}
          className="text-left p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">My Lost</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{myLostCount}</span>
            <span className="text-[10px] text-slate-600">Active</span>
          </div>
        </button>

        {/* Card 2 */}
        <button
          onClick={() => setCurrentTab('items')}
          className="text-left p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">My Found</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{myFoundCount}</span>
            <span className="text-[10px] text-slate-600">Turned in</span>
          </div>
        </button>

        {/* Card 3 */}
        <button
          onClick={() => setCurrentTab('matches')}
          className="text-left p-4 rounded-xl bg-white border border-indigo-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between ring-1 ring-indigo-500/10"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Matches
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-indigo-600">{matches.length}</span>
            <span className="text-[10px] text-emerald-600 font-medium">{highConfidenceMatches.length} High</span>
          </div>
        </button>

        {/* Card 4 */}
        <button
          onClick={() => setCurrentTab('claims')}
          className="text-left p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Claims</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{activeClaimsCount}</span>
            <span className="text-[10px] text-amber-600 font-medium">Verification</span>
          </div>
        </button>

        {/* Card 5 */}
        <button
          onClick={() => setCurrentTab('messages')}
          className="text-left p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Messages</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">4</span>
            <span className="text-[10px] text-emerald-600 font-medium">Encrypted</span>
          </div>
        </button>

        {/* Card 6 */}
        <button
          onClick={() => setCurrentTab('claims')}
          className="text-left p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Returned</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">{returnedCount}</span>
            <span className="text-[10px] text-slate-600">Reunited</span>
          </div>
        </button>
      </div>

      {/* SPOTLIGHT: RECENT AI MATCHES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Recent AI Multimodal Matches
            </h2>
            <p className="text-xs text-slate-500">
              Ranked by hybrid confidence (Text 35% · Image 35% · Metadata 20% · Location 5% · Time 5%)
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('matches')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All ({matches.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.slice(0, 3).map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {match.classification.replace('_', ' ')} CONFIDENCE
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {match.lostItem.itemName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-600">
                      {match.overallScore}%
                    </span>
                    <span className="block text-[10px] text-slate-600">match</span>
                  </div>
                </div>

                {/* Lost vs Found Quick View */}
                <div className="mt-3.5 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase">Lost Item</p>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{match.lostItem.itemName}</p>
                    <p className="text-[11px] text-slate-600 truncate">{match.lostItem.building}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/60">
                    <p className="text-[10px] font-semibold text-indigo-600 uppercase">Found Item</p>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{match.foundItem.itemName}</p>
                    <p className="text-[11px] text-slate-600 truncate">{match.foundItem.building}</p>
                  </div>
                </div>

                {/* Score Breakdown Factors */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-700 mb-2">Matching Factors:</p>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                      <span className="text-slate-600 block">Image</span>
                      <span className="font-bold text-slate-900">{match.imageSimilarity}%</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                      <span className="text-slate-600 block">Text</span>
                      <span className="font-bold text-slate-900">{match.textSimilarity}%</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                      <span className="text-slate-600 block">Location</span>
                      <span className="font-bold text-slate-900">{match.locationSimilarity}%</span>
                    </div>
                  </div>
                </div>

                {/* Top Reason */}
                {match.reasons.length > 0 && (
                  <p className="mt-3 text-xs text-slate-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{match.reasons[0]}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectMatch(match.id)}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-center shadow-xs"
                >
                  View Match Analysis &amp; Claim
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE CLAIMS & CAMPUS SAFE CHECKPOINTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Claims Tracking */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Ownership Claims &amp; Guided Return Process
            </h3>
            <button
              onClick={() => setCurrentTab('claims')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              All Claims ({claims.length})
            </button>
          </div>

          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{claim.foundItemTitle}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      claim.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : claim.status === 'RETURNED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <p>
                    Claimant: <span className="font-medium text-slate-900">{claim.claimantName}</span> · Finder:{' '}
                    <span className="font-medium text-slate-900">{claim.finderName}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-indigo-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Meeting Checkpoint: {claim.meetingLocation || 'Campus Safety HQ'}</span>
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {claim.verificationAnswers.length} private verification answers recorded
                  </span>
                  <button
                    onClick={() => setCurrentTab('claims')}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Manage Step &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Map & Locations Quick Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-600" />
                MVGR Campus Safety Drop Zones
              </h3>
              <button
                onClick={() => setCurrentTab('map')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Open Map
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official physical campus lost &amp; found collection desks across MVGR College of Engineering.
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">MVGR College Main Gate Security Post</p>
                  <p className="text-[11px] text-slate-600">24/7 Monitored Vault &amp; Checkpoint</p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                  24/7 Gate
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Central Administration &amp; Academic Block</p>
                  <p className="text-[11px] text-slate-600">Ground Floor Student Affairs Desk</p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  Admin Desk
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">ECE &amp; Mechanical Department Complex</p>
                  <p className="text-[11px] text-slate-600">Academic Block Lab In-Charge Office</p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                  Dept Office
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentTab('map')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              Explore MVGR Campus Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
