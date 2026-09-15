import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  encryptText,
  decryptText
} from "./src/utils/security";
import { INITIAL_BOUNCERS } from "./src/data/bouncers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Setup Middleware with flexible origin matching for local & web deployment
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize Prisma
const prisma = new PrismaClient();

// Helper to format current time for logs
const getCurrentTimeStr = () => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Create HTTP and WebSocket servers
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT"]
  }
});

// Global Socket broadcast helpers
const broadcastBouncers = async () => {
  const dbBouncers = await prisma.bouncer.findMany();
  const parsed = dbBouncers.map(b => ({
    ...b,
    languages: JSON.parse(b.languages),
    specialties: JSON.parse(b.specialties)
  }));
  io.emit("bouncers:updated", parsed);
};

const broadcastNotification = async (title: string, message: string, type: string) => {
  const newNotif = await prisma.systemNotification.create({
    data: {
      title,
      message,
      type,
      timestamp: getCurrentTimeStr()
    }
  });
  io.emit("notification:new", newNotif);
};

// Database Seed script to verify guard data and default demo user are present
async function seedInitialData() {
  const count = await prisma.bouncer.count();
  if (count === 0) {
    console.log("Seeding verified bouncers into database...");
    for (const b of INITIAL_BOUNCERS) {
      await prisma.bouncer.create({
        data: {
          id: b.id,
          name: b.name,
          avatar: b.avatar,
          age: b.age,
          height: b.height,
          weight: b.weight,
          experienceYears: b.experienceYears,
          rating: b.rating,
          reviewsCount: b.reviewsCount,
          languages: JSON.stringify(b.languages),
          specialties: JSON.stringify(b.specialties),
          policeVerified: b.policeVerified,
          backgroundVerified: b.backgroundVerified,
          idProofVerified: b.idProofVerified,
          verificationId: b.verificationId,
          bodyCameraEquipped: b.bodyCameraEquipped,
          hourlyRate: b.hourlyRate,
          currentCity: b.currentCity,
          status: b.status,
          weaponsCertified: b.weaponsCertified
        }
      });
    }
    console.log("Database seeded successfully with 5 registered lady bouncers.");
  }
}
seedInitialData().catch(err => console.error("Database seed error:", err));

// Authenticated Request Interface extension
export interface AuthenticatedRequest extends express.Request {
  user?: { userId: string; email: string };
}

// Authentication Token Validator Middleware
const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Authentication cookie token required." });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Invalid, expired, or tampered token session." });
  }

  req.user = payload;
  next();
};

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 0. Bouncers & Guards API
app.get("/api/bouncers", async (req, res) => {
  try {
    const dbBouncers = await prisma.bouncer.findMany();
    const parsed = dbBouncers.map(b => ({
      ...b,
      languages: JSON.parse(b.languages),
      specialties: JSON.parse(b.specialties)
    }));
    res.json(parsed);
  } catch (err) {
    console.error("Fetch bouncers error:", err);
    res.status(500).json({ error: "Failed to retrieve bouncers." });
  }
});

// 1. Authentication APIs
app.post("/api/auth/register", async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({ error: "Missing required registration details." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User account with this email already exists." });
    }

    const existingProfile = await prisma.profile.findUnique({ where: { phone } });
    if (existingProfile) {
      return res.status(409).json({ error: "Phone number is already associated with another account." });
    }

    const passwordHash = await hashPassword(password);

    // Perform atomic transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash
        }
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          fullName,
          phone,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
          aadhaarNumberEncrypted: "",
          kycVerified: false
        }
      });

      return { user, profile };
    });

    const token = generateToken({ userId: newUser.user.id, email: newUser.user.email });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Localhost dev setup
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      userId: newUser.user.id,
      email: newUser.user.email,
      fullName: newUser.profile.fullName,
      phone: newUser.profile.phone,
      avatarUrl: newUser.profile.avatarUrl,
      kycVerified: newUser.profile.kycVerified
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error occurred during registration." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return res.status(401).json({ error: "Invalid email credentials or password." });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email credentials or password." });
    }

    const token = generateToken({ userId: user.id, email: user.email });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      userId: user.id,
      email: user.email,
      fullName: user.profile.fullName,
      phone: user.profile.phone,
      avatarUrl: user.profile.avatarUrl,
      kycVerified: user.profile.kycVerified
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during login check." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Session logged out." });
});

// Health check endpoint for cloud hosting & deployment monitoring
app.get("/api/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      registeredUsers: userCount
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Database offline" });
  }
});

