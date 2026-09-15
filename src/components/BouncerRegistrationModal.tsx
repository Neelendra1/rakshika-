import React, { useState } from "react";
import { Shield, Award, UserCheck, CheckCircle2, FileCheck, AlertCircle, ArrowRight, X } from "lucide-react";

interface BouncerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendUrl: string;
  onSuccess: () => void;
}

export const BouncerRegistrationModal: React.FC<BouncerRegistrationModalProps> = ({
  isOpen,
  onClose,
  backendUrl,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState(26);
  const [height, setHeight] = useState("5'8\"");
  const [weight, setWeight] = useState("68 kg");
  const [experienceYears, setExperienceYears] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(700);
  const [currentCity, setCurrentCity] = useState("New Delhi");
  const [policeVerificationId, setPoliceVerificationId] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [specialties, setSpecialties] = useState("Tactical Defense, Executive Transit, Crowd Control");
  const [languages, setLanguages] = useState("Hindi, English, Punjabi");
  const [weaponsCertified, setWeaponsCertified] = useState(true);
  const [bodyCameraEquipped, setBodyCameraEquipped] = useState(true);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Full Name is required.");
    if (!policeVerificationId.trim()) return setError("Police Clearance Certificate ID is required.");
    if (!aadhaarNumber.trim() || aadhaarNumber.replace(/\s/g, "").length !== 12) {
      return setError("Valid 12-digit Aadhaar Number is required for identity vetting.");
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${backendUrl}/api/bouncers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: Number(age),
          height,
          weight,
          experienceYears: Number(experienceYears),
          hourlyRate: Number(hourlyRate),
          currentCity,
          policeVerificationId: policeVerificationId.trim(),
          aadhaarNumber: aadhaarNumber.replace(/\s/g, ""),
          specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
          languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
          weaponsCertified,
          bodyCameraEquipped
        })
      });

      if (res.ok) {
        setSubmittedSuccess(true);
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit guard registration application.");
      }
    } catch (err) {
      console.error("Bouncer registration error:", err);
      setError("Network error communicating with security officer application server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-left relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xs p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Lady Security Guard Registration Application
            </h3>
            <span className="text-[10px] text-slate-500 font-mono block">
              Police Clearance Vetting & Background Identity Check Portal
            </span>
          </div>
        </div>

        {submittedSuccess ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-emerald-900 font-sans">Application Submitted Successfully!</h4>
            <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
              Your application and Police Clearance Certificate ID (<strong>{policeVerificationId}</strong>) have been received. Platform Admins will verify your Aadhaar records and approve your profile.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              CLOSE WINDOW
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gurpreet Kaur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Police Clearance ID / Certificate No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-PCR-2026-98421"
                  value={policeVerificationId}
                  onChange={(e) => setPoliceVerificationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">12-Digit Aadhaar Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="4921 0984 8923"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Primary Operational City</label>
                <select
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="New Delhi">New Delhi / NCR</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Dehradun">Dehradun</option>
                  <option value="Kota">Kota</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Experience (Years)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Standard Hourly Rate (₹)</label>
                <input
                  type="number"
                  required
                  min={300}
                  step={50}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Height</label>
                <input
                  type="text"
                  placeholder="5'8&quot;"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Weight</label>
                <input
                  type="text"
                  placeholder="68 kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Tactical Specialties (Comma Separated)</label>
              <input
                type="text"
                placeholder="Tactical Defense, VIP Protection, Krav Maga"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Languages Spoken (Comma Separated)</label>
              <input
                type="text"
                placeholder="Hindi, English, Punjabi"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                <input
                  type="checkbox"
                  checked={weaponsCertified}
                  onChange={(e) => setWeaponsCertified(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Weapons & Tactical Gear Certified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                <input
                  type="checkbox"
                  checked={bodyCameraEquipped}
                  onChange={(e) => setBodyCameraEquipped(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Body-Camera Telemetry Equipped</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-mono font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? "SUBMITTING FOR POLICE VETTING..." : "SUBMIT APPLICATION FOR ADMIN VERIFICATION"}
              <ArrowRight className="w-4 h-4 text-rose-400" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
