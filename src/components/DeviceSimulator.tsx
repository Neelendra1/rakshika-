import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ShieldAlert,
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Compass, 
  ArrowRight, 
  PhoneCall, 
  Lock, 
  ChevronRight, 
  CreditCard, 
  UserCheck, 
  Volume2, 
  VolumeX,
  Smartphone,
  BookOpen,
  Calendar,
  IndianRupee,
  Eye,
  Bell,
  Wifi,
  WifiOff,
  Bluetooth,
  Train,
  School,
  Radio,
  Signal,
  RefreshCw
} from "lucide-react";
import { LadyBouncer, Booking } from "../types";
import { MapSimulator } from "./MapSimulator";

interface DeviceSimulatorProps {
  bouncers: LadyBouncer[];
  activeBooking: Booking | null;
  onNewBooking: (booking: Booking) => void;
  onUpdateBookingStatus: (status: Booking["status"]) => void;
  onTriggerSOS: (active: boolean) => void;
  sosActive: boolean;
  systemProgress: number; // 0 to 100 for path trace
  setSystemProgress: React.Dispatch<React.SetStateAction<number>>;
  selectedBouncer: LadyBouncer | null;
  setSelectedBouncer: (bouncer: LadyBouncer | null) => void;
  osType: "ios" | "android";
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({
  bouncers,
  activeBooking,
  onNewBooking,
  onUpdateBookingStatus,
  onTriggerSOS,
  sosActive,
  systemProgress,
  setSystemProgress,
  selectedBouncer,
  setSelectedBouncer,
  osType,
}) => {
  // Mobile screens: "splash" | "home" | "bouncer_select" | "payment" | "tracking" | "sos_panel"
  const [screen, setScreen] = useState<"splash" | "home" | "bouncer_select" | "payment" | "tracking">("splash");
  
  // Local Booking Form State
  const [bookingType, setBookingType] = useState<"hourly_transit" | "event_protection">("hourly_transit");
  const [pickup, setPickup] = useState("Vasant Kunj Metro, New Delhi");
  const [destination, setDestination] = useState("Amity University Campus, Noida");
  const [hours, setHours] = useState(3);
  const [date, setDate] = useState("2026-07-16");
  const [timeSlot, setTimeSlot] = useState("20:30");
  const [isForDaughter, setIsForDaughter] = useState(true);
  const [daughterName, setDaughterName] = useState("Anjali Sharma");
  const [parentPhone, setParentPhone] = useState("+91 98102 45892");
  const [parentName, setParentName] = useState("Rajesh Sharma");

  // Inter-city Exam Travel & Offline Bluetooth States
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);
  const [travelMode, setTravelMode] = useState<"train" | "bus" | "other">("train");
  const [ticketDetails, setTicketDetails] = useState("PNR 425894101 (Dehradun Exp)");
  const [arrivalPlatform, setArrivalPlatform] = useState("Platform 4, New Delhi Station");
  const [examCenter, setExamCenter] = useState("Kendriya Vidyalaya Exam Hall, Sector 8");

  // BLE Scan states
  const [bleScanning, setBleScanning] = useState(false);
  const [bleScannerTicks, setBleScannerTicks] = useState(0);
  const [bleRSSI, setBleRSSI] = useState(-58);
  const [walkieTalkieSpeaking, setWalkieTalkieSpeaking] = useState(false);
  const [offlineSOSBeaconSent, setOfflineSOSBeaconSent] = useState(false);

