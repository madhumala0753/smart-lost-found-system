import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Send, Lock } from 'lucide-react';
import { ItemReport, ClaimRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitClaim } from '../services/claimService';

interface ClaimModalProps {
  item: ItemReport | null;
  onClose: () => void;
  onClaimSubmitted?: (claim: ClaimRequest) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  item,
  onClose,
  onClaimSubmitted,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [explanation, setExplanation] = useState('');
  const [identifyingDetails, setIdentifyingDetails] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) {
      setErrorMsg('You must be signed in to submit an ownership claim.');
      return;
    }

    if (currentUser.uid === item.ownerId) {
      setErrorMsg('You cannot file a claim against an item you reported yourself.');
      return;
    }

    if (!explanation.trim()) {
      setErrorMsg('Please explain why you believe this item belongs to you.');
      return;
    }

    if (!identifyingDetails.trim()) {
      setErrorMsg('Please provide confidential identifying details to verify your ownership.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const claim = await submitClaim({
        itemId: item.id,
        itemTitle: item.itemName,
        reportType: item.reportType,
        ownerId: item.ownerId,
        claimantId: currentUser.uid,
        claimantName: userProfile.fullName || currentUser.displayName || 'Campus Student',
        claimantEmail: userProfile.email || currentUser.email || '',
        explanation: explanation.trim(),
        identifyingDetails: identifyingDetails.trim(),
        supportingInfo: supportingInfo.trim(),
      });

      setSubmittedSuccess(true);
      if (onClaimSubmitted) onClaimSubmitted(claim);
    } catch (err: unknown) {
      console.error('Error submitting claim:', err);
      setErrorMsg('Failed to submit claim. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Submit Ownership Claim
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Item: <strong className="text-slate-700">{item.itemName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Claim Submitted Successfully!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                Your claim and verification proofs have been forwarded to the reporter and Campus Safety staff. You will receive an in-app notification when your claim is reviewed.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <strong>Verification Safety Policy:</strong> Do not publicly guess item features. Provide specific private details (e.g., custom stickers, phone lock wallpaper, engraving, serial number, pouch contents) that only the true owner would know.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Why do you believe this item is yours? <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe where and when you lost it, brand model, or how it went missing..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confidential Identifying Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Private proofs: exact scratches, lock screen picture, passcode/color scheme, inside contents, serial prefix..."
                value={identifyingDetails}
                onChange={(e) => setIdentifyingDetails(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                This information is only visible to the item reporter and campus administrator.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Pickup Preference / Contact Phone
              </label>
              <input
                type="text"
                placeholder="e.g. Available weekdays at Campus Center or phone 555-0192"
                value={supportingInfo}
                onChange={(e) => setSupportingInfo(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting Claim...' : 'Submit Claim'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
