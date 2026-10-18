import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Trash2,
  Lock,
} from 'lucide-react';
import { ItemReport, ClaimRequest } from '../types';
import { getCategoryIcon } from './ItemCard';
import { useAuth } from '../contexts/AuthContext';
import { resolveItemReport, closeItemReport, deleteItemReport } from '../services/itemService';
import { subscribeToClaimsForOwner, reviewClaimStatus } from '../services/claimService';

interface ItemDetailsModalProps {
  item: ItemReport | null;
  onClose: () => void;
  onOpenClaimModal: (item: ItemReport) => void;
  onItemUpdated?: () => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  onClose,
  onOpenClaimModal,
  onItemUpdated,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<{ [claimId: string]: string }>({});

  if (!item) return null;

  const isOwner = currentUser?.uid === item.ownerId;
  const canManage = isOwner || isAdmin;
  const isResolved = item.status === 'Returned / Resolved';
  const isClosed = item.status === 'Closed';
  const CategoryIcon = getCategoryIcon(item.category);

  // Subscribe to claims for this item if owner or admin
  useEffect(() => {
    if (canManage && item.id) {
      const unsub = subscribeToClaimsForOwner(item.ownerId, (allOwnerClaims) => {
        const itemClaims = allOwnerClaims.filter((c) => c.itemId === item.id);
        setClaims(itemClaims);
      });
      return () => unsub();
    }
  }, [canManage, item.id, item.ownerId]);

  const handleResolve = async () => {
    if (!window.confirm('Mark this item as officially Returned / Resolved to its rightful owner?')) return;
    setLoadingAction(true);
    try {
      await resolveItemReport(item.id);
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (e) {
      console.error('Error resolving item:', e);
      alert('Failed to resolve item. Please check permissions.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCloseReport = async () => {
    if (!window.confirm('Close this report? It will no longer appear in active search.')) return;
    setLoadingAction(true);
    try {
      await closeItemReport(item.id);
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (e) {
      console.error('Error closing report:', e);
      alert('Failed to close report.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this report? This cannot be undone.')) return;
    setLoadingAction(true);
    try {
      await deleteItemReport(item.id);
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (e) {
      console.error('Error deleting report:', e);
      alert('Failed to delete report.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReviewClaim = async (claim: ClaimRequest, newStatus: 'Approved' | 'Rejected' | 'Completed') => {
    const notes = reviewNotes[claim.id] || '';
    setLoadingAction(true);
    try {
      await reviewClaimStatus(claim, newStatus, currentUser?.uid || 'admin', notes);
      alert(`Claim marked as ${newStatus}!`);
      if (onItemUpdated) onItemUpdated();
    } catch (e) {
      console.error('Error updating claim:', e);
      alert('Failed to update claim.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                item.reportType === 'lost'
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {item.reportType} Report
            </span>
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
              ID: {item.id.slice(0, 14)}...
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Visual & Key Meta */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-full sm:w-56 aspect-4/3 sm:aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400 p-4">
                  <CategoryIcon className="w-12 h-12 stroke-1 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">{item.category}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                <CategoryIcon className="w-4 h-4" />
                <span>{item.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 leading-snug">
                {item.itemName}
              </h2>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">Location:</span>
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">Date {item.reportType}:</span>
                  <span>{item.eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">Reported On:</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">Current Status:</span>
                  <span className="font-bold text-blue-700">{item.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Item Description
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Distinguishing Features */}
          {item.distinguishingFeatures && (
            <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200/60">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Distinguishing Features & Marks
              </h4>
              <p className="text-sm text-amber-950">
                {item.distinguishingFeatures}
              </p>
            </div>
          )}

          {/* Reporter & Contact Info (Safe disclosure) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              Reporter & Verification Policy
            </h4>
            <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>Reported by: <strong className="text-slate-800">{item.ownerName}</strong></span>
              <span>Contact Preference: <strong className="text-slate-800 uppercase">{item.contactPreference}</strong></span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * To safeguard campus privacy, direct student phone numbers or personal emails are not displayed publicly. Verification claims are handled securely through CampusVault.
            </p>
          </div>

          {/* Owner / Admin Management Section: Review Claims filed on this item */}
          {canManage && (
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  Ownership Claims on This Item ({claims.length})
                </h4>
                {isOwner && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    You own this report
                  </span>
                )}
              </div>

              {claims.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                  No claims have been submitted for this item yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            Claimant: {claim.claimantName}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {claim.claimantEmail} · Filed {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            claim.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : claim.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1">
                        <div>
                          <strong>Reason / Proof of Ownership:</strong> {claim.explanation}
                        </div>
                        {claim.identifyingDetails && (
                          <div className="text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/70 text-[11px]">
                            <strong>Confidential Verification Details:</strong> {claim.identifyingDetails}
                          </div>
                        )}
                      </div>

                      {/* Admin Notes / Review notes input */}
                      {claim.status === 'Pending' && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                          <input
                            type="text"
                            placeholder="Optional verification note or pickup location..."
                            value={reviewNotes[claim.id] || ''}
                            onChange={(e) =>
                              setReviewNotes({ ...reviewNotes, [claim.id]: e.target.value })
                            }
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={loadingAction}
                              onClick={() => handleReviewClaim(claim, 'Approved')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                              Approve Claim
                            </button>
                            <button
                              disabled={loadingAction}
                              onClick={() => handleReviewClaim(claim, 'Rejected')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                            >
                              Reject Claim
                            </button>
                          </div>
                        </div>
                      )}

                      {claim.status === 'Approved' && !isResolved && (
                        <div className="pt-2">
                          <button
                            disabled={loadingAction}
                            onClick={() => handleReviewClaim(claim, 'Completed')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Mark Handover Completed
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                {!isResolved && (
                  <button
                    disabled={loadingAction}
                    onClick={handleResolve}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mark Returned / Resolved</span>
                  </button>
                )}

                {!isClosed && !isResolved && (
                  <button
                    disabled={loadingAction}
                    onClick={handleCloseReport}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Close Report</span>
                  </button>
                )}

                <button
                  disabled={loadingAction}
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOwner && !isResolved && !isClosed && (
              <button
                onClick={() => {
                  onClose();
                  onOpenClaimModal(item);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Submit Ownership Claim</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
