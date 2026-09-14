import React, { useState } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  MapPin, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  CreditCard,
  Lock,
  UserPlus
} from "lucide-react";
import { Booking } from "../types";
import { requestAadhaarOtp, verifyAadhaarOtp, validateAadhaarFormat } from "../utils/aadhaarKyc";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface Address {
  id: string;
  label: string;
  details: string;
}

interface UserProfileProps {
  userEmail: string;
  profile: {
    fullName: string;
    phone: string;
    avatarUrl: string;
    kycVerified: boolean;
    aadhaarNumber: string;
  };
  contacts: EmergencyContact[];
  addresses: Address[];
  bookingsHistory: Booking[];
  onUpdateProfile: (fullName: string, phone: string, aadhaarNumber: string) => Promise<void>;
  onAddContact: (name: string, phone: string, relationship: string) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onAddAddress: (label: string, details: string) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userEmail,
  profile,
  contacts,
  addresses,
  bookingsHistory,
  onUpdateProfile,
  onAddContact,
  onDeleteContact,
  onAddAddress,
  onDeleteAddress,
  onLogout,
}) => {
  // Editing profile states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [aadhaarNumber, setAadhaarNumber] = useState(profile.aadhaarNumber || "");

  // Add Contact Form states
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("Father");
  const [showAddContact, setShowAddContact] = useState(false);

  // Add Address Form states
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressDetails, setAddressDetails] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(fullName, phone, aadhaarNumber);
    setIsEditing(false);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;
    await onAddContact(contactName, contactPhone, contactRelation);
    setContactName("");
    setContactPhone("");
    setShowAddContact(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressDetails) return;
    await onAddAddress(addressLabel, addressDetails);
    setAddressDetails("");
    setShowAddAddress(false);
  };

  // Aadhaar OTP KYC Modal States
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStep, setKycStep] = useState<1 | 2>(1);
  const [kycAadhaarInput, setKycAadhaarInput] = useState(profile.aadhaarNumber || "");
  const [kycRefId, setKycRefId] = useState("");
  const [kycOtpInput, setKycOtpInput] = useState("");
  const [kycStatusMsg, setKycStatusMsg] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  const backendUrl = typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:3001"
    : window.location.origin;

  const handleSendAadhaarOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatusMsg("");
    setKycLoading(true);

    const res = await requestAadhaarOtp(backendUrl, kycAadhaarInput);
    setKycLoading(false);

    if (res.success && res.refId) {
      setKycRefId(res.refId);
      setKycStep(2);
      setKycStatusMsg("✔ 6-digit OTP sent to your Aadhaar-linked mobile phone!");
    } else {
      setKycStatusMsg(`❌ ${res.message}`);
    }
  };

  const handleVerifyAadhaarOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatusMsg("");
    setKycLoading(true);

    const res = await verifyAadhaarOtp(backendUrl, kycRefId, kycOtpInput, kycAadhaarInput);
    setKycLoading(false);

    if (res.success && res.kycVerified) {
      setKycStatusMsg("✔ Aadhaar KYC verified successfully with Govt of India UIDAI records!");
      await onUpdateProfile(fullName, phone, kycAadhaarInput);
      setTimeout(() => {
        setShowKycModal(false);
      }, 1500);
    } else {
      setKycStatusMsg(`❌ ${res.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Left Column: Account profile cards (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* User Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-20 bg-slate-900 pointer-events-none" />
          
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="w-20 h-20 rounded-full border-4 border-white object-cover mt-8 relative z-1 shadow-sm"
          />

          <div className="mt-4 space-y-1">
            <h3 className="text-base font-bold text-slate-900">{profile.fullName}</h3>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider block">{userEmail}</span>
          </div>

          {/* KYC Vetting Badge & Trigger */}
          <div className="mt-4 w-full border-t border-b border-slate-100 py-3 flex flex-col items-center gap-2">
            {profile.kycVerified ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 fill-emerald-100" /> GOVT AADHAAR KYC VERIFIED
              </span>
            ) : (
              <>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-[10px] font-mono font-bold flex items-center gap-1">
                  ⚠️ PENDING KYC LOCK
                </span>
                <button
                  onClick={() => {
                    setKycStep(1);
                    setKycStatusMsg("");
                    setShowKycModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  Verify Aadhaar via Govt OTP
                </button>
              </>
            )}
          </div>

          {/* Simple Details */}
          <div className="mt-4 w-full space-y-3.5 text-xs text-slate-600 font-mono">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{userEmail}</span>
            </div>
            {profile.aadhaarNumber && (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Aadhaar: **** **** {profile.aadhaarNumber.slice(-4)}</span>
              </div>
            )}
          </div>

          {/* Edit & Logout controls */}
          <div className="mt-6 pt-4 border-t border-slate-100 w-full flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer"
            >
              {isEditing ? "Cancel Edit" : "Modify Details"}
            </button>
            <button
              onClick={onLogout}
              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-mono text-[10px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Editor Panel */}
        {isEditing && (
          <form onSubmit={handleUpdate} className="bg-white border border-slate-250/70 p-5 rounded-2xl shadow-3xs space-y-4 animate-fadeIn">
            <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider border-b border-slate-100 pb-2">
              Update Personal Credentials
            </h4>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Aadhaar ID (12 Digits)</label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="492109848923"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-mono font-bold text-[10px] py-2 rounded-lg tracking-wider transition-all cursor-pointer shadow-3xs"
            >
              SAVE UPDATES
            </button>
          </form>
        )}
      </div>

      {/* Right Column: Settings & History (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Saved Addresses & Emergency Contacts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Emergency Contacts card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col h-[340px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-red-500" /> Emergency Contacts
              </h4>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-[10px] font-mono font-bold text-slate-650 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            </div>

            {/* Contacts list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {showAddContact && (
                <form onSubmit={handleAddContact} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3 text-xs mb-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Contact Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={contactRelation}
                      onChange={(e) => setContactRelation(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      {["Father", "Mother", "Husband", "Brother", "Sister", "Friend", "Guardian"].map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Phone (e.g. +91 98102...)"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-950 text-white font-mono font-bold px-3 rounded-lg text-[10px]"
                    >
                      SAVE
                    </button>
                  </div>
                </form>
              )}

              {contacts.map((contact) => (
                <div key={contact.id} className="border border-slate-200/60 p-3 rounded-xl flex items-center justify-between text-left text-xs bg-slate-50/20 hover:border-slate-300">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                      {contact.name} 
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded-full border">
                        {contact.relationship}
                      </span>
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono block">{contact.phone}</span>
                  </div>
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="text-slate-400 hover:text-red-700 p-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {contacts.length === 0 && !showAddContact && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <span>No registered emergency contacts.</span>
                  <span className="text-[9px] mt-1 text-slate-350">Alerts will fall back to local PCR beating rooms.</span>
                </div>
              )}
            </div>
          </div>

          {/* Saved Addresses shortcuts card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col h-[340px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" /> Saved Locations
              </h4>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-[10px] font-mono font-bold text-slate-650 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            </div>

            {/* Addresses list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3 text-xs mb-3 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      className="col-span-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      {["Home", "Work", "Office", "Gym", "College", "Other"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Saved Address details..."
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      className="col-span-2 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-950 text-white font-mono font-bold px-3 py-1 rounded-lg text-[10px]"
                    >
                      ADD LOCATION
                    </button>
                  </div>
                </form>
              )}

              {addresses.map((address) => (
                <div key={address.id} className="border border-slate-200/60 p-3 rounded-xl flex items-center justify-between text-left text-xs bg-slate-50/20 hover:border-slate-300">
                  <div className="space-y-0.5 max-w-[85%]">
                    <h5 className="font-bold text-slate-850 font-sans block">{address.label}</h5>
                    <span className="text-[10.5px] text-slate-500 truncate block">{address.details}</span>
                  </div>
                  <button
                    onClick={() => onDeleteAddress(address.id)}
                    className="text-slate-400 hover:text-red-700 p-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {addresses.length === 0 && !showAddAddress && (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No saved shortcut locations yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Booking History Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider border-b border-slate-100 pb-2 mb-4">
            Guard Booking History
          </h4>

          <div className="space-y-4">
            {bookingsHistory.map((booking) => (
              <div 
                key={booking.id} 
                className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs hover:border-slate-300 bg-slate-50/10"
              >
                <div className="space-y-1 md:max-w-[70%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800">{booking.id}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded border">
                      {booking.date}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[8px] font-bold font-mono border uppercase ${
                      booking.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      booking.status === "cancelled" ? "bg-red-50 text-red-750 border-red-100" :
                      "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-550 truncate">
                    Route: <strong>{booking.pickupLocation}</strong> → <strong>{booking.destinationLocation}</strong>
                  </p>
                </div>

                <div className="flex md:flex-col items-end gap-2 md:gap-0.5 justify-between w-full md:w-auto font-mono text-right border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                  <span className="text-[9px] text-slate-400 uppercase">Paid Escrow</span>
                  <span className="font-bold text-slate-950 text-sm">₹{booking.amountPaid}</span>
                </div>
              </div>
            ))}

            {bookingsHistory.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No past transactions or transits found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* GOVT OF INDIA AADHAAR OTP KYC MODAL */}
      {showKycModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-left relative">
            <button
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 text-indigo-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-sans uppercase tracking-wider">
                  Govt Aadhaar OTP KYC Matching
                </h4>
                <span className="text-[10px] text-slate-500 font-mono block">Official UIDAI Identity Verification</span>
              </div>
            </div>

            {kycStatusMsg && (
              <div className={`p-3 rounded-xl text-xs font-mono font-semibold ${kycStatusMsg.includes("✔") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {kycStatusMsg}
              </div>
            )}

            {kycStep === 1 ? (
              <form onSubmit={handleSendAadhaarOtp} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Enter your 12-digit Aadhaar Card Number to receive a 6-digit verification OTP on your UIDAI-registered mobile phone:
                </p>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest font-mono">12-Digit Aadhaar Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4921 0984 8923"
                    value={kycAadhaarInput}
                    onChange={(e) => setKycAadhaarInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={kycLoading}
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-mono font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {kycLoading ? "REQUESTING UIDAI OTP..." : "SEND GOVT AADHAAR OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAadhaarOtp} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Enter the 6-digit OTP sent to your registered mobile phone for Aadhaar Card ending in <strong>**** {kycAadhaarInput.replace(/\s/g, "").slice(-4)}</strong>:
                </p>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest font-mono">6-Digit UIDAI Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={kycOtpInput}
                    onChange={(e) => setKycOtpInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-center text-base tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={kycLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {kycLoading ? "VERIFYING WITH UIDAI..." : "VERIFY OTP & MATCH RECORD"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
