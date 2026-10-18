import React from 'react';
import {
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  Package,
  Search,
  FileCheck2,
  Bell,
  User,
  Shield,
  GitFork,
  LogOut,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';

export type NavigationTab =
  | 'landing'
  | 'dashboard'
  | 'report-lost'
  | 'report-found'
  | 'my-items'
  | 'search-match'
  | 'my-claims'
  | 'notifications'
  | 'profile'
  | 'admin'
  | 'workflow';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  unreadCount = 0,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();

  const navItems: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'report-lost', label: 'Report Lost', icon: AlertCircle, badge: 'Lost', badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
    { id: 'report-found', label: 'Report Found', icon: CheckCircle2, badge: 'Found', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
    { id: 'my-items', label: 'My Items', icon: Package },
    { id: 'search-match', label: 'Search & Match', icon: Search },
    { id: 'my-claims', label: 'My Claims', icon: FileCheck2 },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-teal-500 text-slate-950 font-bold',
    },
    { id: 'workflow', label: 'System Workflow', icon: GitFork },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Module',
      icon: Shield,
      badge: 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    });
  }

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleLogout = async () => {
    try {
      await logout();
      onSelectTab('landing');
      onCloseMobile();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <button
            onClick={() => handleNavClick('landing')}
            className="text-left focus:outline-hidden"
          >
            <Logo variant="dark" size="sm" />
          </button>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Pill in Sidebar */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {userProfile?.fullName || 'Campus User'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isAdmin ? '🛡️ Administrator' : userProfile?.department || 'Student Reporter'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Campus Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor || 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <button
            onClick={() => handleNavClick('landing')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <span>Public Campus Portal</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
