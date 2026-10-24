import React, { useState } from 'react';
import {
  Upload,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { AIMatch } from '../types/index.js';

interface ReportFoundPageProps {
  setCurrentTab: (tab: string) => void;
  onItemReported: () => void;
  onSelectMatch: (matchId: string) => void;
}

export const ReportFoundPage: React.FC<ReportFoundPageProps> = ({
  setCurrentTab,
  onItemReported,
  onSelectMatch,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('Black');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [identifyingFeatures, setIdentifyingFeatures] = useState('');
  const [sensitiveNotesPrivate, setSensitiveNotesPrivate] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().split('T')[0]);
  const [timeFound, setTimeFound] = useState('15:00');
  const [building, setBuilding] = useState('MVGR College Main Gate & Security Post');
  const [room, setRoom] = useState('');
  const [campusArea, setCampusArea] = useState('East Entrance');
  const [internalOfficeStorage, setInternalOfficeStorage] = useState('Security Post Main Gate Vault');
  const [images, setImages] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<{ matchCount: number; matches: AIMatch[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Electronics',
    'Bags & Luggage',
    'Personal Accessories',
    'Clothing & Footwear',
    'Documents & IDs',
    'Keys & Cards',
    'Books & Stationery',
    'Other',
  ];

  const campusBuildings = [
    'DE Block',
    'CSE Block',
    'IT Block',
    'Civil Block',
    'Canteen',
    'Fresh Chill',
    'Bakers Corner',
    'Central Park',
    'Admin Block',
    'Bank',
    'Stationary',
    'Main Gate & Security Post',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImages((prev) => [...prev, String(uploadEvent.target?.result)]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      setSubmissionStep('Registering found item details...');
      await new Promise((r) => setTimeout(r, 600));

      setSubmissionStep('Searching active campus lost reports...');
      await new Promise((r) => setTimeout(r, 600));

      setSubmissionStep('Comparing descriptions & multimodal features...');

      const result = await api.createFoundItem({
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
        locationFound: building,
        building,
        room,
        campusArea,
        images,
        internalOfficeStorage,
      });

      setSubmissionStep('Found report processed & matched!');
      setMatchResults({ matchCount: result.matchCount, matches: result.matches });
      onItemReported();
    } catch (err: any) {
      setError(err.message || 'Failed to submit found report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Found Property Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Report a Found Item</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Thank you for turning in a lost item. Our AI automatically scans current lost item cases to find and notify the rightful owner.
        </p>
      </div>

      {/* Submission Loading */}
      {isSubmitting && (
        <div className="p-6 bg-white rounded-2xl border border-emerald-100 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-900">Scanning Lost Database</p>
              <p className="text-xs text-emerald-600 font-medium">{submissionStep}</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Match Results Banner on Success */}
      {matchResults && (
        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-emerald-950">Found report successfully registered!</h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {matchResults.matchCount > 0
                    ? `Great news! We found ${matchResults.matchCount} registered lost report(s) matching this item.`
                    : "Your report is saved. If an owner files a matching lost report, the system will immediately notify both of you."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Go to Dashboard
            </button>
          </div>

          {matchResults.matches.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-emerald-200/80">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Matching Potential Owners:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchResults.matches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 truncate">{m.lostItem.itemName}</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {m.overallScore}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Reported lost by:{' '}
                        <span className="font-medium text-slate-700">{m.lostItem.userName}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectMatch(m.id)}
                      className="mt-3 w-full py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Review Match Case</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      {!matchResults && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Found Item Characteristics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Black Commuter Backpack, Hydro Flask bottle"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Public Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe visible aspects (color, brand, general condition). Note: do NOT write sensitive personal details (e.g. credit card numbers or ID numbers) here."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. The North Face"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Size</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Recon Daypack"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Color <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Black"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Ballistic Nylon"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Critical Privacy Field: Sensitive Verification Details */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
              <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Confidential Verification Details (Hidden from Public Search)</span>
              </label>
              <textarea
                rows={2}
                value={sensitiveNotesPrivate}
                onChange={(e) => setSensitiveNotesPrivate(e.target.value)}
                placeholder="Example: Student ID card name in wallet, specific courses listed in notebook, lock screen initials. Kept private to verify potential owners."
                className="w-full px-3 py-1.5 text-xs border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Anti-Fraud Rule:</strong> This information will NEVER be displayed publicly. When a student claims the item, staff/finder will compare their private answers against these notes.
              </p>
            </div>
          </div>

          {/* Section 2: Found Location */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Where &amp; When Found
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Building <span className="text-rose-500">*</span>
                </label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {campusBuildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Room or Corridor
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Ground Floor West Lounge under bench"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Found <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateFound}
                  onChange={(e) => setDateFound(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Physical Storage Location
                </label>
                <input
                  type="text"
                  value={internalOfficeStorage}
                  onChange={(e) => setInternalOfficeStorage(e.target.value)}
                  placeholder="e.g. Turned into Library Desk / Kept in Bag"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photo Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Item Photo
            </h3>

            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Upload a clear photo of the found item
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-3 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-100">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Submit Found Report &amp; Match Owners</span>
          </button>
        </form>
      )}
    </div>
  );
};
