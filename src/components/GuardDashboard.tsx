import React, { useState } from "react";
import {
  ShieldCheck,
  Power,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Video,
  Zap,
  DollarSign,
  PhoneCall,
  UserCheck,
  Navigation
} from "lucide-react";
import { LadyBouncer, Booking } from "../types";

interface GuardDashboardProps {
  bouncer: LadyBouncer;
  assignedBookings: Booking[];
  onToggleStatus: (status: "available" | "on_assignment" | "offline") => void;
  onUpdateBookingStatus?: (bookingId: string, status: Booking["status"]) => void;
}

export const GuardDashboard: React.FC<GuardDashboardProps> = ({
  bouncer,
  assignedBookings,
  onToggleStatus,
  onUpdateBookingStatus
}) => {
  const [currentStatus, setCurrentStatus] = useState<"available" | "on_assignment" | "offline">(
    bouncer.status || "available"
  );

  const handleStatusChange = (newStatus: "available" | "on_assignment" | "offline") => {
    setCurrentStatus(newStatus);
    onToggleStatus(newStatus);
  };

  const activeBooking = assignedBookings.find(
    (b) => b.status === "confirmed" || b.status === "en_route" || b.status === "active"
  ) || assignedBookings[0];

  const totalEarnings = assignedBookings.reduce((sum, b) => sum + b.amountPaid, 0);

  return (
    <div className="w-full space-y-6 text-left animate-fadeIn">
      {/* Top Banner & Duty Status Control */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-rose-900/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <img
              src={bouncer.avatar}
              alt={bouncer.name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-rose-400/80 object-cover shadow-lg"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                currentStatus === "available"
                  ? "bg-emerald-500 animate-pulse"
                  : currentStatus === "on_assignment"
                  ? "bg-amber-500 animate-ping"
                  : "bg-slate-500"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold font-sans text-white">{bouncer.name}</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                POLICE CERTIFIED GUARD
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-3 flex-wrap">
              <span>🆔 Police ID: <strong className="text-emerald-300">{bouncer.verificationId}</strong></span>
              <span>⭐ {bouncer.rating} Rating ({bouncer.reviewsCount} Duties)</span>
              <span>📍 {bouncer.currentCity}</span>
            </p>
          </div>
        </div>

        {/* Duty Availability Selector */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 w-full md:w-auto relative z-10 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest block text-center">
            DUTY STATUS CONTROL
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleStatusChange("available")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                currentStatus === "available"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              AVAILABLE
            </button>
            <button
              onClick={() => handleStatusChange("on_assignment")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                currentStatus === "on_assignment"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              ON DUTY
            </button>
            <button
              onClick={() => handleStatusChange("offline")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                currentStatus === "offline"
                  ? "bg-slate-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              OFFLINE
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Completed Duties</span>
          <span className="text-xl font-bold font-mono text-slate-900">{bouncer.reviewsCount} Shifts</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Duty Earnings</span>
          <span className="text-xl font-bold font-mono text-emerald-600">₹{totalEarnings > 0 ? totalEarnings : 3400}</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Body-Cam Telemetry</span>
          <span className="text-sm font-bold font-mono text-indigo-600 flex items-center gap-1 mt-1">
            <Video className="w-4 h-4 text-indigo-500" /> ACTIVE LOGGING
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Hourly Compensation</span>
          <span className="text-xl font-bold font-mono text-slate-900">₹{bouncer.hourlyRate}/hr</span>
        </div>
      </div>

      {/* Active Duty Console */}
      {activeBooking ? (
        <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm space-y-5 text-left relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">
                ASSIGNED GUARD DUTY: #{activeBooking.id}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full uppercase">
              {activeBooking.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                CLIENT & TRAVELER DETAILS
              </span>
              <div className="text-xs text-slate-800 font-sans space-y-1">
                <p><strong>Primary Client:</strong> {activeBooking.clientName}</p>
                {activeBooking.daughterName && <p><strong>Protected Traveler:</strong> {activeBooking.daughterName}</p>}
                {activeBooking.parentPhone && <p><strong>Emergency Contact:</strong> {activeBooking.parentPhone}</p>}
                <p><strong>Security Verification PIN:</strong> <span className="bg-slate-900 text-pink-300 px-2 py-0.5 rounded font-mono font-bold text-xs">{activeBooking.securityPin}</span></p>
              </div>
            </div>

            {/* Location Route */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                DUTY ROUTE & TIMING
              </span>
              <div className="text-xs text-slate-800 font-sans space-y-1">
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Pickup:</strong> {activeBooking.pickupLocation}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Destination:</strong> {activeBooking.destinationLocation}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Slot: {activeBooking.date} • {activeBooking.timeSlot} ({activeBooking.hours} hrs)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(activeBooking.id, "en_route")}
              className="bg-blue-900 hover:bg-blue-950 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-blue-400" />
              <span>MARK EN-ROUTE TO PICKUP</span>
            </button>

            <button
              onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(activeBooking.id, "active")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>START ACTIVE PROTECTED TRANSIT</span>
            </button>

            <button
              onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(activeBooking.id, "completed")}
              className="bg-slate-900 hover:bg-slate-950 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-pink-400" />
              <span>MARK DUTY COMPLETED</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">No Active Duty Assignments</h3>
          <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
            You are currently marked as {currentStatus.toUpperCase()}. When a new protection request matches your city ({bouncer.currentCity}), duty notifications will alert you here.
          </p>
        </div>
      )}
    </div>
  );
};
