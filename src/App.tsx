import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { NotificationsDrawer } from './components/NotificationsDrawer.js';
import { LandingPage } from './pages/LandingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ReportLostPage } from './pages/ReportLostPage.js';
import { ReportFoundPage } from './pages/ReportFoundPage.js';
import { ItemsExplorerPage } from './pages/ItemsExplorerPage.js';
import { MatchesListPage } from './pages/MatchesListPage.js';
import { MatchDetailPage } from './pages/MatchDetailPage.js';
import { CampusMapPage } from './pages/CampusMapPage.js';
import { MessagesPage } from './pages/MessagesPage.js';
import { ClaimsVerificationPage } from './pages/ClaimsVerificationPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { api } from './services/api.js';
import {
  LostItem,
  FoundItem,
  AIMatch,
  Claim,
  CampusBuilding,
  Notification,
} from './types/index.js';
import { ShieldCheck, Lock, Sparkles, ArrowRight, UserPlus, LogIn } from 'lucide-react';

function MainApp() {
  const { user, isLoading, openLoginModal, openRegisterModal } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [matches, setMatches] = useState<AIMatch[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifsDrawerOpen, setNotifsDrawerOpen] = useState(false);
  const [initialConvId, setInitialConvId] = useState<string | undefined>(undefined);

  // Sync user with backend session when logged in
  useEffect(() => {
    if (user) {
      api.syncFirebaseUser({
        uid: user.id,
        email: user.email,
        name: user.name,
        studentId: user.studentId,
        role: user.role,
        department: user.department,
        campus: user.campus,
      }).catch((e) => console.warn('Sync error:', e));

      setCurrentTab((prev) => (prev === 'landing' ? 'dashboard' : prev));
    }
  }, [user]);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    try {
      const [l, f, b] = await Promise.all([
        api.getLostItems(),
        api.getFoundItems(),
        api.getCampusBuildings(),
      ]);
      setLostItems(l);
      setFoundItems(f);
      setBuildings(b);

      if (user) {
        const [m, c, notifs] = await Promise.all([
          api.getMatches(),
          api.getClaims(),
          api.getNotifications(),
        ]);
        setMatches(m);
        setClaims(c);
        setNotifications(notifs);
      } else {
        setMatches([]);
        setClaims([]);
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching campus data:', err);
    }
  };

  const handleTriggerScan = async () => {
    await api.runMatching();
    await loadAllData();
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setCurrentTab('match-detail');
  };

  const handleNavigateFromNotification = (url: string) => {
    if (url.startsWith('/matches/')) {
      const matchId = url.replace('/matches/', '');
      setSelectedMatchId(matchId);
      setCurrentTab('match-detail');
    } else if (url === '/claims') {
      setCurrentTab('claims');
    } else if (url === '/messages') {
      setCurrentTab('messages');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadNotifsCount={unreadNotifsCount}
        unreadMsgsCount={0}
        onOpenNotifications={() => setNotifsDrawerOpen(true)}
      />

      {/* Main View Port Routing */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            setCurrentTab={(tab) => {
              if (!user && tab !== 'landing') {
                openLoginModal();
              } else {
                setCurrentTab(tab);
              }
            }}
            stats={{
              totalLost: lostItems.length,
              totalFound: foundItems.length,
              totalMatches: matches.length,
              itemsReturned: claims.filter((c) => c.status === 'RETURNED').length,
              totalUsers: user ? 1 : 0,
            }}
          />
        )}

        {/* ACCESS GATE: If not logged in and navigating to protected tabs */}
        {!user && currentTab !== 'landing' && (
          <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm border border-indigo-100">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                campusRecover Access Verification
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Campus Sign In Required
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                To safeguard student belongings, campus property, and private ownership verification questionnaires, please sign in with your verified campus account or register as a new member.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={openLoginModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Campus</span>
              </button>

              <button
                onClick={openRegisterModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Register New Account</span>
              </button>
            </div>

            <div>
              <button
                onClick={() => setCurrentTab('landing')}
                className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4"
              >
                ← Return to Home Overview
              </button>
            </div>
          </div>
        )}

        {/* PROTECTED TABS: Only accessible once user is logged in */}
        {user && currentTab === 'dashboard' && (
          <DashboardPage
            setCurrentTab={setCurrentTab}
            matches={matches}
            lostItems={lostItems}
            foundItems={foundItems}
            claims={claims}
            onTriggerScan={handleTriggerScan}
            onSelectMatch={handleSelectMatch}
          />
        )}

        {user && currentTab === 'report-lost' && (
          <ReportLostPage
            setCurrentTab={setCurrentTab}
            onItemReported={loadAllData}
            onSelectMatch={handleSelectMatch}
          />
        )}

        {user && currentTab === 'report-found' && (
          <ReportFoundPage
            setCurrentTab={setCurrentTab}
            onItemReported={loadAllData}
            onSelectMatch={handleSelectMatch}
          />
        )}

        {user && currentTab === 'items' && (
          <ItemsExplorerPage
            lostItems={lostItems}
            foundItems={foundItems}
            setCurrentTab={setCurrentTab}
          />
        )}

        {user && currentTab === 'matches' && (
          <MatchesListPage
            matches={matches}
            onSelectMatch={handleSelectMatch}
            onTriggerScan={handleTriggerScan}
          />
        )}

        {user && currentTab === 'match-detail' && selectedMatch && (
          <MatchDetailPage
            match={selectedMatch}
            onBack={() => setCurrentTab('matches')}
            onNavigateToMessages={(convId) => {
              if (convId) setInitialConvId(convId);
              setCurrentTab('messages');
            }}
            onClaimCreated={loadAllData}
          />
        )}

        {user && currentTab === 'map' && (
          <CampusMapPage
            buildings={buildings}
            lostItems={lostItems}
            foundItems={foundItems}
            setCurrentTab={setCurrentTab}
          />
        )}

        {user && currentTab === 'messages' && (
          <MessagesPage initialConversationId={initialConvId} />
        )}

        {user && currentTab === 'claims' && (
          <ClaimsVerificationPage
            claims={claims}
            onRefreshClaims={loadAllData}
            setCurrentTab={setCurrentTab}
          />
        )}

        {user && currentTab === 'admin' && <AdminDashboardPage />}

        {user && currentTab === 'profile' && (
          <ProfilePage
            lostCount={lostItems.filter((i) => i.userId === user?.id).length}
            foundCount={foundItems.filter((i) => i.userId === user?.id).length}
            returnedCount={claims.filter((c) => c.status === 'RETURNED').length}
          />
        )}
      </main>

      {/* Global Slide-over & Modals */}
      <NotificationsDrawer
        isOpen={notifsDrawerOpen}
        onClose={() => setNotifsDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigate={handleNavigateFromNotification}
      />

      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