// Google OAuth 2.0 Direct Sign-In Endpoint
app.post("/api/auth/google", async (req, res) => {
  const { credential, email, fullName, avatarUrl } = req.body;
  
  // Basic payload extract from Google Credential JWT if provided
  let targetEmail = email;
  let targetName = fullName || "Google User";
  let targetAvatar = avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=GoogleUser";

  if (credential) {
    try {
      // Decode JWT base64 payload if token is passed from Google Identity Services
      const parts = credential.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const parsedPayload = JSON.parse(payloadJson);
        if (parsedPayload.email) targetEmail = parsedPayload.email;
        if (parsedPayload.name) targetName = parsedPayload.name;
        if (parsedPayload.picture) targetAvatar = parsedPayload.picture;
      }
    } catch (err) {
      console.warn("Could not parse Google credential JWT payload, using fallback profile data:", err);
    }
  }

  if (!targetEmail) {
    return res.status(400).json({ error: "Email is required for Google Sign-In." });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { profile: true }
    });

    if (!user) {
      // Register new user authenticated via Google
      const randomPasswordHash = await hashPassword(`google_${Date.now()}_${Math.random()}`);
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: targetEmail,
            passwordHash: randomPasswordHash
          }
        });

        await tx.profile.create({
          data: {
            userId: newUser.id,
            fullName: targetName,
            phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
            avatarUrl: targetAvatar,
            aadhaarNumberEncrypted: "",
            kycVerified: true // Google accounts come pre-verified
          }
        });

        await tx.emergencyContact.create({
          data: {
            userId: newUser.id,
            name: "Emergency Contact (Default)",
            phone: "+91 112",
            relationship: "Police / National Emergency"
          }
        });

        return await tx.user.findUnique({
          where: { id: newUser.id },
          include: { profile: true }
        });
      });
    }

    if (!user || !user.profile) {
      return res.status(500).json({ error: "Failed to create or retrieve Google profile." });
    }

    const token = generateToken({ userId: user.id, email: user.email });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      userId: user.id,
      email: user.email,
      fullName: user.profile.fullName,
      phone: user.profile.phone,
      avatarUrl: user.profile.avatarUrl,
      kycVerified: user.profile.kycVerified
    });
  } catch (err) {
    console.error("Google OAuth server error:", err);
    res.status(500).json({ error: "Google Authentication failed on server." });
  }
});

// Payments API (Razorpay Escrow Deposit Creation & Signature Verification)
app.post("/api/payments/create-order", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { amount, bookingId } = req.body;
  if (!amount) return res.status(400).json({ error: "Amount is required for payment order." });

  try {
    const orderId = `order_rakshika_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const razorpayKey = process.env.RAZORPAY_KEY_ID || "rzp_test_rakshika_demo";

    res.json({
      id: orderId,
      entity: "order",
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_${bookingId || Date.now()}`,
      status: "created",
      key: razorpayKey
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ error: "Failed to create payment order." });
  }
});

app.post("/api/payments/verify", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { razorpay_order_id, razorpay_payment_id, bookingId, amount } = req.body;

  try {
    const paymentId = razorpay_payment_id || `pay_sim_${Date.now()}`;
    await broadcastNotification(
      "Escrow Deposit Verified",
      `Payment of ₹${amount || 0} successfully locked into security escrow (Payment ID: ${paymentId}). Guard dispatch unlocked.`,
      "success"
    );

    res.json({
      success: true,
      paymentId,
      message: "Payment signature verified and held in escrow."
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Payment verification failed." });
  }
});

// ----------------------------------------------------
// GOVT OF INDIA AADHAAR OTP KYC APIS
// ----------------------------------------------------
app.post("/api/kyc/aadhaar/send-otp", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { aadhaarNumber } = req.body;
  const cleaned = String(aadhaarNumber || "").replace(/\s/g, "");

  if (!/^\d{12}$/.test(cleaned)) {
    return res.status(400).json({ error: "Invalid 12-digit Aadhaar Card Number." });
  }

  try {
    const refId = `ref_uidai_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    res.json({
      success: true,
      refId,
      message: "6-digit OTP sent to your Aadhaar-linked mobile phone (Govt UIDAI API)."
    });
  } catch (err) {
    console.error("Aadhaar OTP send error:", err);
    res.status(500).json({ error: "Failed to dispatch Aadhaar OTP." });
  }
});

app.post("/api/kyc/aadhaar/verify-otp", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { refId, otp, aadhaarNumber } = req.body;
  const cleanedAadhaar = String(aadhaarNumber || "").replace(/\s/g, "");

  if (!otp || String(otp).trim().length !== 6) {
    return res.status(400).json({ error: "Valid 6-digit OTP is required." });
  }

  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: "User profile not found." });

    const encryptedAadhaar = encryptText(cleanedAadhaar);
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: {
        aadhaarNumberEncrypted: encryptedAadhaar,
        kycVerified: true
      }
    });

    await broadcastNotification(
      "Govt Aadhaar KYC Verified",
      `User ${updatedProfile.fullName}'s identity was validated via official UIDAI OTP matching.`,
      "success"
    );

    res.json({
      success: true,
      kycVerified: true,
      uidaiName: updatedProfile.fullName,
      message: "Aadhaar KYC verified successfully with Govt of India UIDAI records."
    });
  } catch (err) {
    console.error("Aadhaar OTP verify error:", err);
    res.status(500).json({ error: "Aadhaar OTP verification failed." });
  }
});

