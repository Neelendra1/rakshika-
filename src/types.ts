/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LadyBouncer {
  id: string;
  name: string;
  avatar: string;
  age: number;
  height: string; // e.g. "5'9\""
  weight: string; // e.g. "72 kg"
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  languages: string[];
  specialties: string[]; // e.g. ["Martial Arts Blackbelt", "VIP Crowd Control", "Tactical Evacuation"]
  policeVerified: boolean;
  backgroundVerified: boolean;
  idProofVerified: boolean; // e.g. Aadhaar or Passport
  verificationId: string; // e.g. "POL-DEL-8941"
  bodyCameraEquipped: boolean;
  hourlyRate: number; // in INR
  currentCity: string;
  status: "available" | "on_assignment" | "offline";
  weaponsCertified: boolean; // non-lethal, e.g., pepper-spray, tactical baton, taser
}

export interface Booking {
  id: string;
  bouncerId: string;
  clientName: string;
  daughterName?: string; // Optional if booked by parent
  parentPhone?: string;
  parentName?: string;
  type: "hourly_transit" | "event_protection" | "vip_protection";
  date: string;
  timeSlot: string;
  hours: number;
  guardCount?: number; // Quantity of lady bouncers booked (default 1)
  pickupLocation: string;
  destinationLocation: string;
  amountPaid: number;
  status: "pending" | "confirmed" | "en_route" | "active" | "completed" | "cancelled";
  securityPin: string; // e.g., "4921" (daughter must match with bouncer)
  liveCoordinates: {
    lat: number;
    lng: number;
  };
  trackerProgress: number; // 0 to 100 for path simulation
  // Inter-city Exam Travel Mode additions
  isExamMode?: boolean;
  travelMode?: "train" | "bus" | "other";
  ticketDetails?: string;
  arrivalPlatform?: string;
  examCenter?: string;
  // Offline Bluetooth Mesh additions
  isOfflineBluetooth?: boolean;
  bluetoothRSSI?: number;
}

export interface SOSAlert {
  id: string;
  clientName: string;
  bouncerName?: string;
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  batteryLevel: number;
  status: "triggered" | "contacts_notified" | "police_dispatched" | "resolved";
  audioRecordingSimulated: boolean;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "sos" | "success";
  timestamp: string;
}

export type UserRole = "user" | "admin" | "bouncer";

export interface UserState {
  userId: string;
  email: string;
  role: UserRole;
  profile: {
    fullName: string;
    phone: string;
    avatarUrl: string;
    kycVerified: boolean;
    aadhaarNumber: string;
  };
}

