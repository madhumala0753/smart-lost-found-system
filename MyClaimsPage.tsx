import React from 'react';
import { FileCheck2, Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ClaimRequest, ItemReport } from '../types';
import { NavigationTab } from '../components/Sidebar';

interface MyClaimsPageProps {
  claims: ClaimRequest[];
  items: ItemReport[];
  onViewItem: (item: ItemReport) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const MyClaimsPage: React.FC<MyClaimsPageProps> = ({
  claims,
  items,
  onViewItem,
  onSelectTab,
}) => {
  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          My Ownership Claims ({claims.length})
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Track the verification and review progress of ownership claims you filed.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800">
            No claims submitted yet
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you spot an item in the catalog that belongs to you, submit a verification claim to reclaim it.
          </p>
          <button
            onClick={() => onSelectTab('search-match')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
          >
            Search Lost & Found Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const relatedItem = items.find((i) => i.id === claim.itemId);
            const isApproved = claim.status === 'Approved';
            const isRejected = claim.status === 'Rejected';
            const isCompleted = claim.status === 'Completed';

            return (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Claim ID: {claim.id}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5">
                      {claim.itemTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : isCompleted
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isRejected ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{claim.status}</span>
                    </span>
                  </div>
                </div>

                {/* Explanation and verification proof submitted */}
                <div className="text-xs text-slate-700 space-y-2">
                  <div>
                    <strong className="text-slate-900">Your Ownership Explanation:</strong>
                    <p className="mt-0.5 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {claim.explanation}
                    </p>
                  </div>

                  {claim.identifyingDetails && (
                    <div>
                      <strong className="text-amber-900 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        Confidential Verification Details Provided:
                      </strong>
                      <p className="mt-0.5 text-amber-950 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60 font-mono text-[11px]">
                        {claim.identifyingDetails}
                      </p>
                    </div>
                  )}

                  {/* Review Notes from Owner or Admin */}
                  {claim.adminNotes && (
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs">
                      <strong>Reviewer / Desk Instructions:</strong> {claim.adminNotes}
                    </div>
                  )}
                </div>

                {/* Footer meta & button to see item */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>Submitted on: {new Date(claim.createdAt).toLocaleDateString()}</span>

                  {relatedItem && (
                    <button
                      onClick={() => onViewItem(relatedItem)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>View Associated Item Listing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