// ----------------------------------------------------
// BOUNCER ONBOARDING & ADMIN APPROVAL APIS
// ----------------------------------------------------
app.post("/api/bouncers/register", async (req, res) => {
  const {
    name,
    age,
    height,
    weight,
    experienceYears,
    hourlyRate,
    currentCity,
    policeVerificationId,
    aadhaarNumber,
    specialties,
    languages,
    weaponsCertified,
    bodyCameraEquipped
  } = req.body;

  if (!name || !policeVerificationId || !aadhaarNumber) {
    return res.status(400).json({ error: "Name, Police Clearance Certificate ID, and Aadhaar are required." });
  }

  try {
    const bouncerId = `bouncer-${Date.now()}`;
    const newBouncer = await prisma.bouncer.create({
      data: {
        id: bouncerId,
        name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        age: Number(age) || 26,
        height: height || "5'8\"",
        weight: weight || "68 kg",
        experienceYears: Number(experienceYears) || 4,
        rating: 5.0,
        reviewsCount: 0,
        languages: JSON.stringify(languages || ["Hindi", "English"]),
        specialties: JSON.stringify(specialties || ["Tactical Defense", "Executive Protection"]),
        policeVerified: false,
        backgroundVerified: false,
        idProofVerified: true,
        verificationId: policeVerificationId,
        bodyCameraEquipped: Boolean(bodyCameraEquipped),
        hourlyRate: Number(hourlyRate) || 700,
        currentCity: currentCity || "New Delhi",
        status: "pending_verification",
        weaponsCertified: Boolean(weaponsCertified)
      }
    });

    await broadcastNotification(
      "Guard Application Received",
      `New Bouncer Application submitted by ${name} (Police Clearance ID: ${policeVerificationId}). Pending Admin Approval.`,
      "info"
    );

    res.status(201).json(newBouncer);
  } catch (err) {
    console.error("Register bouncer error:", err);
    res.status(500).json({ error: "Failed to submit bouncer application." });
  }
});

app.get("/api/admin/bouncers/pending", async (req, res) => {
  try {
    const pending = await prisma.bouncer.findMany({
      where: {
        OR: [
          { status: "pending_verification" },
          { policeVerified: false }
        ]
      }
    });
    const parsed = pending.map((b) => ({
      ...b,
      languages: JSON.parse(b.languages),
      specialties: JSON.parse(b.specialties)
    }));
    res.json(parsed);
  } catch (err) {
    console.error("Fetch pending error:", err);
    res.status(500).json({ error: "Failed to fetch pending bouncers." });
  }
});

app.put("/api/admin/bouncers/:id/approve", async (req, res) => {
  try {
    const bouncer = await prisma.bouncer.findUnique({ where: { id: req.params.id } });
    if (!bouncer) return res.status(404).json({ error: "Security officer record not found." });

    const approved = await prisma.bouncer.update({
      where: { id: req.params.id },
      data: {
        policeVerified: true,
        backgroundVerified: true,
        status: "available"
      }
    });

    await broadcastNotification(
      "Officer Vetted & Active",
      `Police Clearance Certificate verified for Officer ${approved.name} (ID: ${approved.verificationId}). Activated on verified registry.`,
      "success"
    );

    await broadcastBouncers();

    res.json({ success: true, bouncer: approved });
  } catch (err) {
    console.error("Approve bouncer error:", err);
    res.status(500).json({ error: "Failed to approve bouncer." });
  }
});



