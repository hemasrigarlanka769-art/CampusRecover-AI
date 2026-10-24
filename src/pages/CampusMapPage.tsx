import React, { useState } from 'react';
import {
  MapPin,
  Building2,
  Navigation,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  Coffee,
  Waves,
  Sparkles,
} from 'lucide-react';
import { CampusBuilding, LostItem, FoundItem } from '../types/index.js';
import { MVGRCampusMap } from '../components/MVGRCampusMap.js';

interface CampusMapPageProps {
  buildings: CampusBuilding[];
  lostItems: LostItem[];
  foundItems: FoundItem[];
  setCurrentTab: (tab: string) => void;
}

export const CampusMapPage: React.FC<CampusMapPageProps> = ({
  buildings,
  lostItems,
  foundItems,
  setCurrentTab,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(buildings[0] || null);

  const filteredBuildings = buildings;

  const lostCountsByBuilding: Record<string, number> = {};
  const foundCountsByBuilding: Record<string, number> = {};

  for (const item of lostItems) {
    lostCountsByBuilding[item.building] = (lostCountsByBuilding[item.building] || 0) + 1;
  }
  for (const item of foundItems) {
    foundCountsByBuilding[item.building] = (foundCountsByBuilding[item.building] || 0) + 1;
  }

  const activeLostInBuilding = selectedBuilding
    ? lostItems.filter((i) => i.building.toLowerCase() === selectedBuilding.name.toLowerCase())
    : [];

  const activeFoundInBuilding = selectedBuilding
    ? foundItems.filter((i) => i.building.toLowerCase() === selectedBuilding.name.toLowerCase())
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              MVGR College of Engineering Campus Map
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-100">
              Campus Ground Layout
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official MVGR campus landmarks: DE Block, CSE Block, IT Block, Civil Block, Canteen, Fresh Chill, Bakers Corner, Central Park, Admin Block, Bank, and Stationary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('report-lost')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span>Report at Landmark</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Visual on Left, Building Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Map Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <MVGRCampusMap
            buildings={buildings}
            selectedBuildingId={selectedBuilding?.id || null}
            onSelectBuilding={(b) => setSelectedBuilding(b)}
            lostCountsByBuilding={lostCountsByBuilding}
            foundCountsByBuilding={foundCountsByBuilding}
          />

          {/* Quick Select Building Badges */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Landmark Navigator:
            </span>
            <div className="flex flex-wrap gap-2">
              {filteredBuildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuilding(b)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all text-left ${
                    selectedBuilding?.id === b.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-mono font-bold mr-1.5 opacity-80">{b.code}</span>
                  <span>{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Building Details Inspector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
          {selectedBuilding ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {selectedBuilding.code}
                  </span>
                  <span className="text-slate-500 font-medium">{selectedBuilding.zone}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedBuilding.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Official campus zone at MVGR College of Engineering. Checkpoints and secure verification points are stationed here.
                </p>
              </div>

              {/* Building Statistics */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-indigo-600">
                    {lostCountsByBuilding[selectedBuilding.name] || 0}
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                    Lost Reports
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600">
                    {foundCountsByBuilding[selectedBuilding.name] || 0}
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                    Found Items
                  </span>
                </div>
              </div>

              {/* Active Items at this building */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Reports at this Location:
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeLostInBuilding.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.itemName}</p>
                        <p className="text-[10px] text-indigo-600 font-medium">Lost Report · {item.category}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.dateLost}</span>
                    </div>
                  ))}

                  {activeFoundInBuilding.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-emerald-50/50 text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.itemName}</p>
                        <p className="text-[10px] text-emerald-700 font-medium">Found Property · {item.category}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.dateFound}</span>
                    </div>
                  ))}

                  {activeLostInBuilding.length === 0 && activeFoundInBuilding.length === 0 && (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 space-y-1">
                      <p className="font-medium text-slate-700">No active reports here</p>
                      <p className="text-[11px]">This location has zero current pending reports.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select any MVGR landmark to inspect reports.</p>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setCurrentTab('report-lost')}
              className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors text-center"
            >
              Report Lost Item in {selectedBuilding?.name.split(' ')[0] || 'Campus'}
            </button>
            <button
              onClick={() => setCurrentTab('report-found')}
              className="w-full py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              Report Found Item in {selectedBuilding?.name.split(' ')[0] || 'Campus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
