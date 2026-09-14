import React, { useState } from "react";
import { 
  ShieldAlert, 
  UserCheck, 
  Activity, 
  MapPin, 
  Lock, 
  Database, 
  Bell, 
  Eye, 
  Layers, 
  Code2, 
  FileCheck, 
  PhoneCall, 
  Share2,
  AlertOctagon,
  HelpCircle,
  Smartphone
} from "lucide-react";
import { LadyBouncer, Booking, SOSAlert, SystemNotification } from "../types";

interface ControlDashboardProps {
  bouncers: LadyBouncer[];
  activeBooking: Booking | null;
  notifications: SystemNotification[];
  sosActive: boolean;
  systemProgress: number;
  selectedBouncer: LadyBouncer | null;
  osType: "ios" | "android";
  setOsType: (type: "ios" | "android") => void;
  triggerSystemSOS: () => void;
}

export const ControlDashboard: React.FC<ControlDashboardProps> = ({
  bouncers,
  activeBooking,
  notifications,
  sosActive,
  systemProgress,
  selectedBouncer,
  osType,
  setOsType,
  triggerSystemSOS,
}) => {
  const [activeTab, setActiveTab] = useState<"parent" | "dispatcher" | "native_code">("parent");
  const [copiedCode, setCopiedCode] = useState(false);

  // Simulated React Native code snippets to showcase cross-platform development
  const reactNativeCodeSnippet = `// React Native (iOS & Android) Cross-Platform Security Bridge
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Sound from 'react-native-sound';

export default function RakshikaSafetyBridge({ bouncerId, parentContact }) {
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);

  // Real-time GPS Location sharing
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        // Emit live coordinates securely to parents and Rakshika server
        sendGPSPayload(bouncerId, latitude, longitude);
      },
      (error) => Alert.alert('GPS Error', error.message),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
    return () => Geolocation.clearWatch(watchId);
  }, []);

  const triggerSOSAlarm = () => {
    setSosActive(true);
    // Play dual high-frequency safety deterrent buzzer
    const alarm = new Sound('safety_siren.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) return;
      alarm.setVolume(1.0).setNumberOfLoops(-1).play();
    });
    
    // Dispatch instant payload containing location + audio stream
    sendSOSPayload(parentContact, location);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.sosButton} onPress={triggerSOSAlarm}>
        <Text style={styles.sosText}>TRIGGER RAPID SOS</Text>
      </TouchableOpacity>
    </View>
  );
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reactNativeCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden text-left shadow-xs">
      {/* Dashboard Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
            <Activity className="w-5 h-5 text-slate-900 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 font-mono tracking-wider">RAKSHIKA MONITORING TOWER</h2>
            <p className="text-xs text-slate-500">Guardian Hub & Police-Verification Registry</p>
          </div>
        </div>

        {/* Operating System & Preview Controller */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Device Simulator:</span>
          <div className="bg-slate-50 border border-slate-200 p-0.5 rounded-lg flex">
            <button
              onClick={() => setOsType("ios")}
              className={`px-2.5 py-1 text-[10px] rounded-md font-mono transition-all ${osType === "ios" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              Apple iOS
            </button>
            <button
              onClick={() => setOsType("android")}
              className={`px-2.5 py-1 text-[10px] rounded-md font-mono transition-all ${osType === "android" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              Google Android
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-header Tabs */}
      <div className="bg-slate-50/50 px-6 border-b border-slate-200 flex">
        <button
          onClick={() => setActiveTab("parent")}
          className={`py-3 px-4 text-xs font-medium font-sans border-b-2 transition-all flex items-center gap-2 ${activeTab === "parent" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Parent Safety Portal</span>
        </button>
        <button
          onClick={() => setActiveTab("dispatcher")}
          className={`py-3 px-4 text-xs font-medium font-sans border-b-2 transition-all flex items-center gap-2 ${activeTab === "dispatcher" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Bouncer Registry & Vetting</span>
        </button>
        <button
          onClick={() => setActiveTab("native_code")}
          className={`py-3 px-4 text-xs font-medium font-sans border-b-2 transition-all flex items-center gap-2 ${activeTab === "native_code" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>React Native Bridge Code</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">

        {/* TAB: PARENT GUARDIAN PORTAL */}
        {activeTab === "parent" && (
          <div className="space-y-6">
            
            {/* Urgent Emergency Indicator banner */}
            {sosActive ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 p-2.5 rounded-lg text-white">
                    <ShieldAlert className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">🚨 RAPID DISPATCH: ACTIVE DAUGHTER SOS</h3>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed font-medium">
                      Incident Location: {activeBooking?.pickupLocation || "Delhi Transit Metro Route 12"}. GPS location stream broadcasted. Police unit PCR-3 notified.
                    </p>
                  </div>
                </div>
                <button
                  onClick={triggerSystemSOS}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition-all shadow-md shadow-red-100"
                >
                  SIMULATE SAFE DISMISSAL
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
                <div className="space-y-1 text-left">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Daughter safety protection status</h3>
                  <p className="text-xs text-slate-600">
                    {activeBooking ? (
                      `Currently monitoring ${activeBooking.daughterName || "Guard Transit"}. Track live path and pin verification.`
                    ) : (
                      "No active guard transits currently running. Book a lady guard on the smartphone to start tracking."
                    )}
                  </p>
                </div>
                {activeBooking && (
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Verify PIN Code</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono tracking-wider">{activeBooking.securityPin}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Daughter Connection</span>
                      <span className="text-xs font-bold text-slate-900">{activeBooking.daughterName || "Active User"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grid Layout of safety checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Telemetry Log */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-72 shadow-3xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-950 flex items-center gap-1.5 font-mono">
                    <Activity className="w-3.5 h-3.5 text-slate-900" />
                    LIVE GUARDIAN TELEMETRY LOGS
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">AUTO-REFRESHING</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-[10.5px]">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="border-l-2 border-slate-200 pl-3 py-1 text-slate-600">
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>{notif.timestamp}</span>
                        <span className={`px-1.5 rounded text-[8px] font-bold ${
                          notif.type === "sos" ? "bg-red-50 text-red-600 border border-red-200" :
                          notif.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {notif.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-normal">{notif.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-sans">
                      No active telemetry signals. Initiate booking to begin tracking.
                    </div>
                  )}
                </div>
              </div>

              {/* India-Specific Women's Safety Policy Brief */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-left space-y-4 shadow-3xs">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-950 flex items-center gap-1.5 font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-slate-900" />
                    THE SAFETY EMERGENCY IN INDIA
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    With major safety concerns for independent working daughters and female travelers, traditional security measures often fall short. 
                    <span className="text-slate-900 font-bold block mt-1.5">Rakshika's Dual-Shield Strategy:</span>
                  </p>
                  <ul className="space-y-2 text-[11px] text-slate-500">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span><strong>Female-to-Female Guarding:</strong> Fully prevents any trust gaps, enabling immediate physical assistance, physical warding, and shared secure travel without secondary security risks.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span><strong>Police Integrated Panic Link:</strong> Directly binds to local police control rooms (112) with instant verified ID proof of assigned personnel.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span><strong>Continuous Body-Camera Recording:</strong> Prevents false claims and records absolute forensic evidence of all transits.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Standard compliance: Aadhaar ID & IPC-Vetted</span>
                  <span className="text-emerald-600 font-bold">ACTIVE REGULATED GATEWAY</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: BOUNCER REGISTRY & VETTING */}
        {activeTab === "dispatcher" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
              <h3 className="text-xs font-bold text-slate-900 mb-1 font-mono uppercase tracking-wider">RAKSHIKA REGULAR FORCE - BACKGROUND CHECKS</h3>
              <p className="text-xs text-slate-500">Review real-time digital credentials of local registered lady bouncers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bouncers.map((b) => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between text-left relative overflow-hidden shadow-xs hover:border-slate-300 transition-all group">
                  
                  {/* Verified Indicator Ribbon */}
                  <div className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold font-mono px-2 py-0.5 rounded">
                    POLICE VETTED
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.avatar}
                        alt={b.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-sans">{b.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block">Licence: {b.verificationId}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-y border-slate-100 py-2 text-slate-500">
                      <div>
                        <span className="text-[9px] text-slate-400 block">HEIGHT / WEIGHT</span>
                        <span className="text-slate-800 font-semibold">{b.height} / {b.weight}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">EXPERIENCE</span>
                        <span className="text-slate-800 font-semibold">{b.experienceYears} Years Active</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">SPECIALTY</span>
                        <span className="text-slate-800 font-semibold truncate block">{b.specialties[0]}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">LANGUAGES</span>
                        <span className="text-slate-800 font-semibold truncate block">{b.languages[0]} & {b.languages[1]}</span>
                      </div>
                    </div>

                    {/* Vetting Checklist */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Aadhaar Biometric Check</span>
                        <span className="text-emerald-600 font-bold font-mono">CONFIRMED</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Local Police HQ Verification</span>
                        <span className="text-emerald-600 font-bold font-mono">VERIFIED</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Combat & Tactical Training Cert</span>
                        <span className="text-emerald-600 font-bold font-mono">GOLD GRADE</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Live Body-Cam Broadcast</span>
                        <span className="text-slate-600 font-bold font-mono">{b.bodyCameraEquipped ? "EQUIPPED" : "MANUAL LOG"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Hourly Rate</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">₹{b.hourlyRate} / hour</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: REACT NATIVE CODE INSPECTOR */}
        {activeTab === "native_code" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-3xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1 font-mono uppercase tracking-wider">HYBRID REACT NATIVE CODE VISUALIZER</h3>
                <p className="text-xs text-slate-500">Inspect real-world native components built for iOS & Android compatibility</p>
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-mono transition-all"
              >
                {copiedCode ? "Copied code!" : "Copy Native Code"}
              </button>
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-slate-950 overflow-hidden shadow-xs">
              <div className="absolute top-3 right-3 bg-slate-900 border border-slate-800 text-[9px] font-mono px-2 py-1 rounded text-slate-400">
                TypeScript / ES6
              </div>
              <pre className="p-4 text-[11px] font-mono text-slate-200 overflow-x-auto text-left leading-relaxed max-h-80">
                <code>{reactNativeCodeSnippet}</code>
              </pre>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 text-left text-xs text-slate-600 leading-relaxed shadow-3xs">
              <span className="font-bold text-slate-900 block font-mono">Core Native Integrations:</span>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Native Geolocation API:</strong> Uses `react-native-geolocation-service` with extreme high-accuracy GPS tracking, enabling background location sharing even when the app is minimized.</li>
                <li><strong>Secured Escrow Cryptography:</strong> Employs SHA-256 local hashes for safety PIN codes so daughter/client can securely authenticate matching lady bouncer presence without internet.</li>
                <li><strong>SOS Physical Accelerometer Trigger:</strong> React Native bindings capture sudden physical movements or multiple keypresses (e.g., clicking power button 5 times) to instantly trigger background SOS silent signals.</li>
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* Footer Audit Logs */}
      <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-950" />
          <span>Local Persistence: Secure State Storage Active</span>
        </div>
        <span>Durga Shield Gateway v1.4</span>
      </div>
    </div>
  );
};