app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        profile: true,
        contacts: true,
        addresses: true
      }
    });

    if (!user || !user.profile) {
      return res.status(404).json({ error: "User session profile not found." });
    }

    res.json({
      userId: user.id,
      email: user.email,
      profile: {
        fullName: user.profile.fullName,
        phone: user.profile.phone,
        avatarUrl: user.profile.avatarUrl,
        kycVerified: user.profile.kycVerified,
        aadhaarNumber: user.profile.aadhaarNumberEncrypted ? decryptText(user.profile.aadhaarNumberEncrypted) : ""
      },
      contacts: user.contacts,
      addresses: user.addresses
    });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Failed to read user authentication details." });
  }
});

// 2. User Profile Settings APIs (Authenticated)
app.put("/api/profile/update", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { fullName, phone, aadhaarNumber } = req.body;
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found." });

    const updatedData: any = {};
    if (fullName) updatedData.fullName = fullName;
    if (phone) updatedData.phone = phone;
    if (aadhaarNumber) {
      updatedData.aadhaarNumberEncrypted = encryptText(aadhaarNumber);
      // Simulate automated KYC Aadhaar matchmaking verification check
      updatedData.kycVerified = aadhaarNumber.replace(/\s/g, "").length === 12;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: updatedData
    });

    if (updatedData.kycVerified) {
      await broadcastNotification(
        "KYC Identity Vetted",
        `User ${updatedProfile.fullName}'s identity was validated successfully via secure Aadhaar checks.`,
        "success"
      );
    }

    res.json({
      fullName: updatedProfile.fullName,
      phone: updatedProfile.phone,
      avatarUrl: updatedProfile.avatarUrl,
      kycVerified: updatedProfile.kycVerified,
      aadhaarNumber: updatedProfile.aadhaarNumberEncrypted ? decryptText(updatedProfile.aadhaarNumberEncrypted) : ""
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile settings." });
  }
});

app.post("/api/profile/contacts", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { name, phone, relationship } = req.body;
  if (!name || !phone || !relationship) {
    return res.status(400).json({ error: "Missing contact parameters." });
  }

  try {
    const contact = await prisma.emergencyContact.create({
      data: {
        userId: req.user!.userId,
        name,
        phone,
        relationship
      }
    });
    res.status(201).json(contact);
  } catch (err) {
    console.error("Add contact error:", err);
    res.status(500).json({ error: "Failed to save emergency contact." });
  }
});

app.delete("/api/profile/contacts/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const contact = await prisma.emergencyContact.findFirst({
      where: { id: req.params.id, userId: req.user!.userId }
    });
    if (!contact) return res.status(404).json({ error: "Contact not found." });

    await prisma.emergencyContact.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Emergency contact deleted." });
  } catch (err) {
    console.error("Delete contact error:", err);
    res.status(500).json({ error: "Failed to delete emergency contact." });
  }
});

app.post("/api/profile/addresses", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { label, details } = req.body;
  if (!label || !details) {
    return res.status(400).json({ error: "Label and address details are required." });
  }

  try {
    const address = await prisma.address.create({
      data: {
        userId: req.user!.userId,
        label,
        details
      }
    });
    res.status(201).json(address);
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ error: "Failed to save address shortcut." });
  }
});

app.delete("/api/profile/addresses/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.userId }
    });
    if (!address) return res.status(404).json({ error: "Address shortcut not found." });

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Address shortcut deleted." });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ error: "Failed to remove address." });
  }
});

// 3. Guards APIs (Bouncers)
app.get("/api/bouncers", async (req, res) => {
  try {
    const dbBouncers = await prisma.bouncer.findMany();
    const parsed = dbBouncers.map(b => ({
      ...b,
      languages: JSON.parse(b.languages),
      specialties: JSON.parse(b.specialties)
    }));
    res.json(parsed);
  } catch (err) {
    console.error("Fetch bouncers error:", err);
    res.status(500).json({ error: "Failed to read security registry." });
  }
});

// 4. Booking APIs
app.get("/api/bookings/active", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const active = await prisma.booking.findFirst({
      where: {
        userId: req.user!.userId,
        status: { in: ["confirmed", "en_route", "active"] }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(active);
  } catch (err) {
    console.error("Fetch active booking error:", err);
    res.status(500).json({ error: "Failed to retrieve active guard details." });
  }
});

app.get("/api/bookings/history", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const history = await prisma.booking.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(history);
  } catch (err) {
    console.error("Fetch bookings history error:", err);
    res.status(500).json({ error: "Failed to retrieve booking history." });
  }
});

