// Razorpay SDK Script Loader and Escrow Deposit Handler

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpaySDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface ProcessPaymentOptions {
  amount: number;
  bookingId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  backendUrl: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (errorMessage: string) => void;
}

export const processEscrowPayment = async (options: ProcessPaymentOptions): Promise<void> => {
  const { amount, bookingId, clientName, clientPhone, clientEmail, backendUrl, onSuccess, onFailure } = options;

  try {
    // 1. Request Order Creation from Backend
    const orderRes = await fetch(`${backendUrl}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount, bookingId })
    });

    if (!orderRes.ok) {
      const errorData = await orderRes.json();
      throw new Error(errorData.error || "Failed to create payment order.");
    }

    const orderData = await orderRes.json();
    const sdkLoaded = await loadRazorpaySDK();

    // If Razorpay SDK loaded, launch Razorpay Checkout Modal
    if (sdkLoaded && window.Razorpay) {
      const razorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Rakshika Security Escrow",
        description: `Escrow Deposit for Guard Booking ${bookingId}`,
        image: "/hero_banner.png",
        order_id: orderData.id,
        prefill: {
          name: clientName,
          email: clientEmail,
          contact: clientPhone
        },
        theme: {
          color: "#4f46e5"
        },
        handler: async function (response: any) {
          // Verify payment on backend
          try {
            const verifyRes = await fetch(`${backendUrl}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
                amount
              })
            });

            if (verifyRes.ok) {
              onSuccess(response.razorpay_payment_id || `pay_rzp_${Date.now()}`);
            } else {
              throw new Error("Payment signature verification failed.");
            }
          } catch (err: any) {
            onFailure(err.message || "Payment verification error.");
          }
        },
        modal: {
          ondismiss: function () {
            onFailure("Payment process cancelled by user.");
          }
        }
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
    } else {
      // Fallback Developer Simulation Mode if offline or script blocked
      console.warn("[Razorpay] Script unavailable or offline. Triggering Escrow Simulation...");
      const verifyRes = await fetch(`${backendUrl}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          bookingId,
          amount
        })
      });

      if (verifyRes.ok) {
        onSuccess(`pay_sim_${Date.now()}`);
      } else {
        throw new Error("Simulated payment failed.");
      }
    }
  } catch (err: any) {
    console.error("Payment Error:", err);
    onFailure(err.message || "An unexpected payment error occurred.");
  }
};
