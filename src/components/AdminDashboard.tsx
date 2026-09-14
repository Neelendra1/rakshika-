import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle, XCircle, FileCheck, ShieldAlert, Award, RefreshCw, UserCheck } from "lucide-react";
import { LadyBouncer } from "../types";

interface AdminDashboardProps {
  backendUrl: string;
  onBouncerApproved: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ backendUrl, onBouncerApproved }) => {
  const [pendingBouncers, setPendingBouncers] = useState<LadyBouncer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const fetchPendingBouncers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/bouncers/pending`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPendingBouncers(data);
      }
    } catch (err) {
      console.error("Fetch pending error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBouncers();
  }, []);

  const handleApproveGuard = async (id: string, name: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/bouncers/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (res.ok) {
        setActionMessage(`✔ Officer ${name} approved and activated on verified registry.`);
        fetchPendingBouncers();
        onBouncerApproved();
      }
    } catch (err) {
      console.error("Approve guard error:", err);
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-3 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wider">
              Admin Police Clearance & Bouncer Verification Portal
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Review government Aadhaar records, Police Clearance Certificate IDs, and approve female physical security officers.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPendingBouncers}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold px-4 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REFRESH LIST</span>
        </button>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-mono font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage("")} className="text-emerald-600 font-bold text-xs">✕</button>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-mono">Loading pending officer applications...</p>
        </div>
      ) : pendingBouncers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-3xs">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">All Pending Applications Verified</h3>
          <p className="text-xs text-slate-500 mt-1">There are no pending bouncer applications requiring police vetting approval at this moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingBouncers.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 text-left relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={b.avatar} alt={b.name} className="w-12 h-12 rounded-full border border-slate-300" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-sans">{b.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block">City: {b.currentCity} • Experience: {b.experienceYears} Years</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                  Pending Verification
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Police Clearance ID:</span>
                  <span className="font-bold text-slate-800">{b.verificationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hourly Rate:</span>
                  <span className="font-bold text-slate-900">₹{b.hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Body Cam / Weapons:</span>
                  <span className="text-slate-700">{b.bodyCameraEquipped ? "Body-Cam ✓" : ""} {b.weaponsCertified ? "Weapons ✓" : ""}</span>
                </div>
              </div>

              <button
                onClick={() => handleApproveGuard(b.id, b.name)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>APPROVE & VERIFY POLICE CLEARANCE</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
