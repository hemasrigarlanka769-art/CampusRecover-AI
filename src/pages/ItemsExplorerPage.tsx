import React, { useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  X,
  FileQuestion,
  CheckCircle2,
} from 'lucide-react';
import { LostItem, FoundItem } from '../types/index.js';

interface ItemsExplorerPageProps {
  lostItems: LostItem[];
  foundItems: FoundItem[];
  setCurrentTab: (tab: string) => void;
  onSelectMatchItem?: (itemId: string, type: 'lost' | 'found') => void;
}

export const ItemsExplorerPage: React.FC<ItemsExplorerPageProps> = ({
  lostItems,
  foundItems,
  setCurrentTab,
  onSelectMatchItem,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedItem, setSelectedItem] = useState<{
    item: LostItem | FoundItem;
    type: 'lost' | 'found';
  } | null>(null);

  const categories = [
    'ALL',
    'Electronics',
    'Bags & Luggage',
    'Personal Accessories',
    'Clothing & Footwear',
    'Documents & IDs',
    'Keys & Cards',
    'Books & Stationery',
    'Other',
  ];

  const campusBuildings = [
    'ALL',
    'DE Block',
    'CSE Block',
    'IT Block',
    'Civil Block',
    'Canteen',
    'Fresh Chill',
    'Bakers Corner',
    'Central Park',
    'Admin Block',
    'Bank',
    'Stationary',
    'Main Gate & Security Post',
  ];

  // Combined and filtered items
  const allFormatted = [
    ...lostItems.map((item) => ({ ...item, reportType: 'lost' as const })),
    ...foundItems.map((item) => ({ ...item, reportType: 'found' as const })),
  ];

  const filtered = allFormatted.filter((item) => {
    if (filterMode === 'lost' && item.reportType !== 'lost') return false;
    if (filterMode === 'found' && item.reportType !== 'found') return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedBuilding !== 'ALL' && item.building !== selectedBuilding) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.itemName.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchColor = item.color.toLowerCase().includes(q);
      const matchBuilding = item.building.toLowerCase().includes(q);
      const matchBrand = (item.brand || '').toLowerCase().includes(q);
      return matchName || matchDesc || matchColor || matchBuilding || matchBrand;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Item Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse active lost reports and items currently stored in campus security or with finders.
          </p>
        </div>

        {/* Interactive Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Items ({allFormatted.length})
          </button>
          <button
            onClick={() => setFilterMode('lost')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'lost'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lost Reports ({lostItems.length})
          </button>
          <button
            onClick={() => setFilterMode('found')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'found'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Found Items ({foundItems.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, brands, color, marks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.filter((c) => c !== 'ALL').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Campus Buildings</option>
            {campusBuildings.filter((b) => b !== 'ALL').map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Item Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No items match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or file a new lost/found report.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedBuilding('ALL');
                setFilterMode('all');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => {
            const hasImage = item.images && item.images.length > 0;
            const isLost = item.reportType === 'lost';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem({ item, type: item.reportType })}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
              >
                <div>
                  {/* Image slot with styled zero-broken fallback */}
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {hasImage ? (
                      <img
                        src={item.images[0]}
                        alt={item.itemName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-400 bg-slate-50">
                        <Layers className="w-8 h-8 mb-1 text-slate-300" />
                        <span className="text-[11px]">No photo provided</span>
                      </div>
                    )}

                    {/* Unboxed subtle indicator label */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs ${
                          isLost ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {isLost ? 'LOST REPORT' : 'FOUND ITEM'}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-medium bg-white/90 backdrop-blur-xs text-slate-800 px-2 py-0.5 rounded shadow-2xs">
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.itemName}
                    </h3>

                    {/* Clean unboxed metadata discipline with typographic separators */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.color}</span>
                      {item.brand && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.brand}</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[170px]" title={item.building}>
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.building}</span>
                  </span>
                  <span className="font-mono tabular-nums shrink-0">
                    {'dateLost' in item ? item.dateLost : item.dateFound}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedItem.type === 'lost' ? 'Lost Report Case' : 'Found Property Item'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedItem.item.itemName}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {selectedItem.item.images && selectedItem.item.images.length > 0 && (
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={selectedItem.item.images[0]}
                    alt={selectedItem.item.itemName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Description</p>
                <p className="text-slate-600 text-sm leading-relaxed">{selectedItem.item.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-600">Category</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedItem.item.category}</p>
                </div>
                <div>
                  <span className="text-slate-600">Color</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedItem.item.color}</p>
                </div>
                <div>
                  <span className="text-slate-600">Brand</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedItem.item.brand || 'Unbranded'}</p>
                </div>
                <div>
                  <span className="text-slate-600">Campus Location</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedItem.item.building}</p>
                </div>
              </div>

              {'room' in selectedItem.item && selectedItem.item.room && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-600">Specific Room / Area</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedItem.item.room}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                <span>Reporter: {selectedItem.item.userName}</span>
                <span className="font-mono tabular-nums">
                  {'dateLost' in selectedItem.item ? selectedItem.item.dateLost : selectedItem.item.dateFound}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setCurrentTab('matches');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Search AI Matches</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
