import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  PhoneCall, 
  Lock, 
  Volume2, 
  VolumeX, 
  Bluetooth, 
  Activity, 
  Signal, 
  Eye, 
  Wifi,
  ChevronDown,
  ChevronUp,
  Cpu,
  User
} from "lucide-react";
import { Booking, LadyBouncer, SystemNotification } from "../types";
import { MapSimulator } from "./MapSimulator";
import { sendBrowserNotification, triggerOfflineSmsSOS } from "../utils/notifications";

interface TrackingDashboardProps {
  activeBooking: Booking;
  bouncers: LadyBouncer[];
  notifications: SystemNotification[];
  sosActive: boolean;
  systemProgress: number;
  onUpdateStatus: (status: Booking["status"]) => void;
  onTriggerSOS: (active: boolean) => void;
  onSendTelemetry: (progress: number, lat?: number, lng?: number) => void;
  socketConnected: boolean;
}

export const TrackingDashboard: React.FC<TrackingDashboardProps> = ({
  activeBooking,
  bouncers,
  notifications,
  sosActive,
  systemProgress,
  onUpdateStatus,
  onTriggerSOS,
  onSendTelemetry,
  socketConnected,
}) => {
  const [sirenOn, setSirenOn] = useState(false);
  const [simulatedCallActive, setSimulatedCallActive] = useState(false);
  const [showSimControls, setShowSimControls] = useState(true);
  const [autoSimulateProgress, setAutoSimulateProgress] = useState(true);
  const [walkieTalkieSpeaking, setWalkieTalkieSpeaking] = useState(false);
  const [bleRSSI, setBleRSSI] = useState(-58);

  const assignedBouncer = bouncers.find((b) => b.id === activeBooking.bouncerId);

  // Auto-progress simulation logic (driven by this client if autoSimulateProgress is checked)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeBooking.status === "active" && !sosActive && autoSimulateProgress) {
      timer = setInterval(() => {
        if (systemProgress < 100) {
          const nextProgress = Math.min(100, systemProgress + 1);
          
          // Calculate simulated coordinate offsets based on progress
          const startLat = activeBooking.pickupLocation.includes("Mumbai") ? 19.0760 : activeBooking.pickupLocation.includes("Bengaluru") ? 12.9716 : 28.6139;
          const startLng = activeBooking.pickupLocation.includes("Mumbai") ? 72.8777 : activeBooking.pickupLocation.includes("Bengaluru") ? 77.5946 : 77.2090;
          const currentLat = startLat + (nextProgress / 100) * 0.045;
          const currentLng = startLng + (nextProgress / 100) * 0.038;

          onSendTelemetry(nextProgress, currentLat, currentLng);

          if (nextProgress === 100) {
            onUpdateStatus("completed");
          }
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [activeBooking.status, sosActive, autoSimulateProgress, systemProgress]);

  // Handle status step auto advancement from Confirmed -> En Route -> Active
  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;

    if (activeBooking.status === "confirmed") {
      t1 = setTimeout(() => {
        onUpdateStatus("en_route");
      }, 4000);
    }

    if (activeBooking.status === "en_route") {
      t2 = setTimeout(() => {
        onUpdateStatus("active");
      }, 8000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeBooking.status]);

  // Fluctuating BLE RSSI if Bluetooth mesh mode is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeBooking.isOfflineBluetooth && activeBooking.status === "active") {
      timer = setInterval(() => {
        setBleRSSI((prev) => {
          const delta = Math.floor(Math.random() * 5) - 2;
          const next = prev + delta;
          return Math.max(-85, Math.min(-45, next));
        });
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [activeBooking.isOfflineBluetooth, activeBooking.status]);

  // Audio synthetic beep trigger for SOS Alert
  useEffect(() => {
    let beepInterval: NodeJS.Timeout;
    if (sosActive && sirenOn) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      beepInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 high pitch
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15); // short beep
      }, 600);
    }
    return () => clearInterval(beepInterval);
  }, [sosActive, sirenOn]);

  // Real Device HTML5 Geolocation Watcher for live user tracking
  useEffect(() => {
    let watchId: number;
    if (activeBooking.status === "active" && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          onSendTelemetry(systemProgress, pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.warn("Live Geolocation notice:", err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeBooking.status, systemProgress]);

  const toggleSOS = () => {
    const nextSosState = !sosActive;
    onTriggerSOS(nextSosState);

    if (nextSosState) {
      setSirenOn(true);
      sendBrowserNotification("🚨 EMERGENCY SOS TRIGGERED!", {
        body: `Rakshika physical security dispatch initiated for ${activeBooking.daughterName || "Client"}.`,
        tag: "rakshika-sos"
      });

      // Cellular SMS fallback if offline
      if (!navigator.onLine) {
        triggerOfflineSmsSOS(
          [{ name: "Emergency Contact", phone: activeBooking.parentPhone || "112" }],
          activeBooking.liveCoordinates
        );
      }
    } else {
      setSirenOn(false);
    }
  };

  const getStatusBadgeClass = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-200";
      case "en_route": return "bg-amber-50 text-amber-700 border-amber-200";
      case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse";
      case "completed": return "bg-slate-900 text-white border-slate-900";
      case "cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Dynamic Status Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
            <Activity className={`w-5 h-5 ${activeBooking.status === "active" ? "text-emerald-600 animate-pulse" : "text-slate-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Daughter Transit System</span>
              <span className={`px-2 py-0.5 border text-[9px] font-bold font-mono rounded uppercase ${getStatusBadgeClass(activeBooking.status)}`}>
                {activeBooking.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-655 font-medium mt-0.5">
              Transit Route: <strong className="text-slate-800">{activeBooking.pickupLocation}</strong> to <strong className="text-slate-800">{activeBooking.destinationLocation}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Signal Indicator */}
          <div className="bg-slate-50 border border-slate-250/60 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-slate-600 text-[10px] font-bold">
              {socketConnected ? "LIVE WEBSOCKET DATA" : "BACKEND OFFLINE"}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-250/60 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Cryptographic Secure PIN</span>
            <span className="text-sm font-bold text-emerald-600 tracking-widest">{activeBooking.securityPin}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Map & Stream) / Right (Details & Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Map and Body-Cam Uplink (8 cols) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Active SOS Panel */}
          {sosActive && (
            <div className="bg-red-600 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-lg shadow-red-200">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-10 h-10 animate-bounce text-white flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold tracking-widest font-mono uppercase">🚨 CRITICAL SOS EMERGENCY ALARM</h3>
                  <p className="text-xs text-red-100 mt-0.5 leading-relaxed font-sans">
                    Daughter triggered panic beacon. Live audio and location streaming directly to Police HQ PCR units. Nearest dispatch force alerted.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setSirenOn(!sirenOn)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg p-2 transition-all"
                  title="Toggle Local Siren Alarm"
                >
                  {sirenOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleSOS}
                  className="bg-white hover:bg-slate-100 text-red-700 text-xs font-bold font-mono px-4 py-2.5 rounded-lg transition-all shadow-md"
                >
                  DISMISS / RESOLVE SOS
                </button>
              </div>
            </div>
          )}

          {/* GPS Tracking Map */}
          <div className="h-[360px] md:h-[420px]">
            <MapSimulator
              progress={systemProgress}
              city={assignedBouncer?.currentCity || "Delhi NCR"}
              pickup={activeBooking.pickupLocation}
              destination={activeBooking.destinationLocation}
              sosActive={sosActive}
              bouncerName={assignedBouncer?.name || "Lady Guard"}
            />
          </div>

          {/* Body Camera Broadcast Stream */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-md flex flex-col">
            <div className="bg-slate-900 border-b border-slate-850 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-650 animate-ping" />
                <span className="text-[10px] font-bold font-mono text-slate-300 tracking-wider">
                  BODY-CAM BROADCAST STREAM • {assignedBouncer?.verificationId || "POL-DEL-74291"}
                </span>
              </div>
              <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                1080p @ 30 FPS • H.265 Encrypted
              </span>
            </div>

            {/* Visual Monitor Screen */}
            <div className="relative aspect-video max-h-[340px] bg-slate-900 overflow-hidden flex items-center justify-center group">
              {/* Retro scanlines overlay */}
              <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-15" />
              
              {/* Static visual overlay if SOS active */}
              {sosActive && (
                <div className="absolute inset-0 bg-red-950/20 pointer-events-none animate-pulse z-1" />
              )}

              {/* Mock camera view */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 z-2 text-white font-mono text-[10px]">
                {/* Top Overlay */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-red-600/90 font-bold px-1.5 py-0.5 rounded text-white flex items-center gap-1 w-max">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> REC
                    </span>
                    <span className="block text-slate-300">GUARD: {assignedBouncer?.name.toUpperCase()}</span>
                  </div>
                  <div className="text-right text-slate-300">
                    <span>{new Date().toISOString().split("T")[0]}</span>
                    <span className="block mt-0.5 font-bold">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Center Audio Activity */}
                <div className="flex flex-col items-center justify-center self-center py-6">
                  {sosActive ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1 bg-red-500 h-8 rounded animate-audioWave1" />
                      <div className="w-1 bg-red-500 h-12 rounded animate-audioWave2 mx-1" />
                      <div className="w-1 bg-red-500 h-6 rounded animate-audioWave3" />
                      <div className="w-1 bg-red-500 h-10 rounded animate-audioWave4 mx-1" />
                      <div className="w-1 bg-red-500 h-4 rounded animate-audioWave1" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-1 bg-emerald-500 h-3 rounded" />
                      <div className="w-1 bg-emerald-500 h-4 rounded mx-1" />
                      <div className="w-1 bg-emerald-500 h-2 rounded" />
                      <div className="w-1 bg-emerald-500 h-3 rounded mx-1" />
                      <div className="w-1 bg-emerald-500 h-2.5 rounded" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-400 mt-2 tracking-widest font-mono uppercase">
                    {sosActive ? "🚨 LIVE MIC UPLINK BROADCASTING" : "ENCRYPTED AUDIO LOCK ACTIVE"}
                  </span>
                </div>

                {/* Bottom Overlay */}
                <div className="flex justify-between items-end border-t border-white/10 pt-2 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Telemetry status</span>
                    <span className="text-emerald-400 font-bold">
                      GPS LOCKED ({systemProgress}% Route Progress)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">BATTERY: 98%</span>
                    <span className="text-slate-350">|</span>
                    <span className="text-slate-300">SIGNAL: {sosActive ? "STRONG 5G" : "SECURE MESH"}</span>
                  </div>
                </div>
              </div>

              {/* Grid graphic inside camera viewport */}
              <div className="absolute inset-0 border border-white/5 pointer-events-none flex items-center justify-center">
                <div className="w-[120px] h-[120px] border border-dashed border-white/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Guard Details, Timeline Logs & Simulation Controllers (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* Lady Guard Registry Card */}
          {assignedBouncer && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider border-b border-slate-100 pb-2">
                Assigned Officer
              </h4>

              <div className="flex gap-4">
                <img
                  src={assignedBouncer.avatar}
                  alt={assignedBouncer.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-900">{assignedBouncer.name}</h5>
                  <div className="text-[10px] text-slate-500 font-medium">
                    <span>ID Verification: </span>
                    <strong className="text-emerald-700 font-mono bg-emerald-50 border border-emerald-100 px-1 rounded">
                      {assignedBouncer.verificationId}
                    </strong>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full inline-block">
                    {assignedBouncer.experienceYears} yrs experience
                  </span>
                </div>
              </div>

              {/* Squad Protection Badge */}
              {activeBooking.guardCount && activeBooking.guardCount > 1 && (
                <div className="bg-gradient-to-r from-pink-50 to-blue-50 border border-pink-200/80 p-2.5 rounded-xl flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-900">👥 Guard Squad Active:</span>
                  <span className="bg-pink-100 text-pink-800 border border-pink-200 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    {activeBooking.guardCount} Lady Guards Dispatched
                  </span>
                </div>
              )}

              {/* Vetting summary grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-650 bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                <div className="flex items-center gap-1 text-slate-800">
                  <span className="text-emerald-600 font-bold">✓</span> Aadhaar Linked
                </div>
                <div className="flex items-center gap-1 text-slate-800">
                  <span className="text-emerald-600 font-bold">✓</span> IPC Vetted
                </div>
                <div className="flex items-center gap-1 text-slate-800">
                  <span className="text-emerald-600 font-bold">✓</span> CPR Certified
                </div>
                <div className="flex items-center gap-1 text-slate-800">
                  <span className="text-emerald-600 font-bold">✓</span> Body-cam Synced
                </div>
              </div>
            </div>
          )}

          {/* Timeline / Live Telemetry Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col h-80">
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Telemetry Notification Hub</span>
              <span className="text-[9px] text-slate-400 tracking-normal font-sans">Real-time Feed</span>
            </h4>

            <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 pr-1 font-mono text-[10.5px]">
              {notifications.map((notif) => (
                <div key={notif.id} className="border-l-2 border-slate-200 pl-3 py-1.5 text-slate-600 text-left">
                  <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                    <span>{notif.timestamp}</span>
                    <span className={`px-1.5 rounded text-[8px] font-bold ${
                      notif.type === "sos" ? "bg-red-50 text-red-600 border border-red-200" :
                      notif.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      notif.type === "warning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      {notif.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-850 leading-normal">{notif.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-sans">
                  No active logs.
                </div>
              )}
            </div>
          </div>

          {/* SIMULATOR CONTROLLER PANEL (ACCORDION DRAWER) */}
          <div className="bg-slate-900 border border-slate-855 text-white rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => setShowSimControls(!showSimControls)}
              className="w-full bg-slate-950 px-4 py-3 flex items-center justify-between font-mono text-xs font-bold tracking-wider uppercase text-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-500" />
                Safety Test Controls
              </span>
              {showSimControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSimControls && (
              <div className="p-4 space-y-4 text-left text-xs font-mono bg-slate-900/90 border-t border-slate-850">
                {/* 1. Simulate Progress Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">
                    Auto-simulate GPS Movement
                  </label>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-300">
                      Increment progress 1% every 1.5s
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoSimulateProgress(!autoSimulateProgress)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${autoSimulateProgress ? "bg-emerald-500" : "bg-slate-700"}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all ${autoSimulateProgress ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* 2. Manual Progress Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                    <span>Manual GPS Progress</span>
                    <span className="text-emerald-400">{systemProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={systemProgress}
                    onChange={(e) => {
                      setAutoSimulateProgress(false);
                      onSendTelemetry(Number(e.target.value));
                      if (Number(e.target.value) === 100) {
                        onUpdateStatus("completed");
                      }
                    }}
                    className="w-full accent-emerald-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 3. Emergency SOS Trigger Test */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">
                    Trigger Urgent SOS Alert (Daughter Simulator)
                  </label>
                  <button
                    onClick={toggleSOS}
                    className={`w-full py-2.5 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      sosActive
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-red-650 hover:bg-red-700 text-white"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {sosActive ? "RESOLVE SOS EMERGENCY" : "TRIGGER SOS PANIC ALERT"}
                  </button>
                </div>

                {/* 4. Extra Telemetry Checks */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setWalkieTalkieSpeaking(true);
                      setTimeout(() => setWalkieTalkieSpeaking(false), 3000);
                    }}
                    disabled={walkieTalkieSpeaking}
                    className="bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300 py-1.5 rounded hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {walkieTalkieSpeaking ? "🗣️ SPEAKING..." : "🎙️ MIC WALKIE"}
                  </button>
                  
                  <div className="bg-slate-950 border border-slate-800 rounded p-1 text-[9px] text-slate-400 flex items-center justify-center gap-1">
                    <Bluetooth className="w-3 h-3 text-blue-500" />
                    <span>RSSI: {bleRSSI} dBm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};
