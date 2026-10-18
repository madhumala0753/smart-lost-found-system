import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { ItemReport, ItemCategory, ReportType, MatchResult } from '../types';
import { ItemCard } from '../components/ItemCard';
import { calculateMatchScore } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

interface SearchMatchPageProps {
  items: ItemReport[];
  initialKeyword?: string;
  initialCategory?: string;
  onViewItem: (item: ItemReport) => void;
  onClaimItem: (item: ItemReport) => void;
}

const CATEGORIES: string[] = [
  'All',
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

export const SearchMatchPage: React.FC<SearchMatchPageProps> = ({
  items,
  initialKeyword = '',
  initialCategory = 'All',
  onViewItem,
  onClaimItem,
}) => {
  const { currentUser } = useAuth();

  // Search & Filter controls
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [locationQuery, setLocationQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest'>('relevance');

  // Match Target Helper (allows user to match against one of their own lost items)
  const myLostItems = useMemo(
    () => items.filter((i) => i.ownerId === currentUser?.uid && i.reportType === 'lost'),
    [items, currentUser]
  );
  const [selectedMyLostItem, setSelectedMyLostItem] = useState<string>('');

  const handleSelectMyItem = (itemId: string) => {
    setSelectedMyLostItem(itemId);
    const target = myLostItems.find((i) => i.id === itemId);
    if (target) {
      setKeyword(target.itemName);
      setSelectedCategory(target.category);
      setLocationQuery(target.location);
      setReportTypeFilter('found'); // Looking for Found counterparts!
      setSortBy('relevance');
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedCategory('All');
    setReportTypeFilter('all');
    setLocationQuery('');
    setStartDate('');
    setEndDate('');
    setMinMatchScore(0);
    setSelectedMyLostItem('');
    setSortBy('relevance');
  };

  // Compute matched items with relevance scores
  const evaluatedResults: MatchResult[] = useMemo(() => {
    // Only search active / non-closed items
    const searchableItems = items.filter(
      (item) => item.status !== 'Closed' && item.status !== 'Rejected'
    );

    return searchableItems
      .filter((item) => {
        // Report type filter
        if (reportTypeFilter !== 'all' && item.reportType !== reportTypeFilter) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Location query
        if (locationQuery.trim()) {
          const locLow = locationQuery.toLowerCase();
          if (!item.location.toLowerCase().includes(locLow)) {
            return false;
          }
        }

        // Date range
        if (startDate && item.eventDate < startDate) {
          return false;
        }
        if (endDate && item.eventDate > endDate) {
          return false;
        }

        return true;
      })
      .map((item) => {
        // Calculate smart matching score against query
        if (!keyword.trim() && !locationQuery.trim() && selectedCategory === 'All') {
          // Default listing without specific target: score based on recentness
          return { item, score: 0, reasons: [] };
        }

        const match = calculateMatchScore(
          {
            itemName: keyword.trim(),
            category: selectedCategory === 'All' ? undefined : selectedCategory,
            location: locationQuery.trim() || undefined,
            eventDate: startDate || undefined,
          },
          item
        );
        return match;
      })
      .filter((res) => {
        if (minMatchScore > 0 && res.score < minMatchScore) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'relevance') {
          // If relevance scores equal, sort by newest
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
        }
        if (sortBy === 'newest') {
          return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
        }
        return new Date(a.item.createdAt).getTime() - new Date(b.item.createdAt).getTime();
      });
  }, [
    items,
    keyword,
    selectedCategory,
    reportTypeFilter,
    locationQuery,
    startDate,
    endDate,
    minMatchScore,
    sortBy,
  ]);

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Matching Description */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Search & Smart Matching Module
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Query active campus records or run multi-variable relevance scoring across categories, keywords, and locations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Found <strong className="text-slate-900">{evaluatedResults.length}</strong> items
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Match against user's lost item shortcut if available */}
        {myLostItems.length > 0 && (
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Quick Match:</strong> Find matching items for one of your reported lost items:
              </span>
            </div>
            <select
              value={selectedMyLostItem}
              onChange={(e) => handleSelectMyItem(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 bg-white font-medium text-purple-900 focus:outline-hidden"
            >
              <option value="">Select your lost item...</option>
              {myLostItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemName} ({item.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item name, description keywords, brand, model..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Report Type Filter Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setReportTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setReportTypeFilter('lost')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportTypeFilter === 'lost'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lost Only
              </button>
              <button
                type="button"
                onClick={() => setReportTypeFilter('found')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportTypeFilter === 'found'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Found Only
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Category, Location, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Campus Location
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Library, Gym, Science Hall..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Lost / Found
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            >
              <option value="relevance">Highest Match Relevance</option>
              <option value="newest">Newest Reports First</option>
              <option value="oldest">Oldest Reports First</option>
            </select>
          </div>
        </div>

        {/* Relevance Score Legend & Disclaimer as explicitly required */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Relevance Legend:</span>
            <span className="inline-flex items-center gap-1 font-medium text-teal-700">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> &gt;75% High
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> 50–74% Moderate
            </span>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            * Scores represent approximate deterministic relevance indicators based on keyword, category, location, and date proximity.
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {evaluatedResults.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800">
            No matching items found
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, broadening the category filter, or resetting the location query.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {evaluatedResults.map(({ item, score, reasons }) => (
            <ItemCard
              key={item.id}
              item={item}
              matchScore={score > 0 ? score : undefined}
              matchReasons={reasons.length > 0 && score > 0 ? reasons : undefined}
              onViewDetails={onViewItem}
              onClaim={onClaimItem}
              isOwner={item.ownerId === currentUser?.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
};
