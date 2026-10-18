import React from 'react';
import {
  AlertTriangle,
  PlusCircle,
  Package,
  Clock,
  CheckCircle2,
  FileCheck2,
  Search,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ItemReport, ClaimRequest } from '../types';
import { NavigationTab } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryIcon } from '../components/ItemCard';

interface DashboardPageProps {
  items: ItemReport[];
  userClaims: ClaimRequest[];
  onSelectTab: (tab: NavigationTab) => void;
  onViewItem: (item: ItemReport) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  items,
  userClaims,
  onSelectTab,
  onViewItem,
}) => {
  const { userProfile, currentUser } = useAuth();

  const myItems = items.filter((i) => i.ownerId === currentUser?.uid);
  const activeLostCount = items.filter((i) => i.reportType === 'lost' && i.status !== 'Returned / Resolved' && i.status !== 'Closed').length;
  const activeFoundCount = items.filter((i) => i.reportType === 'found' && i.status !== 'Returned / Resolved' && i.status !== 'Closed').length;
  const pendingClaimsCount = userClaims.filter((c) => c.status === 'Pending').length;

  const recentItems = items.slice(0, 8);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-teal-300 text-xs font-semibold border border-blue-400/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Campus Activity Real-Time Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {userProfile?.fullName || 'Campus Member'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Report misplaced belongings, verify ownership claims, or use smart matching to reunite lost campus valuables.
          </p>
        </div>

        {/* Prominent Red & Green Action Buttons as highlighted in spec */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('report-lost')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all shadow-md hover:shadow-rose-600/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Lost Item</span>
          </button>

          <button
            onClick={() => onSelectTab('report-found')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md hover:shadow-emerald-600/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Found Item</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards from Real Database */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Reported Items */}
        <div
          onClick={() => onSelectTab('my-items')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {myItems.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Items submitted by your account
            </p>
          </div>
        </div>

        {/* Card 2: Active Lost Reports */}
        <div
          onClick={() => onSelectTab('search-match')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Active Lost Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">
              {activeLostCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Currently missing campus items
            </p>
          </div>
        </div>

        {/* Card 3: Found Reports */}
        <div
          onClick={() => onSelectTab('search-match')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Active Found Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
              {activeFoundCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Awaiting verification & claims
            </p>
          </div>
        </div>

        {/* Card 4: Pending Claims */}
        <div
          onClick={() => onSelectTab('my-claims')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Pending Claims
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 tabular-nums">
              {pendingClaimsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Your claims under review
            </p>
          </div>
        </div>
      </div>

      {/* Quick Search & Match Prompt banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-teal-50 border border-teal-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-xs">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Looking for something specific?
            </h3>
            <p className="text-xs text-slate-600">
              Run smart category, location, and date proximity matching across all campus records.
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectTab('search-match')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span>Open Smart Matcher</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Reports List (Matching User Dashboard Spec & Reference) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Campus Reports
            </h2>
            <p className="text-xs text-slate-500">
              Latest lost and found submissions across all campus locations
            </p>
          </div>
          <button
            onClick={() => onSelectTab('search-match')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentItems.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No campus items reported yet. Be the first to report a lost or found item!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentItems.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  const isLost = item.reportType === 'lost';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.itemName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <CategoryIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-[200px]">
                            {item.itemName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isLost
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.reportType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate" title={item.location}>
                        {item.location}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {item.eventDate}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            item.status === 'Active'
                              ? 'bg-blue-50 text-blue-700'
                              : item.status === 'Claim Pending'
                              ? 'bg-amber-50 text-amber-700'
                              : item.status === 'Matched'
                              ? 'bg-purple-50 text-purple-700'
                              : item.status === 'Returned / Resolved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
