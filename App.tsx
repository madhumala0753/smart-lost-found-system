/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { testConnection } from './services/firebase';
import { subscribeToAllItems } from './services/itemService';
import {
  subscribeToClaimsByClaimant,
  subscribeToClaimsForOwner,
  subscribeToAllClaims,
} from './services/claimService';
import { subscribeToUserNotifications } from './services/notificationService';
import { seedInitialCampusItemsIfEmpty } from './services/seedService';
import { ItemReport, ClaimRequest, AppNotification } from './types';

// Components & Navigation
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { ClaimModal } from './components/ClaimModal';
import { AuthModal } from './components/AuthModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { SearchMatchPage } from './pages/SearchMatchPage';
import { MyItemsPage } from './pages/MyItemsPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { WorkflowPage } from './pages/WorkflowPage';

function CampusVaultMain() {
  const { currentUser, userProfile, isAdmin, loading: authLoading } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('landing');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals State
  const [activeItemDetails, setActiveItemDetails] = useState<ItemReport | null>(null);
  const [activeClaimItem, setActiveClaimItem] = useState<ItemReport | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Search parameters pass-through
  const [searchQueryParam, setSearchQueryParam] = useState('');
  const [searchCategoryParam, setSearchCategoryParam] = useState('All');

  // Database Data States
  const [items, setItems] = useState<ItemReport[]>([]);
  const [userClaims, setUserClaims] = useState<ClaimRequest[]>([]);
  const [allAdminClaims, setAllAdminClaims] = useState<ClaimRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dbConnected, setDbConnected] = useState(true);

  // 1. Test Firestore connection on boot & seed if empty
  useEffect(() => {
    testConnection().then((ok) => {
      setDbConnected(ok);
      if (ok) {
        seedInitialCampusItemsIfEmpty().catch((err) => {
          console.warn('Initial seeding note:', err);
        });
      }
    });
  }, []);

  // 2. Subscribe to All Items
  useEffect(() => {
    const unsubscribe = subscribeToAllItems(
      (newItems) => setItems(newItems),
      (err) => console.warn('Items stream error:', err)
    );
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Claims
  useEffect(() => {
    if (!currentUser) {
      setUserClaims([]);
      setAllAdminClaims([]);
      return;
    }

    // Subscribe to claims filed by current user
    const unsubClaimant = subscribeToClaimsByClaimant(currentUser.uid, (claims) => {
      setUserClaims(claims);
    });

    // If admin, also subscribe to all claims
    let unsubAdmin = () => {};
    if (isAdmin) {
      unsubAdmin = subscribeToAllClaims((claims) => {
        setAllAdminClaims(claims);
      });
    }

    return () => {
      unsubClaimant();
      unsubAdmin();
    };
  }, [currentUser, isAdmin]);

  // 4. Subscribe to Notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const unsubNotifs = subscribeToUserNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubNotifs();
  }, [currentUser]);

  // Protected route enforcement
  const handleSelectTab = (tab: NavigationTab) => {
    const protectedTabs: NavigationTab[] = [
      'dashboard',
      'report-lost',
      'report-found',
      'my-items',
      'my-claims',
      'notifications',
      'profile',
      'admin',
    ];

    if (protectedTabs.includes(tab) && !currentUser && !authLoading) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (tab === 'admin' && !isAdmin) {
      alert('Access restricted to Campus Administrators.');
      return;
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleClaimItem = (item: ItemReport) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    setActiveClaimItem(item);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Sidebar for authenticated dashboard layouts */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        unreadCount={unreadNotifsCount}
      />

      {/* Main Content Area (offset left on desktop when sidebar active) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          unreadCount={unreadNotifsCount}
        />

        {/* Viewport Content Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'landing' && (
            <LandingPage
              items={items}
              onSelectTab={handleSelectTab}
              onOpenAuth={handleOpenAuth}
              onViewItem={(item) => setActiveItemDetails(item)}
              onClaimItem={handleClaimItem}
              onSearchQuery={(q, cat) => {
                setSearchQueryParam(q);
                if (cat) setSearchCategoryParam(cat);
              }}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              items={items}
              userClaims={userClaims}
              onSelectTab={handleSelectTab}
              onViewItem={(item) => setActiveItemDetails(item)}
            />
          )}

          {(currentTab === 'report-lost' || currentTab === 'report-found') && (
            <ReportFormPage
              key={currentTab}
              initialType={currentTab === 'report-found' ? 'found' : 'lost'}
              onSuccess={(item) => {
                setItems((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
              }}
              onSelectTab={handleSelectTab}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {currentTab === 'search-match' && (
            <SearchMatchPage
              items={items}
              initialKeyword={searchQueryParam}
              initialCategory={searchCategoryParam}
              onViewItem={(item) => setActiveItemDetails(item)}
              onClaimItem={handleClaimItem}
            />
          )}

          {currentTab === 'my-items' && (
            <MyItemsPage
              items={items}
              allClaims={allAdminClaims.length > 0 ? allAdminClaims : userClaims}
              onViewItem={(item) => setActiveItemDetails(item)}
              onSelectTab={handleSelectTab}
            />
          )}

          {currentTab === 'my-claims' && (
            <MyClaimsPage
              claims={userClaims}
              items={items}
              onViewItem={(item) => setActiveItemDetails(item)}
              onSelectTab={handleSelectTab}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsPage
              notifications={notifications}
              items={items}
              onViewItem={(item) => setActiveItemDetails(item)}
            />
          )}

          {currentTab === 'profile' && <ProfilePage />}

          {currentTab === 'admin' && (
            <AdminPage
              items={items}
              claims={allAdminClaims.length > 0 ? allAdminClaims : userClaims}
              onViewItem={(item) => setActiveItemDetails(item)}
            />
          )}

          {currentTab === 'workflow' && (
            <WorkflowPage onSelectTab={handleSelectTab} />
          )}
        </main>
      </div>

      {/* Global Item Details Modal */}
      <ItemDetailsModal
        item={activeItemDetails}
        onClose={() => setActiveItemDetails(null)}
        onOpenClaimModal={(item) => {
          setActiveItemDetails(null);
          handleClaimItem(item);
        }}
        onItemUpdated={() => {
          // auto-refreshed via snapshot listener
        }}
      />

      {/* Global Claim Modal */}
      <ClaimModal
        item={activeClaimItem}
        onClose={() => setActiveClaimItem(null)}
        onClaimSubmitted={(claim) => {
          // Handled via snapshots
        }}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
        onSuccess={() => {
          // Re-navigate to user dashboard if landing was active
          if (currentTab === 'landing') {
            setCurrentTab('dashboard');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CampusVaultMain />
    </AuthProvider>
  );
}