  // Simulated Alert Audio / Siren Toggle
  const [sirenOn, setSirenOn] = useState(false);
  const [simulatedCallActive, setSimulatedCallActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  // BLE Scanner loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bleScanning) {
      setBleScannerTicks(0);
      interval = setInterval(() => {
        setBleScannerTicks((prev) => {
          if (prev >= 100) {
            setBleScanning(false);
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [bleScanning]);

  // Fluctuating Bluetooth signal RSSI
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeBooking && activeBooking.isOfflineBluetooth && activeBooking.status === "active") {
      interval = setInterval(() => {
        setBleRSSI((prev) => {
          const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const next = prev + delta;
          return Math.max(-85, Math.min(-45, next));
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeBooking]);

  // Auto incremental movement simulator for GPS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeBooking && activeBooking.status === "active" && !sosActive) {
      interval = setInterval(() => {
        setSystemProgress((prev) => {
          if (prev >= 100) {
            onUpdateBookingStatus("completed");
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [activeBooking, sosActive]);

  // SOS Alert Audio synthetic beeper
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let interval: NodeJS.Timeout;

    if (sosActive && sirenOn) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        interval = setInterval(() => {
          if (!audioCtx) return;
          oscillator = audioCtx.createOscillator();
          gainNode = audioCtx.createGain();
          
          oscillator.type = "sawtooth";
          // High-pitch dual frequency safety alert
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.4);
          
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.5);
        }, 600);
      } catch (err) {
        console.log("Audio simulation blocked by policy");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (oscillator) {
        try { oscillator.stop(); } catch(e){}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch(e){}
      }
    };
  }, [sosActive, sirenOn]);

  // Handle countdown trigger
  const handleSOSPress = () => {
    if (sosActive) {
      // Turn off
      onTriggerSOS(false);
      setSirenOn(false);
      setSimulatedCallActive(false);
      setSosCountdown(null);
    } else {
      setSosCountdown(3);
    }
  };

  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown === 0) {
      onTriggerSOS(true);
      setSirenOn(true);
      setSosCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  // Handle Bookings Submission
  const handleProceedToBouncers = () => {
    setScreen("bouncer_select");
  };

  const handleSelectBouncer = (bouncer: LadyBouncer) => {
    setSelectedBouncer(bouncer);
    setScreen("payment");
  };

  const handleCompletePayment = () => {
    if (!selectedBouncer) return;

    // Generate random 4-digit verification code
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    const booking: Booking = {
      id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      bouncerId: selectedBouncer.id,
      clientName: isForDaughter ? "Rajesh Sharma (Father)" : "Anjali Sharma",
      daughterName: isForDaughter ? daughterName : undefined,
      parentPhone: isForDaughter ? parentPhone : undefined,
      parentName: isForDaughter ? parentName : undefined,
      type: bookingType === "hourly_transit" ? "hourly_transit" : "event_protection",
      date,
      timeSlot,
      hours,
      pickupLocation: isExamMode ? pickup : pickup,
      destinationLocation: isExamMode ? examCenter : destination,
      amountPaid: selectedBouncer.hourlyRate * hours,
      status: "confirmed",
      securityPin: pin,
      liveCoordinates: { lat: 28.6139, lng: 77.2090 },
      trackerProgress: 0,
      // Exam mode fields
      isExamMode,
      travelMode: isExamMode ? travelMode : undefined,
      ticketDetails: isExamMode ? ticketDetails : undefined,
      arrivalPlatform: isExamMode ? arrivalPlatform : undefined,
      examCenter: isExamMode ? examCenter : undefined,
    };

    onNewBooking(booking);
    setSystemProgress(0);
    setScreen("tracking");

    // Automatically transition from Confirmed -> En Route -> Active to simulate the flow
    setTimeout(() => {
      onUpdateBookingStatus("en_route");
    }, 3000);

    setTimeout(() => {
      onUpdateBookingStatus("active");
    }, 7000);
  };

  return (
    <div className={`relative mx-auto rounded-[48px] bg-white p-3.5 border-4 ${osType === "ios" ? "border-slate-200" : "border-slate-300"} shadow-xl w-full max-w-[365px] h-[720px] flex flex-col transition-all duration-300`}>
      {/* Device Frame Notch/Holepunch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-36 bg-white border-x border-b border-slate-100 rounded-b-2xl z-40 flex items-center justify-center">
        {osType === "ios" ? (
          <div className="w-20 h-2.5 bg-slate-200 rounded-full" />
        ) : (
          <div className="w-3.5 h-3.5 bg-slate-200 rounded-full border border-slate-100" />
        )}
      </div>

      {/* Screen Container */}
      <div className="flex-1 rounded-[38px] bg-white text-slate-900 overflow-hidden flex flex-col relative border border-slate-200 font-sans select-none shadow-inner">
        
        {/* Status Bar */}
        <div className="h-9 pt-3 px-6 flex items-center justify-between text-xs text-slate-400 font-medium z-30 font-mono bg-white/80 backdrop-blur-xs">
          <span>08:30 PM</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-600 font-semibold">Rakshika Active</span>
            <div className="w-5 h-2.5 bg-slate-100 rounded-sm border border-slate-200 p-0.5 flex">
              <div className="w-3 h-full bg-emerald-500 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Network Connection Switcher */}
        <div className="bg-slate-50 border-y border-slate-200/80 px-4 py-2 flex items-center justify-between text-[10px] z-30">
          <span className="text-slate-500 font-medium font-mono flex items-center gap-1">
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="text-amber-700 font-bold">Bluetooth Mesh Mode</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">LTE Online Cloud</span>
              </>
            )}
          </span>
          <button
            onClick={() => {
              setIsOfflineMode(!isOfflineMode);
              setOfflineSOSBeaconSent(false);
              setBleScanning(false);
              setBleScannerTicks(0);
              // Switch tracking or state back as needed
            }}
            className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all shadow-3xs active:scale-95 ${
              isOfflineMode 
                ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isOfflineMode ? "Go Online" : "Sim Offline"}
          </button>
        </div>

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-1 flex flex-col bg-white">
          
          {/* SPECIAL SCREEN: BLUETOOTH OFFLINE PEER MESH */}
          {isOfflineMode ? (
            <div className="flex-1 flex flex-col text-left py-2">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                <Bluetooth className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Off-Grid Peer Mesh</h3>
                  <p className="text-[9px] text-slate-400">Direct 2.4GHz BLE connection</p>
                </div>
              </div>

              {/* No Active Bluetooth Booking: Scanner Dashboard */}
              {(!activeBooking || !activeBooking.isOfflineBluetooth) ? (
                <div className="flex-1 flex flex-col justify-between">
                  
                  {/* Bluetooth Search Area */}
                  <div className="space-y-4">
                    {/* Device Status Banner */}
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[10px] text-amber-800 leading-relaxed">
                      <strong className="text-amber-900 block mb-0.5">📶 Zero Internet Fallback</strong>
                      Perfect for train coaches, bus waiting bays, and rural exam centers with zero network coverage. Locate and alert verified guards travelling alongside you.
                    </div>

                    {/* Radar Visualizer */}
                    {bleScanning ? (
                      <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                        {/* Circular animated pulse sweeps */}
                        <div className="absolute w-24 h-24 border border-emerald-500/30 rounded-full animate-ping animate-duration-1000" />
                        <div className="absolute w-16 h-16 border border-emerald-500/50 rounded-full animate-ping animate-duration-1500" />
                        <div className="relative bg-emerald-950 p-4 rounded-full border border-emerald-500 flex items-center justify-center animate-pulse">
                          <Radio className="w-8 h-8 text-emerald-400 animate-spin animate-duration-2000" />
                        </div>
                        <span className="text-xs font-bold text-emerald-400 font-mono mt-4">BLE MESH SCANNING</span>
                        <span className="text-[9px] text-slate-400 font-mono mt-1">Acquiring cryptographic beacons... {bleScannerTicks}%</span>
                      </div>
                    ) : bleScannerTicks === 100 ? (
                      // Display Scan Results
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                            Nearby Verified Lady Guards (2 discovered)
                          </span>
                          <button 
                            onClick={() => setBleScanning(true)} 
                            className="text-[9px] font-bold text-emerald-600 flex items-center gap-1"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Re-scan
                          </button>
                        </div>

                        {/* List of 2 closest bouncers traveling on same route */}
                        <div className="space-y-2">
                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex gap-2.5 relative">
                            <div className="absolute top-2 right-2 text-emerald-600 font-bold font-mono text-[9px] flex items-center gap-0.5">
                              <Signal className="w-3 h-3 text-emerald-500" /> -54dBm
                            </div>
                            <img
                              src={bouncers[0].avatar}
                              alt={bouncers[0].name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{bouncers[0].name}</h4>
                              <p className="text-[9px] text-slate-500">
                                <strong>Range:</strong> 8m • Travelling in Train Coach S4
                              </p>
                              <button
                                onClick={() => {
                                  // Instantly create offline booking
                                  const pin = Math.floor(1000 + Math.random() * 9000).toString();
                                  const booking: Booking = {
                                    id: `BK-OFF-${Math.floor(10000 + Math.random() * 90000)}`,
                                    bouncerId: bouncers[0].id,
                                    clientName: "Anjali Sharma (Offline)",
                                    daughterName: "Anjali Sharma",
                                    type: "hourly_transit",
                                    date: "2026-07-16",
                                    timeSlot: "LRT Mesh Link",
                                    hours: 2,
                                    pickupLocation: "Train Coach S4, Dehradun Exp",
                                    destinationLocation: "Platform exit gateway, Station",
                                    amountPaid: 0, // Settled later
                                    status: "active",
                                    securityPin: pin,
                                    liveCoordinates: { lat: 28.6139, lng: 77.2090 },
                                    trackerProgress: 0,
                                    isOfflineBluetooth: true
                                  };
                                  setSelectedBouncer(bouncers[0]);
                                  onNewBooking(booking);
                                  onUpdateBookingStatus("active");
                                }}
                                className="mt-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-3 py-1 rounded-md shadow-3xs"
                              >
                                Connect & Summon Locally
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex gap-2.5 relative">
                            <div className="absolute top-2 right-2 text-emerald-600 font-bold font-mono text-[9px] flex items-center gap-0.5">
                              <Signal className="w-3 h-3 text-emerald-500" /> -78dBm
                            </div>
                            <img
                              src={bouncers[2].avatar}
                              alt={bouncers[2].name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{bouncers[2].name}</h4>
                              <p className="text-[9px] text-slate-500">
                                <strong>Range:</strong> 22m • Near Platform Station waiting hall
                              </p>
                              <button
                                onClick={() => {
                                  // Instantly create offline booking
                                  const pin = Math.floor(1000 + Math.random() * 9000).toString();
                                  const booking: Booking = {
                                    id: `BK-OFF-${Math.floor(10000 + Math.random() * 90000)}`,
                                    bouncerId: bouncers[2].id,
                                    clientName: "Anjali Sharma (Offline)",
                                    daughterName: "Anjali Sharma",
                                    type: "hourly_transit",
                                    date: "2026-07-16",
                                    timeSlot: "LRT Mesh Link",
                                    hours: 2,
                                    pickupLocation: "Platform 12 Waiting Lounge",
                                    destinationLocation: "Exam Center Protection, Terminal",
                                    amountPaid: 0, // Settled later
                                    status: "active",
                                    securityPin: pin,
                                    liveCoordinates: { lat: 28.6139, lng: 77.2090 },
                                    trackerProgress: 0,
                                    isOfflineBluetooth: true
                                  };
                                  setSelectedBouncer(bouncers[2]);
                                  onNewBooking(booking);
                                  onUpdateBookingStatus("active");
                                }}
                                className="mt-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-3 py-1 rounded-md shadow-3xs"
                              >
                                Connect & Summon Locally
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Scan Prompt
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                          <Bluetooth className="w-6 h-6 text-slate-700" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900">Local BLE Mesh Discovery</h4>
                          <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                            Initiate scanning to discover nearby verified guards broadcasting secure radio codes within 10-30 meters.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setBleScanning(true);
                            setBleScannerTicks(0);
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-3xs active:scale-95 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Scan for Nearby Guards</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Beacon Distress Emergency Action */}
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    {offlineSOSBeaconSent ? (
                      <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-xl text-center animate-pulse">
                        <strong className="text-red-700 block text-xs">🚨 DISTRESS BEACON BROADCASTING</strong>
                        <span className="text-[10px] leading-relaxed block mt-1">
                          Continuous 2.4GHz BLE emergency packet transmitting. Nearby guards' devices will emit standard distress triggers locally.
                        </span>
                        <button
                          onClick={() => setOfflineSOSBeaconSent(false)}
                          className="mt-2 text-[9px] text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg font-bold"
                        >
                          Cancel Distress Beacon
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setOfflineSOSBeaconSent(true);
                          onTriggerSOS(true);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Radio className="w-4 h-4 text-white animate-pulse" />
                        <span>BROADCAST OFFLINE MESH SOS</span>
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                // Active Bluetooth Booking Link Tracking
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold block">📶 Bluetooth Guard Link Active</span>
                        <span className="text-[9px] text-emerald-600 font-mono font-bold">{activeBooking.id}</span>
                      </div>
                      <div className="bg-white border border-emerald-200 px-2.5 py-1 rounded-lg text-right">
                        <span className="text-[7px] text-slate-400 block font-mono">CRYPTO PIN MATCHED</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 tracking-wider">{activeBooking.securityPin}</span>
                      </div>
                    </div>

                    {/* Interactive Signal Strength Widget */}
                    <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center z-10 relative">
                        <span className="text-[10px] font-mono font-bold text-slate-400">P2P RSSI LINK STRENGTH</span>
                        <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <Signal className="w-3.5 h-3.5" />
                          {bleRSSI} dBm
                        </span>
                      </div>

                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        <div className="flex-1 bg-emerald-500 rounded-2xs" />
                        <div className="flex-1 bg-emerald-500 rounded-2xs" />
                        <div className="flex-1 bg-emerald-500 rounded-2xs" />
                        <div className="flex-1 bg-emerald-400 rounded-2xs" />
                        <div className={`flex-1 rounded-2xs ${bleRSSI > -70 ? "bg-emerald-400" : "bg-slate-700"}`} />
                        <div className={`flex-1 rounded-2xs ${bleRSSI > -65 ? "bg-emerald-300" : "bg-slate-700"}`} />
                        <div className={`flex-1 rounded-2xs ${bleRSSI > -55 ? "bg-emerald-300" : "bg-slate-700"}`} />
                      </div>

                      <p className="text-[9px] text-slate-400 leading-normal font-mono">
                        {bleRSSI > -60 ? "🟢 Link Status: EXCELLENT (Device under 5 meters range)" : 
                         bleRSSI > -75 ? "🟡 Link Status: GOOD (Device 5-15 meters range)" : 
                         "🔴 Link Status: POOR (Range threshold exceeded, approaching 30m limit)"}
                      </p>
                    </div>

                    {/* Assigned Guard Status Card */}
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex gap-2.5">
                      <img
                        src={selectedBouncer.avatar}
                        alt={selectedBouncer.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold block truncate text-slate-900">{selectedBouncer.name}</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 py-0.2 rounded font-mono">P2P CONNECTED</span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                          Location: {activeBooking.pickupLocation} • {selectedBouncer.specialties[0]}
                        </p>
                      </div>
                    </div>

                    {/* Offline Peer Walkie-Talkie channel */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold block text-slate-900">P2P Voice Walkie-Talkie</span>
                          <span className="text-[8px] text-slate-400 block">Direct voice transmission without internet</span>
                        </div>
                        <button
                          onMouseDown={() => setWalkieTalkieSpeaking(true)}
                          onMouseUp={() => setWalkieTalkieSpeaking(false)}
                          onTouchStart={() => setWalkieTalkieSpeaking(true)}
                          onTouchEnd={() => setWalkieTalkieSpeaking(false)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                            walkieTalkieSpeaking 
                              ? "bg-red-600 text-white border-red-500 animate-pulse" 
                              : "bg-slate-900 text-white border-slate-800"
                          }`}
                        >
                          {walkieTalkieSpeaking ? "SPEAKING..." : "PUSH TO TALK"}
                        </button>
                      </div>

                      {walkieTalkieSpeaking && (
                        <div className="bg-red-50 border border-red-100 p-2 rounded-lg text-[9px] text-red-800 font-mono">
                          📢 TRANSMITTING ON FREQUENCY 2.480 GHz:
                          <span className="block italic mt-0.5">"Guard {selectedBouncer.name}, I am at platform gate, standing next to the bookstore."</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onTriggerSOS(true);
                        setOfflineSOSBeaconSent(true);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>TRIGGER BLUETOOTH SOS</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Verify that you have safely arrived at your destination? This completes the offline escrow link.")) {
                          onUpdateBookingStatus("completed");
                          // Do not reset offline mode automatically, let user dismiss
                        }
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>CONFIRM SAFE ARRIVAL</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* SCREEN: SPLASH */}
              {screen === "splash" && (
            <div className="flex-1 flex flex-col justify-between py-6 text-center">
              <div className="mt-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-slate-100 blur-xl rounded-full" />
                  <div className="relative bg-slate-900 p-5 rounded-3xl border border-slate-850 flex items-center justify-center shadow-md">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-900 uppercase">
                  RAKSHIKA
                </h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                  Verified Lady Bouncer Network
                </p>
                <div className="mt-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span className="text-[10px] text-slate-600 font-medium font-mono">24/7 Rapid SOS & Guard Dispatch</span>
                </div>
              </div>

              <div className="space-y-3 my-4 text-left">
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex gap-3 shadow-3xs">
                  <div className="bg-white p-2 rounded-lg h-fit border border-slate-200">
                    <UserCheck className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">100% Police Verified</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      All lady bouncers pass strict police record verifications and identity verification.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex gap-3 shadow-3xs">
                  <div className="bg-white p-2 rounded-lg h-fit border border-slate-200">
                    <Bell className="w-4 h-4 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Parent Safety Suite</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Parents receive live GPS tracking, automated check-ins, and immediate audio SOS sirens.
                    </p>
                  </div>
                </div>
              </div>

              <button
                id="btn-enter-app"
                onClick={() => setScreen("home")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <span className="text-xs uppercase tracking-wider font-semibold">Initiate Secure Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SCREEN: HOME (BOOKING FORM) */}
          {screen === "home" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-left">
                  <h2 className="text-sm font-bold text-slate-900">Book Lady Guard</h2>
                  <p className="text-[9px] text-slate-400">Select protective security level</p>
                </div>
                <div className="bg-slate-50 p-0.5 rounded-lg border border-slate-200 flex">
                  <button
                    onClick={() => setBookingType("hourly_transit")}
                    className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${bookingType === "hourly_transit" ? "bg-slate-900 text-white shadow-3xs" : "text-slate-500"}`}
                  >
                    Transit
                  </button>
                  <button
                    onClick={() => setBookingType("event_protection")}
                    className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${bookingType === "event_protection" ? "bg-slate-900 text-white shadow-3xs" : "text-slate-500"}`}
                  >
                    Event
                  </button>
                </div>
              </div>

              {/* Secure Mode Alert */}
              <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-start gap-2.5 mb-4 text-left">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[10px] text-emerald-800 font-medium">
                  <span className="font-bold block text-emerald-900">Guaranteed Lady Bouncer</span>
                  Only professional female combat and de-escalation experts are dispatched.
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3 flex-1 text-left">
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Pickup Location / Venue Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {bookingType === "hourly_transit" && (
                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Safe Destination Location
                    </label>
                    <div className="relative">
                      <Compass className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Required Hours
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Time Slot
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Parent Mode Toggle */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-800" />
                      <span className="text-xs font-bold text-slate-800">Parent Guardian Link</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isForDaughter}
                      onChange={(e) => setIsForDaughter(e.target.checked)}
                      className="accent-slate-900 w-3.5 h-3.5"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Check this to automatically send live GPS progress, vehicle number, and instant SOS alerts directly to parent dashboard.
                  </p>

                  {isForDaughter && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[8px] text-slate-400 font-mono font-semibold block">DAUGHTER'S FULL NAME</span>
                        <input
                          type="text"
                          value={daughterName}
                          onChange={(e) => setDaughterName(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-[11px] rounded-lg p-1.5 outline-none text-slate-900 focus:border-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[8px] text-slate-400 font-mono font-semibold block">PARENT'S CONTACT</span>
                          <input
                            type="text"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-[11px] rounded-lg p-1.5 outline-none text-slate-900 focus:border-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-mono font-semibold block">PARENT'S NAME</span>
                          <input
                            type="text"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-[11px] rounded-lg p-1.5 outline-none text-slate-900 focus:border-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                id="btn-find-bouncers"
                onClick={handleProceedToBouncers}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl mt-4 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-bold shadow-xs active:scale-95 transition-all"
              >
                <span>Browse Verified Guards</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SCREEN: BOUNCER SELECT */}
          {screen === "bouncer_select" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 mb-3 text-left">
                <button 
                  onClick={() => setScreen("home")}
                  className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-100"
                >
                  Back
                </button>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Verified Guards</h2>
                  <p className="text-[9px] text-slate-400">Delhi NCR Regional Force</p>
                </div>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {bouncers.map((bouncer) => (
                  <div
                    key={bouncer.id}
                    onClick={() => handleSelectBouncer(bouncer)}
                    className="bg-white border border-slate-200 hover:border-slate-400 p-2.5 rounded-xl flex gap-2.5 cursor-pointer transition-all active:scale-98 group text-left shadow-3xs"
                  >
                    <div className="relative">
                      <img
                        src={bouncer.avatar}
                        alt={bouncer.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white">
                        <CheckCircle className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                          {bouncer.name}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-900 font-mono">
                          ₹{bouncer.hourlyRate}/hr
                        </span>
                      </div>
                      
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {bouncer.height} • {bouncer.experienceYears}y Exp • {bouncer.languages[0]} & {bouncer.languages[1]}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[8px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                          {bouncer.verificationId}
                        </span>
                        {bouncer.weaponsCertified && (
                          <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono border border-red-100">
                            Equipped
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: SECURE CHECKOUT PAYMENT */}
          {screen === "payment" && selectedBouncer && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="text-left">
                <div className="flex items-center gap-1.5 mb-3">
                  <button 
                    onClick={() => setScreen("bouncer_select")}
                    className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg"
                  >
                    Back
                  </button>
                  <h2 className="text-xs font-bold text-slate-900">Secure Safety Deposit</h2>
                </div>

                {/* Escrow Shield Notice */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-start gap-2 mb-3">
                  <Lock className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div className="text-[9px] text-slate-600">
                    <span className="font-bold block text-slate-900">Guaranteed Escrow Protection</span>
                    Payment is kept secure. Lady Guard only paid after successful safety confirmation of arrival.
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-200/80">
                    <span>Guard Force Assigned</span>
                    <span className="text-slate-900 font-bold">{selectedBouncer.name}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Base Hourly Rate</span>
                    <span>₹{selectedBouncer.hourlyRate} / hr</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Total Duration booked</span>
                    <span>{hours} Hours</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Govt Security Levy GST (18%)</span>
                    <span>₹{Math.floor(selectedBouncer.hourlyRate * hours * 0.18)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-950 pt-2 border-t border-slate-200">
                    <span className="text-slate-900">TOTAL SECURITY DEPOSIT</span>
                    <span className="font-mono text-emerald-600">₹{Math.floor(selectedBouncer.hourlyRate * hours * 1.18)}</span>
                  </div>
                </div>

                {/* UPI Modes */}
                <div className="mt-4 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                    Choose UPI / Payment Gateway
                  </span>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-white border border-slate-200 p-2 rounded-xl text-center cursor-pointer hover:border-slate-900">
                      <span className="text-[10px] font-bold text-slate-900 block">GPAY</span>
                      <span className="text-[7px] text-slate-400 block font-mono">BHIM Secure</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-2 rounded-xl text-center cursor-pointer hover:border-slate-900">
                      <span className="text-[10px] font-bold text-slate-900 block">PAYTM</span>
                      <span className="text-[7px] text-slate-400 block font-mono">1-Click</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-2 rounded-xl text-center cursor-pointer hover:border-slate-900">
                      <span className="text-[10px] font-bold text-slate-900 block">PHONEPE</span>
                      <span className="text-[7px] text-slate-400 block font-mono">Direct Bank</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="btn-confirm-pay"
                onClick={handleCompletePayment}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-bold shadow-sm active:scale-95 transition-all mt-4"
              >
                <CreditCard className="w-4 h-4" />
                <span>Confirm & Escrow Pay</span>
              </button>
            </div>
          )}

          {/* SCREEN: ACTIVE TRANSIT TRACKING MAP */}
          {screen === "tracking" && activeBooking && selectedBouncer && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {activeBooking.status === "confirmed" && "Guard Assigned"}
                      {activeBooking.status === "en_route" && "Guard Coming to You"}
                      {activeBooking.status === "active" && "Safe Guard Transit Active"}
                      {activeBooking.status === "completed" && "Secured Arrival Completed"}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-mono">Order ID: {activeBooking.id}</p>
                  </div>
                  
                  {/* Pin Generator for verification */}
                  <div className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-right">
                    <span className="text-[7px] text-slate-400 block uppercase font-mono">Bouncer verification PIN</span>
                    <span className="text-xs font-bold text-emerald-600 font-mono tracking-wider">{activeBooking.securityPin}</span>
                  </div>
                </div>

                {/* Small Map Container inside the phone */}
                <div className="h-44 w-full border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <MapSimulator
                    progress={systemProgress}
                    city={selectedBouncer.currentCity}
                    pickup={activeBooking.pickupLocation}
                    destination={activeBooking.destinationLocation}
                    sosActive={sosActive}
                    bouncerName={selectedBouncer.name}
                  />
                </div>

                {/* Lady Guard Stats Card */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex gap-2.5">
                  <img
                    src={selectedBouncer.avatar}
                    alt={selectedBouncer.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold block truncate text-slate-900">{selectedBouncer.name}</span>
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-mono">POLICE APPROVED</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {selectedBouncer.height} • {selectedBouncer.specialties[0]}
                    </p>
                    <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                      Body-cam Active ID: {selectedBouncer.verificationId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Cancel or SOS Trigger */}
              <div className="space-y-2 mt-3">
                {sosCountdown !== null ? (
                  <div className="bg-red-50 border border-red-200 text-red-900 py-3 px-4 rounded-xl text-center animate-pulse">
                    <span className="text-[10px] font-bold uppercase tracking-widest block text-red-600">EMERGENCY PANIC IN</span>
                    <span className="text-2xl font-black font-display">{sosCountdown}</span>
                  </div>
                ) : (
                  <button
                    id="btn-emergency-sos"
                    onClick={handleSOSPress}
                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-extrabold shadow-sm transition-all active:scale-95 ${
                      sosActive
                        ? "bg-slate-900 hover:bg-slate-800 text-red-500 border border-red-200 animate-pulse animate-duration-1000"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span>{sosActive ? "DEACTIVATE PANIC ALERT" : "TRIGGER RAPID SOS"}</span>
                  </button>
                )}

                {/* Cancel Booking only if transit hasn't completed */}
                {activeBooking.status !== "completed" && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel your lady guard booking?")) {
                        onUpdateBookingStatus("cancelled");
                        setScreen("home");
                      }
                    }}
                    className="w-full text-slate-400 hover:text-slate-600 text-[10px] text-center uppercase tracking-wider font-semibold py-1 block"
                  >
                    Cancel Guard Booking
                  </button>
                )}

                {activeBooking.status === "completed" && (
                  <button
                    onClick={() => {
                      setScreen("home");
                      onUpdateBookingStatus("pending");
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-medium py-2 px-4 rounded-xl text-xs uppercase"
                  >
                    Complete Escrow & Book Next
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

        </div>

        {/* SOS Emergency Overlay Screen */}
        {sosActive && (
          <div className="absolute inset-x-0 bottom-0 top-9 bg-white z-50 p-4 flex flex-col justify-between text-left border-t border-red-200 transition-all duration-300 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-red-600 p-1 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-red-600">ACTIVE SOS ALERT</h2>
                    <span className="text-[8px] text-slate-400 font-mono">Incident Ref: #SOS-89410</span>
                  </div>
                </div>
                <div className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[9px] font-mono">
                  RAPID THREAT DISPATCH
                </div>
              </div>

              {/* Critical Notice */}
              <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[10px] text-red-900 leading-relaxed font-medium">
                <span className="font-bold text-red-700 block mb-0.5">⚠️ Police & Command Notified</span>
                Your current GPS location and continuous audio stream are being sent in real-time to the nearest police station, your parent dashboard, and Rakshika Rapid Guards.
              </div>

              {/* Siren Control Panel */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold block text-slate-900">Safety Audio Siren</span>
                  <span className="text-[8px] text-slate-400 block">Emits a high-volume deterrent alarm</span>
                </div>
                <button
                  onClick={() => setSirenOn(!sirenOn)}
                  className={`p-2.5 rounded-xl border ${sirenOn ? "bg-red-600 text-white border-red-500" : "bg-white text-slate-400 border-slate-200"}`}
                >
                  {sirenOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Fake Safety Call Simulator */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-bold block text-slate-900">Deterrent Call Simulator</span>
                    <span className="text-[8px] text-slate-400 block">Trigger a loud, clear pre-recorded command call</span>
                  </div>
                  <button
                    onClick={() => setSimulatedCallActive(!simulatedCallActive)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                      simulatedCallActive 
                        ? "bg-emerald-600 text-white border-emerald-500" 
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {simulatedCallActive ? "End Safety Call" : "Trigger Call"}
                  </button>
                </div>

                {simulatedCallActive && (
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[10px] text-emerald-800 font-mono animate-pulse">
                    <span className="text-[8px] text-emerald-600 block mb-1 font-bold">📢 PLAYING DETERRENT SPEAKER:</span>
                    "This is Rakshika Emergency Command. Armed lady guards and local police have your location. Dispatch ETA is 2 minutes."
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onTriggerSOS(false);
                setSirenOn(false);
                setSimulatedCallActive(false);
              }}
              className="w-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 font-bold py-3 rounded-xl text-xs uppercase transition-all"
            >
              Cancel Alarm (Safe Scenario)
            </button>
          </div>
        )}

        {/* Navigation Indicator Bar at Bottom of Screen */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-200 rounded-full z-40" />
      </div>
    </div>
  );
};
