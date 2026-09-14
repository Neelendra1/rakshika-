// Government of India Aadhaar OTP KYC Verification Engine (Cashfree / SurePass / Digilocker API Protocol)

export interface AadhaarOtpRequest {
  aadhaarNumber: string;
}

export interface AadhaarOtpResponse {
  success: boolean;
  refId?: string;
  message: string;
}

export interface AadhaarVerifyRequest {
  refId: string;
  otp: string;
  aadhaarNumber: string;
}

export interface AadhaarVerifyResponse {
  success: boolean;
  message: string;
  kycVerified: boolean;
  uidaiName?: string;
  aadhaarNumberEncrypted?: string;
}

// Helper to validate 12-digit Aadhaar Format
export const validateAadhaarFormat = (aadhaar: string): boolean => {
  const cleaned = aadhaar.replace(/\s/g, "");
  return /^\d{12}$/.test(cleaned);
};

// Send Aadhaar OTP Request via Backend
export const requestAadhaarOtp = async (backendUrl: string, aadhaarNumber: string): Promise<AadhaarOtpResponse> => {
  const cleaned = aadhaarNumber.replace(/\s/g, "");
  if (!validateAadhaarFormat(cleaned)) {
    return { success: false, message: "Invalid 12-digit Aadhaar Number format." };
  }

  try {
    const res = await fetch(`${backendUrl}/api/kyc/aadhaar/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ aadhaarNumber: cleaned })
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || "Aadhaar OTP dispatch failed." };
    }

    return {
      success: true,
      refId: data.refId,
      message: data.message || "6-digit OTP sent to your Aadhaar-linked mobile phone."
    };
  } catch (err: any) {
    console.error("Aadhaar OTP request error:", err);
    return { success: false, message: "Could not communicate with Aadhaar KYC server." };
  }
};

// Verify Aadhaar OTP via Backend
export const verifyAadhaarOtp = async (
  backendUrl: string,
  refId: string,
  otp: string,
  aadhaarNumber: string
): Promise<AadhaarVerifyResponse> => {
  if (!otp || otp.trim().length !== 6) {
    return { success: false, kycVerified: false, message: "Please enter a valid 6-digit OTP." };
  }

  try {
    const res = await fetch(`${backendUrl}/api/kyc/aadhaar/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refId, otp: otp.trim(), aadhaarNumber })
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, kycVerified: false, message: data.error || "OTP Verification failed." };
    }

    return {
      success: true,
      kycVerified: data.kycVerified,
      uidaiName: data.uidaiName,
      message: data.message || "Aadhaar KYC verified successfully with Govt of India records!"
    };
  } catch (err: any) {
    console.error("Aadhaar OTP verification error:", err);
    return { success: false, kycVerified: false, message: "Aadhaar OTP verification request failed." };
  }
};
