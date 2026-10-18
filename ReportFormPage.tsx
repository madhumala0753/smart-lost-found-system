import React, { useState } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  Upload,
  Camera,
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ItemCategory, ReportType, ContactPreference, ItemReport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { createItemReport } from '../services/itemService';
import { NavigationTab } from '../components/Sidebar';

interface ReportFormPageProps {
  initialType?: ReportType;
  onSuccess: (item: ItemReport) => void;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAuth: () => void;
}

const COMMON_CAMPUS_LOCATIONS = [
  'Central Library — 1st Floor Lobby',
  'Central Library — 2nd Floor Quiet Study',
  'Student Union — Lounge & Food Court',
  'Campus Recreation Center & Gymnasium',
  'Dining Commons — Main Hall',
  'Science Complex — Life Sciences Hall A',
  'Engineering Hall — Room 204 Labs',
  'Auditorium / Main Campus Lecture Hall',
  'North Campus Parking Lot B',
  'South Residence Hall Courtyard',
  'Campus Health & Counseling Center',
  'University Bookstore & Cafe',
  'Other / Outdoor Campus Pathway',
];

const CATEGORIES: ItemCategory[] = [
  'Electronics',
  'Books and Stationery',
  'Bags',
  'ID Cards',
  'Clothing',
  'Keys',
  'Water Bottles',
  'Accessories',
  'Other',
];