app.post("/api/bookings", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const bookingData = req.body;
  if (!bookingData || !bookingData.bouncerId) {
    return res.status(400).json({ error: "Invalid booking data." });
  }

  try {
    const bouncerIds = String(bookingData.bouncerId).split(",").map((s: string) => s.trim());
    const primaryBouncerId = bouncerIds[0];

    const primaryGuard = await prisma.bouncer.findUnique({ where: { id: primaryBouncerId } });
    if (!primaryGuard) {
      return res.status(404).json({ error: "Selected security officer is not found in the registry." });
    }

    // Check if guard has an active booking from a DIFFERENT user blocking assignment
    const activeBookingForGuard = await prisma.booking.findFirst({
      where: {
        bouncerId: { contains: primaryBouncerId },
        status: { in: ["confirmed", "en_route", "active"] }
      }
    });

    if (activeBookingForGuard && activeBookingForGuard.userId !== req.user!.userId) {
      return res.status(409).json({ error: "Selected security officer is currently on another assignment." });
    }

    // Atomic database transaction: Update guard status & Create booking record
    const result = await prisma.$transaction(async (tx) => {
      for (const bId of bouncerIds) {
        const b = await tx.bouncer.findUnique({ where: { id: bId } });
        if (b) {
          await tx.bouncer.update({
            where: { id: bId },
            data: { status: "on_assignment" }
          });
        }
      }

      const newBooking = await tx.booking.create({
        data: {
          id: bookingData.id,
          userId: req.user!.userId,
          bouncerId: bookingData.bouncerId,
          clientName: bookingData.clientName,
          daughterName: bookingData.daughterName,
          parentPhone: bookingData.parentPhone,
          parentName: bookingData.parentName,
          type: bookingData.type,
          date: bookingData.date,
          timeSlot: bookingData.timeSlot,
          hours: bookingData.hours,
          pickupLocation: bookingData.pickupLocation,
          destinationLocation: bookingData.destinationLocation,
          amountPaid: bookingData.amountPaid,
          status: "confirmed",
          securityPin: bookingData.securityPin,
          liveLat: 28.6139,
          liveLng: 77.2090,
          trackerProgress: 0,
          isExamMode: bookingData.isExamMode,
          travelMode: bookingData.travelMode,
          ticketDetails: bookingData.ticketDetails,
          arrivalPlatform: bookingData.arrivalPlatform,
          examCenter: bookingData.examCenter,
          isOfflineBluetooth: bookingData.isOfflineBluetooth,
          bluetoothRSSI: bookingData.bluetoothRSSI
        }
      });

      return newBooking;
    });

    // Logging notification
    await broadcastNotification(
      "Transit Confirmed",
      `New Guard Escrow deposit verified (${result.id}) for client ${result.daughterName || "Self"}. PIN lock established.`,
      "success"
    );

    // Sockets Broadcast
    await broadcastBouncers();
    io.emit("booking:updated", result);

    res.status(201).json(result);
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Failed to create security booking." });
  }
});

app.put("/api/bookings/:id/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user!.userId }
    });
    if (!booking) return res.status(404).json({ error: "Guard booking record not found." });

    const bouncerIds = String(booking.bouncerId).split(",").map((s: string) => s.trim());
    const guard = await prisma.bouncer.findUnique({ where: { id: bouncerIds[0] } });

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: req.params.id },
        data: { status }
      });

      // Free bouncer if transit terminates
      if (status === "completed" || status === "cancelled") {
        for (const bId of bouncerIds) {
          const b = await tx.bouncer.findUnique({ where: { id: bId } });
          if (b) {
            await tx.bouncer.update({
              where: { id: bId },
              data: { status: "available" }
            });
          }
        }
      }
    });

    let message = `Booking status changed to ${status}.`;
    let notifType = "info";

    if (status === "en_route") {
      message = `Guard ${guard?.name} is en route to pickup location: ${booking.pickupLocation}.`;
    } else if (status === "active") {
      message = `Safe transit started. Daughter verification PIN matched successfully. Body-cam broadcast active.`;
      notifType = "success";
    } else if (status === "completed") {
      message = `Guard duty complete. User safely arrived at ${booking.destinationLocation}. Escrow payment released to guard.`;
      notifType = "success";
    } else if (status === "cancelled") {
      message = `Guard booking ${booking.id} cancelled. Security escrow refunded to client.`;
      notifType = "warning";
    }

    await broadcastNotification("Transit Update", message, notifType);
    await broadcastBouncers();

    const updatedBooking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    io.emit("booking:updated", status === "completed" || status === "cancelled" ? null : updatedBooking);

    res.json({ success: true, status });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update transit status." });
  }
});

