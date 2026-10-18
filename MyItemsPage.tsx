import React, { useState } from 'react';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Lock,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { ItemReport, ClaimRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryIcon } from '../components/ItemCard';
import { resolveItemReport, closeItemReport, deleteItemReport } from '../services/itemService';
import { NavigationTab } from '../components/Sidebar';

interface MyItemsPageProps {
  items: ItemReport[];
  allClaims: ClaimRequest[];
  onViewItem: (item: ItemReport) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const MyItemsPage: React.FC<MyItemsPageProps> = ({
  items,
  allClaims,
  onViewItem,
  onSelectTab,
}) => {
  const { currentUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const myItems = items.filter((i) => i.ownerId === currentUser?.uid);

  const filtered = myItems.filter((i) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Active') return i.status === 'Active' || i.status === 'Matched' || i.status === 'Claim Pending';
    if (filterStatus === 'Resolved') return i.status === 'Returned / Resolved';
    if (filterStatus === 'Closed') return i.status === 'Closed';
    return true;
  });

  const handleResolve = async (item: ItemReport) => {
    if (!window.confirm(`Mark "${item.itemName}" as returned and resolved?`)) return;
    setIsProcessing(item.id);
    try {
      await resolveItemReport(item.id);
    } catch (e) {
      console.error('Error resolving:', e);
      alert('Failed to resolve item.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleClose = async (item: ItemReport) => {
    if (!window.confirm(`Close report "${item.itemName}"?`)) return;
    setIsProcessing(item.id);
    try {
      await closeItemReport(item.id);
    } catch (e) {
      console.error('Error closing:', e);
      alert('Failed to close report.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (item: ItemReport) => {
    if (!window.confirm(`Permanently delete "${item.itemName}"?`)) return;
    setIsProcessing(item.id);
    try {
      await deleteItemReport(item.id);
    } catch (e) {
      console.error('Error deleting:', e);
      alert('Failed to delete report.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Reported Items ({myItems.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your personal lost and found submissions and review claim requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('report-lost')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => onSelectTab('report-found')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Found</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['All', 'Active', 'Resolved', 'Closed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800">
            No items in this filter
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't reported any {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} items yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const CategoryIcon = getCategoryIcon(item.category);
            const isLost = item.reportType === 'lost';
            const isResolved = item.status === 'Returned / Resolved';
            const isClosed = item.status === 'Closed';
            const claimsOnItem = allClaims.filter((c) => c.itemId === item.id);

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <CategoryIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isLost
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.reportType}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {item.category}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                          item.status === 'Active'
                            ? 'bg-blue-50 text-blue-700'
                            : item.status === 'Claim Pending'
                            ? 'bg-amber-50 text-amber-700'
                            : item.status === 'Matched'
                            ? 'bg-purple-50 text-purple-700'
                            : item.status === 'Returned / Resolved'
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                      {claimsOnItem.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <FileCheck2 className="w-3 h-3" />
                          {claimsOnItem.length} {claimsOnItem.length === 1 ? 'Claim' : 'Claims'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {item.itemName}
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                      <span>Location: <strong>{item.location}</strong></span>
                      <span>Date: {item.eventDate}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <button
                    onClick={() => onViewItem(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Claims</span>
                  </button>

                  {!isResolved && (
                    <button
                      disabled={isProcessing === item.id}
                      onClick={() => handleResolve(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Returned</span>
                    </button>
                  )}

                  {!isClosed && !isResolved && (
                    <button
                      disabled={isProcessing === item.id}
                      onClick={() => handleClose(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Close</span>
                    </button>
                  )}

                  <button
                    disabled={isProcessing === item.id}
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
