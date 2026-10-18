import React from 'react';
import {
  MapPin,
  Calendar,
  Tag,
  Eye,
  CheckCircle,
  Laptop,
  BookOpen,
  Briefcase,
  CreditCard,
  Shirt,
  Key,
  Coffee,
  Glasses,
  HelpCircle,
} from 'lucide-react';
import { ItemReport, ItemCategory } from '../types';

interface ItemCardProps {
  item: ItemReport;
  onViewDetails: (item: ItemReport) => void;
  onClaim?: (item: ItemReport) => void;
  matchScore?: number;
  matchReasons?: string[];
  isOwner?: boolean;
}

export function getCategoryIcon(category: ItemCategory) {
  switch (category) {
    case 'Electronics':
      return Laptop;
    case 'Books and Stationery':
      return BookOpen;
    case 'Bags':
      return Briefcase;
    case 'ID Cards':
      return CreditCard;
    case 'Clothing':
      return Shirt;
    case 'Keys':
      return Key;
    case 'Water Bottles':
      return Coffee;
    case 'Accessories':
      return Glasses;
    default:
      return HelpCircle;
  }
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onViewDetails,
  onClaim,
  matchScore,
  matchReasons,
  isOwner,
}) => {
  const CategoryIcon = getCategoryIcon(item.category);
  const isLost = item.reportType === 'lost';
  const isResolved = item.status === 'Returned / Resolved';
  const isClosed = item.status === 'Closed';

  return (
    <div className="group bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail area */}
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden flex items-center justify-center">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.itemName}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Graceful fallback to icon if URL broken
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <CategoryIcon className="w-10 h-10 stroke-1 text-slate-400 mb-1" />
            <span className="text-[11px] font-medium text-slate-500">{item.category}</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-xs ${
              isLost
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {item.reportType}
          </span>

          {matchScore !== undefined && matchScore > 0 && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs ${
                matchScore >= 80
                  ? 'bg-teal-500 text-slate-950'
                  : matchScore >= 50
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {matchScore}% Match
            </span>
          )}
        </div>

        {/* Status overlay if resolved or closed */}
        {(isResolved || isClosed) && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
            <span className="px-3 py-1 rounded-lg bg-white/90 text-slate-900 text-xs font-bold uppercase tracking-wider shadow-sm">
              {item.status}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Status row */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
              <CategoryIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.category}</span>
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                item.status === 'Active'
                  ? 'bg-blue-50 text-blue-700'
                  : item.status === 'Claim Pending'
                  ? 'bg-amber-50 text-amber-700'
                  : item.status === 'Matched'
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.status}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
            {item.itemName}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Location and Date meta */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate" title={item.location}>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{item.eventDate}</span>
            </div>
          </div>

          {/* Match reasons explanation if provided */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="mt-2.5 p-2 rounded-lg bg-teal-50/70 border border-teal-100 text-[11px] text-teal-900">
              <span className="font-semibold block mb-0.5">Approximate Match Breakdown:</span>
              <ul className="list-disc list-inside space-y-0.5 text-teal-800">
                {matchReasons.slice(0, 2).map((r, i) => (
                  <li key={i} className="truncate">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => onViewDetails(item)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View Details</span>
          </button>

          {!isOwner && !isResolved && !isClosed && onClaim && (
            <button
              onClick={() => onClaim(item)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Claim Item</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
