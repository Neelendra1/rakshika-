import React, { useEffect, useState } from "react";
import { Compass, ShieldAlert, Navigation, User, MapPin } from "lucide-react";

interface MapSimulatorProps {
  progress: number; // 0 to 100
  city: string;
  pickup: string;
  destination: string;
  sosActive: boolean;
  bouncerName: string;
}

export const MapSimulator: React.FC<MapSimulatorProps> = ({
  progress,
  city,
  pickup,
  destination,
  sosActive,
  bouncerName,
}) => {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map coordinate coordinates (relative positions on our SVG grid 0-400)
  const pickupPoint = { x: 80, y: 320 };
  const destPoint = { x: 320, y: 80 };

  // Calculate current transit positions on map path (S-curve path)
  const getPathPoint = (t: number) => {
    // A beautiful smooth cubic-like spline between pickup and destination
    const ratio = t / 100;
    const x = pickupPoint.x + (destPoint.x - pickupPoint.x) * ratio;
    // Introduce a lovely curve to make it look like real city roads
    const offset = Math.sin(ratio * Math.PI) * 60;
    const y = pickupPoint.y + (destPoint.y - pickupPoint.y) * ratio - offset;
    return { x, y };
  };

  const userPoint = getPathPoint(progress);
  // Bouncer is either catching up or right next to the user.
  // Let's place the bouncer slightly behind the user or on the user point based on status
  const bouncerPoint = getPathPoint(Math.max(0, progress - 8));

  // Generate some simulated city grid streets
  const streets = [
    { x1: 50, y1: 50, x2: 350, y2: 50 },
    { x1: 50, y1: 150, x2: 350, y2: 150 },
    { x1: 50, y1: 250, x2: 350, y2: 250 },
    { x1: 50, y1: 350, x2: 350, y2: 350 },
    { x1: 50, y1: 50, x2: 50, y2: 350 },
    { x1: 150, y1: 50, x2: 150, y2: 350 },
    { x1: 250, y1: 50, x2: 250, y2: 350 },
    { x1: 350, y1: 50, x2: 350, y2: 350 },
  ];

  // Simulated GPS Coordinates for telemetry
  const startLat = city.includes("Mumbai") ? 19.0760 : city.includes("Bengaluru") ? 12.9716 : 28.6139; // Delhi as default
  const startLng = city.includes("Mumbai") ? 72.8777 : city.includes("Bengaluru") ? 77.5946 : 77.2090;

  const currentLat = (startLat + (progress / 100) * 0.045).toFixed(5);
  const currentLng = (startLng + (progress / 100) * 0.038).toFixed(5);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden rounded-2xl border border-slate-200 flex flex-col">
      {/* Telemetry Header */}
      <div className="absolute top-2 left-2 right-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between z-10 text-[10px] font-mono text-slate-600 shadow-3xs">
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${sosActive ? "bg-red-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
          <span className="font-semibold text-slate-800">GPS LIVE: {city}</span>
        </div>
        <div className="flex gap-2 text-slate-400 font-medium">
          <span>LAT: {currentLat}</span>
          <span>LNG: {currentLng}</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full relative bg-slate-50/50">
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          {/* Background Grid Accent */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Simulated Streets */}
          {streets.map((st, idx) => (
            <line
              key={idx}
              x1={st.x1}
              y1={st.y1}
              x2={st.x2}
              y2={st.y2}
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ))}

          {/* Custom curvy highway path of transit */}
          <path
            d={`M ${pickupPoint.x} ${pickupPoint.y} 
                C 140 380, 180 200, ${getPathPoint(50).x} ${getPathPoint(50).y} 
                S 280 40, ${destPoint.x} ${destPoint.y}`}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Active transit line trace */}
          <path
            d={`M ${pickupPoint.x} ${pickupPoint.y} 
                C 140 380, 180 200, ${getPathPoint(Math.min(50, progress)).x} ${getPathPoint(Math.min(50, progress)).y}
                ${progress > 50 ? `S 280 40, ${userPoint.x} ${userPoint.y}` : ""}`}
            fill="none"
            stroke={sosActive ? "#ef4444" : "#10b981"}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Landmarks / Safety Hub Points */}
          <circle cx="150" cy="250" r="3.5" fill="#64748b" />
          <text x="158" y="253" fill="#475569" className="text-[8px] font-mono font-medium">Safe House</text>

          <circle cx="280" cy="180" r="3.5" fill="#64748b" />
          <text x="288" y="183" fill="#475569" className="text-[8px] font-mono font-medium">Police Beat 7</text>

          {/* SOS Radar Sweep Ring */}
          {sosActive && (
            <circle
              cx={userPoint.x}
              cy={userPoint.y}
              r={pulse ? 50 : 120}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              className="transition-all duration-1000 ease-out opacity-40"
            />
          )}

          {/* Pickup Pin */}
          <circle cx={pickupPoint.x} cy={pickupPoint.y} r="7" fill="rgba(16, 185, 129, 0.15)" />
          <circle cx={pickupPoint.x} cy={pickupPoint.y} r="2.5" fill="#10b981" />

          {/* Destination Pin */}
          <circle cx={destPoint.x} cy={destPoint.y} r="7" fill="rgba(79, 70, 229, 0.15)" />
          <circle cx={destPoint.x} cy={destPoint.y} r="2.5" fill="#4f46e5" />

          {/* Lady Bouncer Icon Position */}
          {progress > 0 && progress < 100 && (
            <g className="transition-all duration-300">
              <circle
                cx={bouncerPoint.x}
                cy={bouncerPoint.y}
                r="10"
                fill="rgba(245, 158, 11, 0.2)"
                className="animate-pulse"
              />
              <circle cx={bouncerPoint.x} cy={bouncerPoint.y} r="4.5" fill="#f59e0b" />
            </g>
          )}

          {/* Daughter / User Marker Position */}
          <g className="transition-all duration-300">
            <circle
              cx={userPoint.x}
              cy={userPoint.y}
              r="12"
              fill={sosActive ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.2)"}
              className={sosActive ? "animate-ping" : ""}
            />
            <circle cx={userPoint.x} cy={userPoint.y} r="5.5" fill={sosActive ? "#ef4444" : "#10b981"} />
          </g>
        </svg>

        {/* Floating Pin Labels */}
        <div
          className="absolute bg-white/90 backdrop-blur-xs border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs text-slate-700 z-10 select-none pointer-events-none transform -translate-x-1/2 -translate-y-6"
          style={{ left: `${(pickupPoint.x / 400) * 100}%`, top: `${(pickupPoint.y / 400) * 100}%` }}
        >
          📍 Pickup
        </div>
        <div
          className="absolute bg-white/90 backdrop-blur-xs border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs text-slate-700 z-10 select-none pointer-events-none transform -translate-x-1/2 -translate-y-6"
          style={{ left: `${(destPoint.x / 400) * 100}%`, top: `${(destPoint.y / 400) * 100}%` }}
        >
          🏁 Destination
        </div>

        {/* Floating Daughter / User Indicator */}
        <div
          className="absolute bg-slate-900 border border-slate-800 text-[9px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md transform -translate-x-1/2 -translate-y-8 transition-all duration-300 z-20"
          style={{ left: `${(userPoint.x / 400) * 100}%`, top: `${(userPoint.y / 400) * 100}%` }}
        >
          <User className="w-2.5 h-2.5 text-emerald-400" />
          <span>Client Location</span>
        </div>

        {/* Floating Bouncer Indicator */}
        {progress > 0 && progress < 100 && (
          <div
            className="absolute bg-amber-500 border border-amber-600 text-[9px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transform -translate-x-1/2 translate-y-3 transition-all duration-300 z-20"
            style={{ left: `${(bouncerPoint.x / 400) * 100}%`, top: `${(bouncerPoint.y / 400) * 100}%` }}
          >
            <Compass className="w-2.5 h-2.5 text-white animate-spin" style={{ animationDuration: "3s" }} />
            <span>{bouncerName.split(" ")[0]} (Lady Guard)</span>
          </div>
        )}
      </div>

      {/* Map Footer Information bar */}
      <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-left">
        <div className="text-slate-500 truncate max-w-[60%]">
          <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-mono font-bold">Transit Location</span>
          <span className="text-slate-850 font-semibold font-sans truncate block">{progress === 100 ? destination : progress === 0 ? pickup : `Securing route to safety`}</span>
        </div>
        <div className="text-right font-mono">
          <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Status</span>
          <span className={sosActive ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
            {sosActive ? "SOS EMERGENCY" : progress === 0 ? "Bouncer Appointed" : progress === 100 ? "Secured Arrival" : `${progress}% Secured`}
          </span>
        </div>
      </div>
    </div>
  );
};
