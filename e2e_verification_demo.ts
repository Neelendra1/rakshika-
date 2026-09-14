
async function runDemo() {
  const BACKEND_URL = "http://localhost:3001";
  let cookieHeader = "";

  console.log("\n==============================================================");
  console.log("   RAKSHIKA SECURE TELEMETRY NETWORK - E2E API VERIFICATION  ");
  console.log("==============================================================\n");

  // Helper for requests
  const sendRequest = async (path: string, method: string = "GET", body?: any) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Parse set-cookie header if present
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      cookieHeader = setCookie.split(";")[0];
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API failed on ${path}: ${response.status} - ${err.error || response.statusText}`);
    }

    return response.json();
  };

  try {
    // 0. Reset State
    console.log("[1/9] Reser Demo state database tables...");
    await sendRequest("/api/reset", "POST");
    console.log("✔ Server reset complete.\n");

    // 1. User Registration
    console.log("[2/9] Simulating User Registration (Rajesh Sharma)...");
    const regRes = await sendRequest("/api/auth/register", "POST", {
      email: "rajesh_demo@gmail.com",
      password: "password123",
      fullName: "Rajesh Sharma",
      phone: "+91 98102 99999"
    });
    console.log(`✔ Registration successful. User ID: ${regRes.userId}`);
    console.log(`  Profile: ${regRes.fullName} (${regRes.phone})`);
    console.log(`  KYC Verified Status: ${regRes.kycVerified ? "VERIFIED" : "PENDING"}\n`);

    // 2. Fetch Self Profile
    console.log("[3/9] Verifying user session login (cookie authentication)...");
    const meRes = await sendRequest("/api/auth/me", "GET");
    console.log(`✔ Auth gate passed. Email: ${meRes.email}`);
    console.log(`  Full Name: ${meRes.profile.fullName}\n`);

    // 3. Link Aadhaar (KYC Vetting)
    console.log("[4/9] Securing Aadhaar Link (KYC Verification check)...");
    const kycRes = await sendRequest("/api/profile/update", "PUT", {
      fullName: "Rajesh Sharma",
      phone: "+91 98102 99999",
      aadhaarNumber: "492109848923"
    });
    console.log(`✔ Aadhaar Linked successfully.`);
    console.log(`  KYC Status check: ${kycRes.kycVerified ? "✓ APPROVED (KYC COMPLETE)" : "❌ FAILED"}`);
    console.log(`  Decrypted Aadhaar stored safely: ${kycRes.aadhaarNumber}\n`);

    // 4. Register Emergency Contact
    console.log("[5/9] Adding emergency contact...");
    const contactRes = await sendRequest("/api/profile/contacts", "POST", {
      name: "Anjali Sharma",
      phone: "+91 98123 45678",
      relationship: "Daughter"
    });
    console.log(`✔ Emergency contact registered: ${contactRes.name} (${contactRes.relationship}) at ${contactRes.phone}\n`);

    // 5. Add Location Shortcut
    console.log("[6/9] Saving address shortcuts (Pronto/Urban Company style)...");
    const addrRes = await sendRequest("/api/profile/addresses", "POST", {
      label: "Home",
      details: "Vasant Kunj Metro, New Delhi"
    });
    console.log(`✔ Shortcut saved: [${addrRes.label}] at ${addrRes.details}\n`);

    // 6. Hire Guard (Booking Escrow)
    console.log("[7/9] Initiating lady guard booking & locking escrow payment...");
    const bookingRes = await sendRequest("/api/bookings", "POST", {
      id: "BK-Demo123",
      bouncerId: "bouncer-1", // Gurpreet Kaur
      clientName: "Rajesh Sharma (Parent)",
      daughterName: "Anjali Sharma",
      parentPhone: "+91 98102 45892",
      parentName: "Rajesh Sharma",
      type: "hourly_transit",
      date: "2026-07-19",
      timeSlot: "20:30",
      hours: 3,
      pickupLocation: addrRes.details, // Using shortcut details!
      destinationLocation: "Amity University, Noida",
      amountPaid: 1950,
      securityPin: "4921",
    });
    console.log(`✔ Booking confirmed successfully.`);
    console.log(`  Booking ID: ${bookingRes.id}`);
    console.log(`  Assigned Guard ID: ${bookingRes.bouncerId}`);
    console.log(`  Transit Route: ${bookingRes.pickupLocation} → ${bookingRes.destinationLocation}`);
    console.log(`  Cryptographic Security PIN: ${bookingRes.securityPin}`);
    console.log(`  Escrow Lock Amount: ₹${bookingRes.amountPaid}\n`);

    // 7. Trigger SOS Emergency Panic Alert
    console.log("[8/11] Triggering Emergency SOS Beacon (simulating daughter panic key)...");
    const sosRes = await sendRequest("/api/sos", "POST");
    console.log(`✔ SOS alert active status: ${sosRes.sosActive}`);
    console.log("  Emergency notifications broadcasted. Checking timeline notifications...\n");

    // 8. Resolve SOS Alarm
    console.log("[9/11] Dismissing SOS alarm (parent safe dismissal code)...");
    const resolveRes = await sendRequest("/api/sos/resolve", "POST");
    console.log(`✔ SOS alert active status: ${resolveRes.sosActive}`);
    console.log("  Alarm dismissed safely.\n");

    // 9. Test Google OAuth Direct Sign-In
    console.log("[10/11] Testing Google Direct Sign-In endpoint (/api/auth/google)...");
    const googleRes = await sendRequest("/api/auth/google", "POST", {
      email: "anjali.sharma.google@gmail.com",
      fullName: "Anjali Sharma",
      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Anjali"
    });
    console.log(`✔ Google Sign-In successful.`);
    console.log(`  User ID: ${googleRes.userId}`);
    console.log(`  Google Account Email: ${googleRes.email}`);
    console.log(`  KYC Pre-verified Status: ${googleRes.kycVerified ? "VERIFIED (GOOGLE)" : "PENDING"}\n`);

    // 10. Test Razorpay Escrow Deposit Order & Signature Verification
    console.log("[11/11] Testing Razorpay Payment Escrow APIs (/api/payments)...");
    const paymentOrder = await sendRequest("/api/payments/create-order", "POST", {
      amount: 1950,
      bookingId: bookingRes.id
    });
    console.log(`✔ Razorpay Payment Order created: ID ${paymentOrder.id}, Amount: ₹${paymentOrder.amount / 100}`);

    const verifyPayment = await sendRequest("/api/payments/verify", "POST", {
      razorpay_order_id: paymentOrder.id,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      bookingId: bookingRes.id,
      amount: 1950
    });
    console.log(`✔ Razorpay Signature Verification: ${verifyPayment.success ? "PASSED (ESCROW LOCKED)" : "FAILED"}\n`);

    // 11. Final check of system logs
    console.log("==============================================================");
    console.log("                 SYSTEM TELEMETRY DATABASE LOGS               ");
    console.log("==============================================================");
    const notifications = await sendRequest("/api/notifications", "GET");
    notifications.slice(0, 6).forEach((n: any) => {
      console.log(`[${n.timestamp}] [${n.type.toUpperCase()}] ${n.title}: ${n.message}`);
    });
    console.log("==============================================================\n");

    console.log("✔ End-To-End Application Verification & Automation Test SUCCEEDED!");
  } catch (err: any) {
    console.error("❌ E2E Demo failed with error:", err.message);
  }
}

runDemo();