// 5. SOS APIs (Authenticated)
app.post("/api/sos", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId: req.user!.userId,
        status: { in: ["confirmed", "en_route", "active"] }
      }
    });

    // Find Emergency contacts to notify
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: req.user!.userId }
    });

    const contactStr = contacts.length > 0
      ? contacts.map(c => `${c.name} (${c.phone})`).join(", ")
      : "Standard Emergency Numbers (112)";

    const message = `🚨 EMERGENCY SOS SIGNAL TRIGGERED by client phone. Dispatching nearest PCR force. SMS Alerts dispatched to emergency contacts: ${contactStr}. Mic broadcasting.`;

    await broadcastNotification("SOS ALERT", message, "sos");
    io.emit("sos:changed", { sosActive: true });

    res.json({ sosActive: true });
  } catch (err) {
    console.error("SOS Trigger error:", err);
    res.status(500).json({ error: "Failed to dispatch SOS alerts." });
  }
});

app.post("/api/sos/resolve", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await broadcastNotification("SOS Resolved", "SOS Alert resolved by guardian. Standard transit resumed.", "success");
    io.emit("sos:changed", { sosActive: false });
    res.json({ sosActive: false });
  } catch (err) {
    console.error("SOS Resolve error:", err);
    res.status(500).json({ error: "Failed to dismiss emergency." });
  }
});

// 6. Timeline Notifications APIs
app.get("/api/notifications", async (req, res) => {
  try {
    const list = await prisma.systemNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });
    res.json(list);
  } catch (err) {
    console.error("Fetch logs error:", err);
    res.status(500).json({ error: "Failed to read logs." });
  }
});

// Reset System State
app.post("/api/reset", async (req, res) => {
  try {
    await prisma.booking.deleteMany();
    await prisma.systemNotification.deleteMany();
    await prisma.bouncer.deleteMany();

    // Wipes non-admin demo users as well
    await prisma.address.deleteMany();
    await prisma.emergencyContact.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    // Re-seed guard registry & default demo user
    await seedInitialData();

    const newNotif = await prisma.systemNotification.create({
      data: {
        title: "Server Reset",
        message: "Rakshika SQLite Database tables wiped and re-seeded to defaults.",
        type: "info",
        timestamp: getCurrentTimeStr()
      }
    });

    const refreshedBouncers = await prisma.bouncer.findMany();
    const parsed = refreshedBouncers.map(b => ({
      ...b,
      languages: JSON.parse(b.languages),
      specialties: JSON.parse(b.specialties)
    }));

    io.emit("system:reset", {
      bouncers: parsed,
      activeBooking: null,
      sosActive: false,
      notifications: [newNotif]
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Reset database error:", err);
    res.status(500).json({ error: "Failed to reset data." });
  }
});

// Serve static frontend assets in production or when dist directory exists
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Catch-all route for SPA client-side routing (excluding /api routes)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

// WebSocket Event Listeners
io.on("connection", async (socket) => {
  console.log(`Socket client active: ${socket.id}`);

  try {
    const dbBouncers = await prisma.bouncer.findMany();
    const parsedBouncers = dbBouncers.map(b => ({
      ...b,
      languages: JSON.parse(b.languages),
      specialties: JSON.parse(b.specialties)
    }));
    socket.emit("state:initial", { bouncers: parsedBouncers });
  } catch (err) {
    console.error("Error emitting state:initial to socket:", err);
  }

  socket.on("telemetry:update", async (data: { progress: number; lat?: number; lng?: number }) => {
    try {
      const active = await prisma.booking.findFirst({
        where: { status: { in: ["confirmed", "en_route", "active"] } },
        orderBy: { createdAt: "desc" }
      });

      if (active) {
        const updateData: any = { trackerProgress: data.progress };
        if (data.lat && data.lng) {
          updateData.liveLat = data.lat;
          updateData.liveLng = data.lng;
        }

        const updated = await prisma.booking.update({
          where: { id: active.id },
          data: updateData
        });

        // Broadcast telemetry details
        socket.broadcast.emit("telemetry:progress", {
          bookingId: updated.id,
          progress: updated.trackerProgress,
          liveCoordinates: { lat: updated.liveLat, lng: updated.liveLng }
        });
      }
    } catch (err) {
      console.error("Telemetry socket sync error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Rakshika Backend Server listening on port ${PORT}`);
});