export const ReportFormPage: React.FC<ReportFormPageProps> = ({
  initialType = 'lost',
  onSuccess,
  onSelectTab,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [reportType, setReportType] = useState<ReportType>(initialType);

  // Sync state if initialType changes (e.g., user clicked "Report Found" after visiting "Report Lost")
  React.useEffect(() => {
    setReportType(initialType);
    setCreatedItem(null);
    setErrorMsg(null);
  }, [initialType]);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [locationPreset, setLocationPreset] = useState(COMMON_CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [contactPreference, setContactPreference] = useState<ContactPreference>('in_app');
  const [contactPhone, setContactPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<ItemReport | null>(null);

  // Client-side image upload & intelligent compression to guarantee it fits safely within Firestore document limits (< 1MB)
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawData = uploadEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setImagePreview(compressedDataUrl);
          setImageUrl(compressedDataUrl);
        } else {
          setImagePreview(rawData);
          setImageUrl(rawData);
        }
      };
      img.onerror = () => {
        setImagePreview(rawData);
        setImageUrl(rawData);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) {
      setErrorMsg('You must be signed in to submit a report.');
      onOpenAuth();
      return;
    }

    if (!itemName.trim()) {
      setErrorMsg('Please provide an item name.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter a detailed description of the item.');
      return;
    }

    const finalLocation = customLocation.trim() || locationPreset;
    if (!finalLocation.trim()) {
      setErrorMsg('Please specify the campus location.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const item = await createItemReport({
        ownerId: currentUser.uid,
        ownerName: userProfile.fullName || currentUser.displayName || 'Campus Member',
        ownerEmail: userProfile.email || currentUser.email || '',
        reportType,
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        location: finalLocation,
        eventDate,
        imageUrl: imageUrl.trim() || undefined,
        distinguishingFeatures: distinguishingFeatures.trim() || undefined,
        contactPreference,
        contactPhone: contactPhone.trim() || undefined,
        status: 'Active',
      });

      setCreatedItem(item);
      onSuccess(item);
    } catch (err: unknown) {
      console.error(`[ReportFormPage] Submission error for ${reportType} item:`, err);
      let extractedMessage = 'Failed to save report to database.';

      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            extractedMessage = `Firebase error: ${parsed.error}`;
          } else {
            extractedMessage = err.message;
          }
        } catch {
          extractedMessage = err.message;
        }
      } else {
        extractedMessage = String(err);
      }

      if (extractedMessage.includes('permission-denied') || extractedMessage.includes('Missing or insufficient permissions')) {
        setErrorMsg('Permission denied: Please ensure you are authenticated and your account profile is active.');
      } else if (extractedMessage.includes('exceeds maximum allowed size')) {
        setErrorMsg('Item photo or data exceeds size limit. Please upload a smaller image.');
      } else if (extractedMessage.includes('offline') || extractedMessage.includes('network')) {
        setErrorMsg('Network error: Firestore is currently unreachable. Please check your internet connection.');
      } else {
        setErrorMsg(`Unable to save ${reportType} report: ${extractedMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLost = reportType === 'lost';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Page Title & Type Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isLost ? 'Report a Lost Item' : 'Report a Found Item'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isLost
              ? 'List your missing possessions to notify campus finders and security.'
              : 'Log an item you discovered on campus so the rightful owner can verify it.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => {
              setReportType('lost');
              setCreatedItem(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isLost
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Lost Item</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setReportType('found');
              setCreatedItem(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              !isLost
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Found Item</span>
          </button>
        </div>
      </div>

      {/* Success View */}
      {createdItem ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">
              Report Published to CampusVault!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              "{createdItem.itemName}" is now active in the database. Anyone browsing or searching can now match against it.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs space-y-1.5">
            <div><strong>Report ID:</strong> <span className="font-mono text-slate-600">{createdItem.id}</span></div>
            <div><strong>Type:</strong> <span className="uppercase font-bold text-blue-600">{createdItem.reportType}</span></div>
            <div><strong>Location:</strong> {createdItem.location}</div>
            <div><strong>Date:</strong> {createdItem.eventDate}</div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onSelectTab('search-match')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
            >
              Search Potential Matches Now
            </button>
            <button
              onClick={() => onSelectTab('my-items')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              View in My Items
            </button>
            <button
              onClick={() => {
                setCreatedItem(null);
                setItemName('');
                setDescription('');
                setDistinguishingFeatures('');
                setImagePreview(null);
                setImageUrl('');
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!currentUser && (
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3">
              <div>
                <strong>Authentication Required:</strong> Please sign in with your college credentials to record this report under your identity.
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Section 1: Item Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Item Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple MacBook Air 13-inch Space Gray"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Include color, model, condition, stickers, brand names, or circumstances where it was lost/found..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Distinguishing Features (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dent at bottom rim, GitHub sticker, initials 'J.D.' on back cover"
                value={distinguishingFeatures}
                onChange={(e) => setDistinguishingFeatures(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Features that help claimants or finders distinguish this item from others of the same brand.
              </span>
            </div>
          </div>

          {/* Section 2: Campus Location & Date */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Campus Location & Date
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Building / Area <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select
                    value={locationPreset}
                    onChange={(e) => setLocationPreset(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden truncate"
                  >
                    {COMMON_CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Room / Spot (Or Custom Location)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Complex 3rd Floor Lab 304, Desk 12"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date {isLost ? 'Lost' : 'Found'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Photo Upload */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              3. Item Photo
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {imagePreview ? (
                <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageUrl('');
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="w-full sm:w-60 h-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-50/50 transition-colors p-4 text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    Upload item image
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG, WebP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>
              )}

              <div className="flex-1 text-xs text-slate-500 space-y-1">
                <p>
                  <strong>Visual Verification Tip:</strong> Photos drastically increase match and return rates.
                </p>
                <p className="text-[11px] text-slate-400">
                  For Found items, try to photograph the overall object while keeping serial numbers or sensitive private details concealed for the claim verification step.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Contact Preference */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              4. Contact & Handover Preference
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  contactPreference === 'in_app'
                    ? 'border-blue-500 bg-blue-50/40 text-blue-950'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">In-App Alerts</span>
                  <input
                    type="radio"
                    name="contactPref"
                    checked={contactPreference === 'in_app'}
                    onChange={() => setContactPreference('in_app')}
                    className="text-blue-600"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Receive claims & match notifications inside CampusVault. (Recommended)
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  contactPreference === 'email'
                    ? 'border-blue-500 bg-blue-50/40 text-blue-950'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">College Email</span>
                  <input
                    type="radio"
                    name="contactPref"
                    checked={contactPreference === 'email'}
                    onChange={() => setContactPreference('email')}
                    className="text-blue-600"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Communicate via verified college email after claim review.
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  contactPreference === 'phone'
                    ? 'border-blue-500 bg-blue-50/40 text-blue-950'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Phone / SMS</span>
                  <input
                    type="radio"
                    name="contactPref"
                    checked={contactPreference === 'phone'}
                    onChange={() => setContactPreference('phone')}
                    className="text-blue-600"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Allow approved claimant or security to call or text.
                </span>
              </label>
            </div>

            {contactPreference === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus or Mobile Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full sm:w-72 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              * By submitting, you confirm that this report describes a genuine campus item.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-60 ${
                isLost
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 hover:shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 hover:shadow-emerald-600/20'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Saving to Database...'
                  : isLost
                  ? 'Publish Lost Item Report'
                  : 'Publish Found Item Report'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
