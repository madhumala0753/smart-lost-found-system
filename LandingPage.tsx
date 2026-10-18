import React, { useState } from 'react';
import {
  Search,
  AlertTriangle,
  PlusCircle,
  ShieldCheck,
  Zap,
  BellRing,
  ArrowRight,
  MapPin,
  Sparkles,
  Database,
} from 'lucide-react';
import { ItemReport, ItemCategory } from '../types';
import { ItemCard } from '../components/ItemCard';
import { NavigationTab } from '../components/Sidebar';
import { seedInitialCampusItemsIfEmpty } from '../services/seedService';

interface LandingPageProps {
  items: ItemReport[];
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewItem: (item: ItemReport) => void;
  onClaimItem: (item: ItemReport) => void;
  onSearchQuery?: (query: string, category?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  items,
  onSelectTab,
  onOpenAuth,
  onViewItem,
  onClaimItem,
  onSearchQuery,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSeeding, setIsSeeding] = useState(false);

  // Live database stats
  const totalReports = items.length;
  const activeLost = items.filter((i) => i.reportType === 'lost' && i.status !== 'Returned / Resolved' && i.status !== 'Closed').length;
  const activeFound = items.filter((i) => i.reportType === 'found' && i.status !== 'Returned / Resolved' && i.status !== 'Closed').length;
  const resolvedCount = items.filter((i) => i.status === 'Returned / Resolved').length;

  const categories: string[] = [
    'All',
    'Electronics',
    'Books and Stationery',
    'Bags',
    'ID Cards',
    'Clothing',
    'Keys',
    'Water Bottles',
    'Accessories',
  ];

  // Filtered preview items for landing
  const previewItems = items
    .filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        return (
          item.itemName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .slice(0, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchQuery) {
      onSearchQuery(searchKeyword, selectedCategory === 'All' ? undefined : selectedCategory);
    }
    onSelectTab('search-match');
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const added = await seedInitialCampusItemsIfEmpty();
      if (added) {
        alert('Official campus sample records seeded successfully!');
      } else {
        alert('Database already contains records.');
      }
    } catch (e) {
      console.error('Seed error:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 lg:p-14 shadow-lg border border-slate-800">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official University Campus Lost & Found System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Lost Something on Campus?{' '}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Let's Find It.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            CampusVault connects students, faculty, and campus security in a verified, privacy-safe network to quickly report, match, and return misplaced campus belongings.
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectTab('report-lost')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-md hover:shadow-rose-600/20"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>

            <button
              onClick={() => onSelectTab('report-found')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-md hover:shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Found Item</span>
            </button>

            <button
              onClick={() => onSelectTab('search-match')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span>Search Database</span>
            </button>
          </div>

          {/* Hero Integrated Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-4 flex flex-col sm:flex-row gap-2 max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search lost items (e.g. MacBook, keys, Hydro Flask, ID card)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-colors shrink-0 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Search Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Live Database Statistics Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalReports}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Total Catalog Reports
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">
            {activeLost}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Active Lost Reports
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
            {activeFound}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Active Found Items
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 tabular-nums">
            {resolvedCount}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Returned & Resolved
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-600 bg-clip-text text-transparent">
            Why CampusVault?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A structured, secure, and modern campus alternative to informal social media posts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Smart Search & Matching</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calculates item title overlap, location proximity, and category similarity to surface potential matches.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Secure Ownership Claims</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Claimants submit confidential proofs (scratches, wallpaper, serial prefix) verified before handover.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">In-App Notifications</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant alerts when someone claims your item or when a reported item matches your search criteria.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Campus Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Centralized administrative desk audit trail ensures every claim and handover is accounted for.
            </p>
          </div>
        </div>
      </section>

      {/* Live Campus Feed / Recent Reports */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Live Campus Reports
            </h2>
            <p className="text-xs text-slate-500">
              Browse recently submitted lost and found listings across campus buildings
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {previewItems.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <div className="text-slate-400 text-sm">
              No matching campus records found.
            </div>
            {totalReports === 0 && (
              <button
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>{isSeeding ? 'Seeding Records...' : 'Seed Official Campus Demo Data'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {previewItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onViewDetails={onViewItem}
                onClaim={onClaimItem}
              />
            ))}
          </div>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => onSelectTab('search-match')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <span>View All Campus Items & Smart Matching</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* System Workflow Preview CTA */}
      <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-bold">
            How Does the CampusVault Verification Process Work?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            From initial lost/found report submission to smart matching, private verification, and in-person desk handover.
          </p>
        </div>
        <button
          onClick={() => onSelectTab('workflow')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors shrink-0 shadow-xs"
        >
          View Interactive Flowchart
        </button>
      </section>

      {/* Campus Help & Safety Desk Info */}
      <footer className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="text-slate-700">Campus Safety & Lost Desk:</strong> Student Union Building, Room 108 · Phone: (555) 019-4829
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onSelectTab('workflow')} className="hover:underline">Workflow</button>
            <button onClick={() => onOpenAuth('login')} className="hover:underline">Sign In</button>
            <button onClick={() => onOpenAuth('register')} className="hover:underline">Register</button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          CampusVault — Smart Lost and Found System. Designed for university campus security, privacy, and rapid item recovery.
        </p>
      </footer>
    </div>
  );
};
