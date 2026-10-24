import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Filter, Layers, RefreshCw } from 'lucide-react';
import { AIMatch } from '../types/index.js';

interface MatchesListPageProps {
  matches: AIMatch[];
  onSelectMatch: (matchId: string) => void;
  onTriggerScan: () => Promise<void>;
}

export const MatchesListPage: React.FC<MatchesListPageProps> = ({
  matches,
  onSelectMatch,
  onTriggerScan,
}) => {
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState(false);

  const filtered = matches.filter((m) => {
    if (filterClass !== 'ALL' && m.classification !== filterClass) return false;
    return true;
  });

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await onTriggerScan();
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Matching Center</h1>
            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
              {matches.length} Total Matches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Multimodal comparisons correlating verbal descriptions, photos, and campus building proximities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterClass('ALL')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterClass === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterClass('VERY_HIGH')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterClass === 'VERY_HIGH' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Very High (&ge;90%)
            </button>
            <button
              onClick={() => setFilterClass('HIGH')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterClass === 'HIGH' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              High (75-89%)
            </button>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Re-Scan'}</span>
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No matches found in this category</h3>
          <p className="text-xs text-slate-500">Try switching the filter or report a new item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        match.overallScore >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {match.classification.replace('_', ' ')}
                    </span>
                    {match.isFlaggedIncorrect && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                        Flagged
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                    {match.overallScore}%
                  </span>
                </div>

                {/* Comparison preview */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Lost Item
                    </span>
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-200">
                      {match.lostItem.images && match.lostItem.images.length > 0 ? (
                        <img
                          src={match.lostItem.images[0]}
                          alt="Lost"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          No photo
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {match.lostItem.itemName}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">{match.lostItem.building}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Found Item
                    </span>
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-200">
                      {match.foundItem.images && match.foundItem.images.length > 0 ? (
                        <img
                          src={match.foundItem.images[0]}
                          alt="Found"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          No photo
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {match.foundItem.itemName}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">{match.foundItem.building}</p>
                  </div>
                </div>

                {/* Score Factor Chips */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-600 block">Image</span>
                    <span className="font-bold text-slate-900">{match.imageSimilarity}%</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-600 block">Text</span>
                    <span className="font-bold text-slate-900">{match.textSimilarity}%</span>
                  </div>
                  <div className="bg-slate-50 p-1 rounded border border-slate-100">
                    <span className="text-slate-600 block">Location</span>
                    <span className="font-bold text-slate-900">{match.locationSimilarity}%</span>
                  </div>
                </div>

                {/* Top Justification */}
                {match.reasons.length > 0 && (
                  <p className="mt-3 text-xs text-slate-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{match.reasons[0]}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectMatch(match.id)}
                  className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Examine Match Factors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
