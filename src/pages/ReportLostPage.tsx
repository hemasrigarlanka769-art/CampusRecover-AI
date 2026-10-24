import React, { useState } from 'react';
import {
  Upload,
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Building,
  Info,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { AIMatch } from '../types/index.js';

interface ReportLostPageProps {
  setCurrentTab: (tab: string) => void;
  onItemReported: () => void;
  onSelectMatch: (matchId: string) => void;
}

export const ReportLostPage: React.FC<ReportLostPageProps> = ({
  setCurrentTab,
  onItemReported,
  onSelectMatch,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('Laptops');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('Black');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [identifyingMarks, setIdentifyingMarks] = useState('');
  const [serialNumberPrivate, setSerialNumberPrivate] = useState('');
  const [approximateValue, setApproximateValue] = useState('');
  const [dateLost, setDateLost] = useState(new Date().toISOString().split('T')[0]);
  const [timeLost, setTimeLost] = useState('14:00');
  const [building, setBuilding] = useState('MVGR College Main Gate & Security Post');
  const [room, setRoom] = useState('');
  const [campusArea, setCampusArea] = useState('East Entrance');
  const [contactPreference, setContactPreference] = useState('CampusRecover In-App Chat');
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
      // Step 1: Submitting
      setSubmissionStep('Analyzing your report details...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Comparing
      setSubmissionStep('Comparing descriptions and keywords...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Multimodal Vision
      setSubmissionStep('Analyzing image similarity & color histograms...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Proximity & Thresholding
      setSubmissionStep('Evaluating campus location proximity and dates...');

      const result = await api.createLostItem({
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
        location: building,
        building,
        room,
        campusArea,
        images,
        contactPreference,
      });

      setSubmissionStep('Match analysis complete!');
      setMatchResults({ matchCount: result.matchCount, matches: result.matches });
      onItemReported();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Report a Lost Item</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide as much detail as you remember. Our AI engine will immediately start searching the campus database for potential matches.
        </p>
      </div>

      {/* Submission Loading Progression Modal */}
      {isSubmitting && (
        <div className="p-6 bg-white rounded-2xl border border-indigo-100 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-900">AI Matching Engine Running</p>
              <p className="text-xs text-indigo-600 font-medium">{submissionStep}</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
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
                <h3 className="text-base font-bold text-emerald-950">Your lost item has been registered!</h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {matchResults.matchCount > 0
                    ? `AI Multimodal Engine discovered ${matchResults.matchCount} potential found match(es) on campus!`
                    : "No immediate matches found yet. We will automatically alert you the moment a matching item is turned in."}
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
                Immediate Top Matches:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchResults.matches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 truncate">{m.foundItem.itemName}</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {m.overallScore}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Found at: <span className="font-medium text-slate-700">{m.foundItem.building}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectMatch(m.id)}
                      className="mt-3 w-full py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View Match &amp; Claim</span>
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
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>1. Item Identification</span>
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
                  placeholder="e.g. Dell XPS 15 Laptop in Matte Sleeve"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include color nuances, stickers, scratches, zipper details, contents inside, or distinguishing markings..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Our semantic embedding model compares this description against reports filed in other words.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Dell, Apple, Nike"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. XPS 15 9520"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="e.g. Black, Navy, Silver"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material / Size</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Aluminum / 15-inch"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identifying Marks or Stickers
                </label>
                <input
                  type="text"
                  value={identifyingMarks}
                  onChange={(e) => setIdentifyingMarks(e.target.value)}
                  placeholder="e.g. HackCampus 2025 holographic sticker, orange pull cord"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span>Serial Number (Confidential)</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-normal">
                    Private
                  </span>
                </label>
                <input
                  type="text"
                  value={serialNumberPrivate}
                  onChange={(e) => setSerialNumberPrivate(e.target.value)}
                  placeholder="Kept strictly confidential for staff verification"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Campus Location & Date */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Lost Location &amp; Time
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Building <span className="text-rose-500">*</span>
                </label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                  Specific Room, Floor, or Area
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. 2nd Floor Quiet Section desk 14"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Lost <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approximate Time
                </label>
                <input
                  type="time"
                  value={timeLost}
                  onChange={(e) => setTimeLost(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Image Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Photo Upload (For AI Multimodal Vision Matching)
            </h3>

            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Drag and drop your photos here, or browse files
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Supports PNG, JPG, or WebP up to 5MB</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-3 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
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

          {/* Privacy Disclaimer */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Protection:</strong> Your private contact details and serial numbers are protected. Potential finders only see general descriptions necessary for verification.
            </span>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Submit Lost Report &amp; Start AI Match</span>
          </button>
        </form>
      )}
    </div>
  );
};
