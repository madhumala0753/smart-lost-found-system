import React, { useState } from 'react';
import {
  Menu,
  Bell,
  PlusCircle,
  AlertTriangle,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMobile: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobile,
  unreadCount = 0,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const getPageTitle = (tab: NavigationTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return { title: 'User Dashboard', subtitle: 'Overview of campus lost & found activity' };
      case 'report-lost':
        return { title: 'Report Lost Item', subtitle: 'Submit detailed description to alert the campus community' };
      case 'report-found':
        return { title: 'Report Found Item', subtitle: 'Log a retrieved item so its rightful owner can claim it' };
      case 'my-items':
        return { title: 'My Reported Items', subtitle: 'Manage and update your active and resolved reports' };
      case 'search-match':
        return { title: 'Search & Match Engine', subtitle: 'Keyword filters and smart relevance calculation' };
      case 'my-claims':
        return { title: 'My Claim Requests', subtitle: 'Track review status of your ownership verification claims' };
      case 'notifications':
        return { title: 'Campus Notifications', subtitle: 'Alerts on item matches, claim decisions, and updates' };
      case 'profile':
        return { title: 'Student & Staff Profile', subtitle: 'Your campus credentials and contact preferences' };
      case 'admin':
        return { title: 'Administrator Control Center', subtitle: 'Manage all reports, claims, users, and audit records' };
      case 'workflow':
        return { title: 'System Architecture & Workflow', subtitle: 'Visual diagram of the CampusVault verification cycle' };
      default:
        return { title: 'CampusVault', subtitle: 'Smart Lost and Found System' };
    }
  };

  const { title, subtitle } = getPageTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small logo for mobile */}
        <div className="lg:hidden">
          <Logo size="sm" />
        </div>

        {/* Page Title & Subtitle for Desktop */}
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Report Buttons in Header (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-2 mr-2">
          <button
            onClick={() => onSelectTab('report-lost')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => onSelectTab('report-found')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Report Found</span>
          </button>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => onSelectTab('notifications')}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Campus Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden xl:block text-xs leading-tight">
              <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                {userProfile?.fullName || 'Account'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {isAdmin ? 'Admin' : 'Student'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-40 animate-in fade-in-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-900">
                    {userProfile?.fullName || 'Campus Member'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {userProfile?.email}
                  </div>
                  {isAdmin && (
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                      <ShieldCheck className="w-3 h-3" />
                      Administrator
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onSelectTab('profile');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('my-items');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-400" />
                    <span>My Items & Reports</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        onSelectTab('admin');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 transition-colors text-left font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={async () => {
                      setProfileOpen(false);
                      await logout();
                      onSelectTab('landing');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
