import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldCheck,
  PlusCircle,
  Sparkles,
  MapPin,
  MessageSquare,
  FileCheck2,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadNotifsCount: number;
  unreadMsgsCount: number;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  unreadNotifsCount,
  unreadMsgsCount,
  onOpenNotifications,
}) => {
  const { user, logout, openLoginModal } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentTab(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                campus<span className="text-indigo-600 font-extrabold">Recover</span>
              </span>
            </button>
          </div>

          {/* Navigation Links - Only visible when logged in */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'dashboard'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setCurrentTab('items')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'items'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Browse Items
              </button>

              <button
                onClick={() => setCurrentTab('matches')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'matches'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Matches
              </button>

              <button
                onClick={() => setCurrentTab('map')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'map'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Campus Map
              </button>

              <button
                onClick={() => setCurrentTab('claims')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'claims'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Claims
              </button>

              <button
                onClick={() => setCurrentTab('messages')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'messages'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Messages
              </button>

              {(user.role === 'ADMIN' || user.role === 'CAMPUS_STAFF') && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    currentTab === 'admin'
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Admin
                </button>
              )}
            </nav>
          ) : null}

          {/* Right Action Area */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => setCurrentTab('report-lost')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report Item</span>
                </button>

                <button
                  onClick={onOpenNotifications}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>

                  {profileMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs"
                      onMouseLeave={() => setProfileMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        My Profile
                      </button>

                      <button
                        onClick={async () => {
                          await logout();
                          setProfileMenuOpen(false);
                          setCurrentTab('landing');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-500 font-medium">
                MVGR Student &amp; Staff Portal
              </span>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
