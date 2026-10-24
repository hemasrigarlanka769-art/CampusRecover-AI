import React, { useState } from 'react';
import {
  MapPin,
  Coffee,
  GraduationCap,
  Waves,
  Building2,
  Home,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { CampusBuilding } from '../types/index.js';

interface MVGRCampusMapProps {
  buildings: CampusBuilding[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: CampusBuilding) => void;
  lostCountsByBuilding?: Record<string, number>;
  foundCountsByBuilding?: Record<string, number>;
}

export const MVGRCampusMap: React.FC<MVGRCampusMapProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  lostCountsByBuilding = {},
  foundCountsByBuilding = {},
}) => {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  // Defined coordinate positions calibrated to the MVGR College map image (viewBox 0 0 1000 660)
  const mapNodes = [
    {
      id: 'b_de',
      name: 'DE Block',
      subname: 'Mechanical & Chemical DE Wing',
      code: 'DE',
      x: 130,
      y: 460,
      width: 125,
      height: 60,
      icon: 'academic',
      badgePos: { x: 130, y: 435 },
    },
    {
      id: 'b_cse',
      name: 'CSE Block',
      subname: 'Computer Science & Engineering',
      code: 'CSE',
      x: 290,
      y: 450,
      width: 140,
      height: 65,
      icon: 'academic',
      badgePos: { x: 290, y: 425 },
    },
    {
      id: 'b_it',
      name: 'IT Block',
      subname: 'Information Technology Wing',
      code: 'IT',
      x: 440,
      y: 380,
      width: 130,
      height: 60,
      icon: 'academic',
      badgePos: { x: 440, y: 355 },
    },
    {
      id: 'b_civil',
      name: 'Civil Block',
      subname: 'Civil Engineering Complex',
      code: 'CIVIL',
      x: 250,
      y: 560,
      width: 140,
      height: 60,
      icon: 'academic',
      badgePos: { x: 250, y: 535 },
    },
    {
      id: 'b_canteen',
      name: 'Canteen',
      subname: 'Central Campus Canteen',
      code: 'CANTEEN',
      x: 740,
      y: 360,
      width: 120,
      height: 55,
      icon: 'cafe',
      badgePos: { x: 740, y: 335 },
    },
    {
      id: 'b_freshchill',
      name: 'Fresh Chill',
      subname: 'Juice & Refreshment Bar',
      code: 'FRESH_CHILL',
      x: 720,
      y: 260,
      width: 120,
      height: 50,
      icon: 'cafe',
      badgePos: { x: 720, y: 235 },
    },
    {
      id: 'b_bakers',
      name: 'Bakers Corner',
      subname: 'Campus Bakery & Quick Bites',
      code: 'BAKERS_CORNER',
      x: 860,
      y: 200,
      width: 130,
      height: 50,
      icon: 'cafe',
      badgePos: { x: 860, y: 175 },
    },
    {
      id: 'b_centralpark',
      name: 'Central Park',
      subname: 'Green Quad & Promenade',
      code: 'CENTRAL_PARK',
      x: 500,
      y: 300,
      width: 160,
      height: 65,
      icon: 'pond',
      badgePos: { x: 500, y: 275 },
    },
    {
      id: 'b_admin',
      name: 'Admin Block',
      subname: 'Administration & Principal Office',
      code: 'ADMIN',
      x: 510,
      y: 470,
      width: 120,
      height: 70,
      icon: 'admin',
      badgePos: { x: 510, y: 440 },
    },
    {
      id: 'b_bank',
      name: 'Bank',
      subname: 'Union / Andhra Bank Branch & ATM',
      code: 'BANK',
      x: 670,
      y: 500,
      width: 90,
      height: 55,
      icon: 'gate',
      badgePos: { x: 670, y: 475 },
    },
    {
      id: 'b_stationary',
      name: 'Stationary',
      subname: 'Campus Books & Stationary Store',
      code: 'STATIONARY',
      x: 770,
      y: 500,
      width: 100,
      height: 55,
      icon: 'lab',
      badgePos: { x: 770, y: 475 },
    },
    {
      id: 'b_gate',
      name: 'Main Gate & Security Post',
      subname: 'కాలేజీ మెయిన్ గేట్ · Security Checkpoint',
      code: 'GATE',
      x: 885,
      y: 500,
      width: 110,
      height: 55,
      icon: 'gate',
      badgePos: { x: 885, y: 475 },
    },
  ];

  return (
    <div className="relative w-full bg-[#eef3f7] rounded-2xl border border-slate-300 shadow-md overflow-hidden select-none">
      {/* Top Banner overlay */}
      <div className="absolute top-3 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-slate-900">MVGR College of Engineering Campus Map</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-600 font-medium">Click any building to view lost/found items</span>
      </div>

      {/* SVG Canvas Matching the exact MVGR map layout */}
      <svg
        viewBox="0 0 1000 660"
        className="w-full h-auto max-h-[620px] transition-all"
        style={{ minHeight: '440px' }}
      >
        {/* Background land styling */}
        <rect width="1000" height="660" fill="#f4f7f9" />

        {/* Outer road boundary on the east entering from MVGR College Main Gate */}
        <path
          d="M 820,660 L 910,480 L 980,180 L 1000,0"
          stroke="#ced9e5"
          strokeWidth="38"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 820,660 L 910,480 L 980,180 L 1000,0"
          stroke="#ffffff"
          strokeWidth="28"
          fill="none"
          strokeLinecap="round"
        />

        {/* Curving Campus Access Road from Main Gate towards Central Quad */}
        <path
          d="M 870,520 C 780,560 670,550 560,520 C 470,490 320,490 190,540"
          stroke="#ced9e5"
          strokeWidth="32"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M 870,520 C 780,560 670,550 560,520 C 470,490 320,490 190,540"
          stroke="#ffffff"
          strokeWidth="24"
          fill="none"
          strokeLinejoin="round"
        />

        {/* Road lane direction arrows between Main Gate and Central Quad */}
        <g stroke="#94a3b8" strokeWidth="2.5" fill="none" opacity="0.8">
          <path d="M 660,545 L 675,545 M 670,540 L 675,545 L 670,550" />
          <path d="M 745,548 L 730,548 M 735,543 L 730,548 L 735,553" />
        </g>

        {/* Internal Sector Loop Roads (connecting Mech, Chemistry, Admin, Pond) */}
        <path
          d="M 190,540 L 220,380 L 390,260 L 650,420 L 590,530"
          stroke="#ced9e5"
          strokeWidth="22"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M 190,540 L 220,380 L 390,260 L 650,420 L 590,530"
          stroke="#ffffff"
          strokeWidth="16"
          fill="none"
          strokeLinejoin="round"
        />

        {/* Western Academic Access Road (ECE & Mech connector) */}
        <path
          d="M 160,560 L 460,630 L 480,520"
          stroke="#ced9e5"
          strokeWidth="20"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M 160,560 L 460,630 L 480,520"
          stroke="#ffffff"
          strokeWidth="14"
          fill="none"
          strokeLinejoin="round"
        />

        {/* North Laboratory Pathways */}
        <path
          d="M 390,260 L 360,110 L 460,60"
          stroke="#ffffff"
          strokeWidth="12"
          fill="none"
        />
        <path
          d="M 35,580 L 60,30 L 250,50"
          stroke="#ced9e5"
          strokeWidth="18"
          fill="none"
        />
        <path
          d="M 35,580 L 60,30 L 250,50"
          stroke="#ffffff"
          strokeWidth="12"
          fill="none"
        />

        {/* CAMPUS POND (పాండ్) - Water body polygon with ripple styling */}
        <g id="pond_group" className="cursor-pointer" onClick={() => {
          const b = buildings.find(x => x.id === 'b_pond');
          if (b) onSelectBuilding(b);
        }}>
          <polygon
            points="768,240 890,260 905,345 870,360 760,315"
            fill="#a5d8f0"
            stroke="#81c4e6"
            strokeWidth="3"
            className="transition-all hover:fill-[#8ad0f3]"
          />
          <text
            x="835"
            y="290"
            textAnchor="middle"
            fill="#0369a1"
            fontSize="18"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Pond
          </text>
          <text
            x="835"
            y="312"
            textAnchor="middle"
            fill="#0284c7"
            fontSize="14"
            fontWeight="500"
            fontFamily="sans-serif"
          >
            పాండ్
          </text>
        </g>

        {/* CHAI MOSA - Student Cafeteria */}
        <g
          id="chaimosa_group"
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_chaimosa');
            if (b) onSelectBuilding(b);
          }}
        >
          <rect
            x="820"
            y="130"
            width="145"
            height="42"
            rx="8"
            fill="#ffffff"
            stroke="#f97316"
            strokeWidth="1.5"
            className="hover:stroke-2"
          />
          <text
            x="875"
            y="156"
            textAnchor="middle"
            fill="#c2410c"
            fontSize="14"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            CHAI MOSA
          </text>
          <circle cx="945" cy="151" r="11" fill="#ea580c" />
          <path
            d="M 940,154 C 940,157 950,157 950,154 L 950,148 L 940,148 Z"
            fill="#ffffff"
          />
        </g>

        {/* Ziva Womens PG & Student Hostel */}
        <g
          id="hostel_group"
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_hostel');
            if (b) onSelectBuilding(b);
          }}
        >
          <text
            x="940"
            y="25"
            textAnchor="middle"
            fill="#db2777"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Ziva Womens
          </text>
          <text
            x="940"
            y="42"
            textAnchor="middle"
            fill="#db2777"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            PG &amp; Hostel
          </text>
        </g>

        {/* BUILDING 1: ECE Department Complex */}
        <g
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_ece');
            if (b) onSelectBuilding(b);
          }}
          onMouseEnter={() => setHoveredBuilding('b_ece')}
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          <rect
            x="200"
            y="545"
            width="155"
            height="50"
            rx="6"
            fill={selectedBuildingId === 'b_ece' ? '#e0e7ff' : '#e2e8f0'}
            stroke={selectedBuildingId === 'b_ece' ? '#4f46e5' : '#cbd5e1'}
            strokeWidth={selectedBuildingId === 'b_ece' ? '2.5' : '1.5'}
          />
          <rect
            x="355"
            y="560"
            width="85"
            height="55"
            rx="6"
            fill={selectedBuildingId === 'b_ece' ? '#e0e7ff' : '#e2e8f0'}
            stroke={selectedBuildingId === 'b_ece' ? '#4f46e5' : '#cbd5e1'}
            strokeWidth={selectedBuildingId === 'b_ece' ? '2.5' : '1.5'}
          />
          <text
            x="280"
            y="575"
            textAnchor="middle"
            fill="#1e293b"
            fontSize="13"
            fontWeight="bold"
          >
            ECE Department
          </text>
        </g>

        {/* BUILDING 2: MECHANICAL Department */}
        <g
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_mech');
            if (b) onSelectBuilding(b);
          }}
          onMouseEnter={() => setHoveredBuilding('b_mech')}
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          <rect
            x="45"
            y="490"
            width="140"
            height="65"
            rx="6"
            fill={selectedBuildingId === 'b_mech' ? '#e0e7ff' : '#e2e8f0'}
            stroke={selectedBuildingId === 'b_mech' ? '#4f46e5' : '#cbd5e1'}
            strokeWidth={selectedBuildingId === 'b_mech' ? '2.5' : '1.5'}
          />
          <text
            x="115"
            y="515"
            textAnchor="middle"
            fill="#1e293b"
            fontSize="12"
            fontWeight="bold"
          >
            MECHANICAL
          </text>
          <text
            x="115"
            y="532"
            textAnchor="middle"
            fill="#334155"
            fontSize="11"
            fontWeight="600"
          >
            Department
          </text>
          <text
            x="135"
            y="550"
            textAnchor="middle"
            fill="#475569"
            fontSize="11"
          >
            Mech డిపార్ట్‌మెంట్
          </text>
        </g>

        {/* BUILDING 3: Workshop Laboratory */}
        <g
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_wks');
            if (b) onSelectBuilding(b);
          }}
          onMouseEnter={() => setHoveredBuilding('b_wks')}
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          <rect
            x="225"
            y="435"
            width="120"
            height="40"
            rx="5"
            fill={selectedBuildingId === 'b_wks' ? '#e0e7ff' : '#e2e8f0'}
            stroke={selectedBuildingId === 'b_wks' ? '#4f46e5' : '#cbd5e1'}
            strokeWidth={selectedBuildingId === 'b_wks' ? '2.5' : '1.5'}
          />
          <text
            x="215"
            y="430"
            textAnchor="middle"
            fill="#334155"
            fontSize="12"
            fontWeight="600"
          >
            Workshop Labortary
          </text>
        </g>

        {/* BUILDING 4: Chemistry Laboratory */}
        <g
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_chem');
            if (b) onSelectBuilding(b);
          }}
          onMouseEnter={() => setHoveredBuilding('b_chem')}
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          <polygon
            points="385,320 495,300 480,440 400,430 420,380 375,370"
            fill={selectedBuildingId === 'b_chem' ? '#e0e7ff' : '#e2e8f0'}
            stroke={selectedBuildingId === 'b_chem' ? '#4f46e5' : '#cbd5e1'}
            strokeWidth={selectedBuildingId === 'b_chem' ? '2.5' : '1.5'}
          />
          <text
            x="380"
            y="360"
            textAnchor="middle"
            fill="#334155"
            fontSize="12"
            fontWeight="600"
          >
            Chemistry Labortary
          </text>
        </g>

        {/* BUILDING 5: Central Administration Block */}
        <g
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_admin');
            if (b) onSelectBuilding(b);
          }}
          onMouseEnter={() => setHoveredBuilding('b_admin')}
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          <polygon
            points="465,465 525,480 500,565 440,550"
            fill={selectedBuildingId === 'b_admin' ? '#e0e7ff' : '#e2e8f0'}
            stroke={selectedBuildingId === 'b_admin' ? '#4f46e5' : '#cbd5e1'}
            strokeWidth={selectedBuildingId === 'b_admin' ? '2.5' : '1.5'}
          />
          {/* Graduation cap circle marker matching the map image */}
          <circle cx="495" cy="510" r="14" fill="#64748b" stroke="#ffffff" strokeWidth="2" />
          <path
            d="M 488,510 L 495,505 L 502,510 L 495,515 Z M 491,512 L 491,516 C 491,518 499,518 499,516 L 499,512"
            fill="#ffffff"
          />
        </g>

        {/* BUILDING 6: MVGR.Engg College Main Gate Landmark */}
        <g
          className="cursor-pointer"
          onClick={() => {
            const b = buildings.find(x => x.id === 'b_gate');
            if (b) onSelectBuilding(b);
          }}
          onMouseEnter={() => setHoveredBuilding('b_gate')}
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          <circle cx="855" cy="525" r="16" fill="#64748b" stroke="#ffffff" strokeWidth="2.5" />
          <path
            d="M 847,525 L 855,520 L 863,525 L 855,530 Z M 850,527 L 850,531 C 850,533 860,533 860,531 L 860,527"
            fill="#ffffff"
          />
          <text
            x="880"
            y="515"
            fill="#1e293b"
            fontSize="14"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            MVGR.Engg
          </text>
          <text
            x="880"
            y="534"
            fill="#1e293b"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            College Main Gate
          </text>
          <text
            x="880"
            y="552"
            fill="#475569"
            fontSize="11"
            fontFamily="sans-serif"
          >
            గ్.ఎంగ్ కాలేజీ మెయిన్ గేట్
          </text>
        </g>

        {/* Interactive Lost & Found Pulse Pins on Buildings */}
        {mapNodes.map((node) => {
          const b = buildings.find(x => x.id === node.id);
          const isSelected = selectedBuildingId === node.id;
          const lostCount = lostCountsByBuilding[node.name] || b?.lostCount || 0;
          const foundCount = foundCountsByBuilding[node.name] || b?.foundCount || 0;
          const hasItems = lostCount > 0 || foundCount > 0;

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => {
                if (b) onSelectBuilding(b);
              }}
            >
              {isSelected && (
                <circle
                  cx={node.badgePos.x}
                  cy={node.badgePos.y}
                  r="18"
                  fill="#6366f1"
                  opacity="0.3"
                  className="animate-ping"
                />
              )}

              {/* Pin marker */}
              <circle
                cx={node.badgePos.x}
                cy={node.badgePos.y}
                r="10"
                fill={isSelected ? '#4f46e5' : hasItems ? '#059669' : '#334155'}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {hasItems && (
                <text
                  x={node.badgePos.x}
                  y={node.badgePos.y + 3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {lostCount + foundCount}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend Footer */}
      <div className="p-3 bg-white border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="font-medium text-slate-900">Selected Landmark</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="font-medium text-slate-900">Active Campus Checkpoints</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span className="font-medium text-slate-900">Academic &amp; Lab Facilities</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          MVGR College of Engineering · Vizianagaram Campus
        </div>
      </div>
    </div>
  );
};
