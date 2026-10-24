import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  Shield,
  Lock,
  Bell,
  Eye,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
} from 'lucide-react';

interface ProfilePageProps {
  lostCount: number;
  foundCount: number;
  returnedCount: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  lostCount,
  foundCount,
  returnedCount,
}) => {
  const { user } = useAuth();

  const [visibilityProfile, setVisibilityProfile] = useState(true);
  const [visibilityContact, setVisibilityContact] = useState(false);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyClaims, setNotifyClaims] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Mask student ID (e.g. U-88219 -> U-88***)
  const maskedId = user?.studentId
    ? `${user.studentId.slice(0, 4)}***`
    : 'U-00***';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
              <span>Campus ID: <strong className="font-mono">{maskedId}</strong></span>
              <span>·</span>
              <span>{user?.department}</span>
              <span>·</span>
              <span>{user?.campus}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">{lostCount}</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Lost Filed</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">{foundCount}</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Found Filed</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-600">{returnedCount}</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Returns</span>
          </div>
        </div>
      </div>

      {/* Privacy & Notification Settings */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Privacy &amp; Security Preferences</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure how your identity and notifications are handled across campus cases.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences updated and synced successfully.</span>
          </div>
        )}

        <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Private Ownership Answers</p>
              <p className="text-slate-500 text-[11px]">
                Always require finder or staff verification before sharing physical handover point.
              </p>
            </div>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
              ALWAYS ENFORCED
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Direct Contact Details Visibility</p>
              <p className="text-slate-500 text-[11px]">
                Keep personal phone number and personal email hidden (use in-app secure chat).
              </p>
            </div>
            <input
              type="checkbox"
              checked={!visibilityContact}
              onChange={() => setVisibilityContact(!visibilityContact)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Instant AI Match Push Notifications</p>
              <p className="text-slate-500 text-[11px]">
                Alert me immediately when a high-confidence match (&ge;75%) is detected.
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyMatches}
              onChange={() => setNotifyMatches(!notifyMatches)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Encrypted In-App Chat Alerts</p>
              <p className="text-slate-500 text-[11px]">
                Notify me when a matched owner or finder sends a message.
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyMessages}
              onChange={() => setNotifyMessages(!notifyMessages)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Campus Single Sign-On (SSO) 2FA</p>
              <p className="text-slate-500 text-[11px]">
                Enforce two-factor verification on university login credentials.
              </p>
            </div>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            Save Privacy Settings
          </button>
        </div>
      </form>
    </div>
  );
};
