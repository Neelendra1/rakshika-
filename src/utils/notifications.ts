// Browser Push Notifications & Native SMS Fallback Engine

// Request browser notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

// Trigger a native browser notification
export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        icon: "/hero_banner.png",
        badge: "/hero_banner.png",
        ...options
      } as any);
    } catch (err) {
      console.warn("Could not dispatch notification:", err);
    }
  }
};

// Build Native Cellular SMS Protocol URL for offline emergency fallback
export const triggerOfflineSmsSOS = (
  emergencyContacts: { name: string; phone: string }[],
  currentLocation?: { lat: number; lng: number }
) => {
  const phones = emergencyContacts.map((c) => c.phone).filter(Boolean);
  const targetPhones = phones.length > 0 ? phones.join(",") : "112";

  const locStr = currentLocation
    ? `https://maps.google.com/?q=${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}`
    : "Location active";

  const messageText = encodeURIComponent(
    `🚨 EMERGENCY RAKSHIKA SOS ALERT! I require immediate physical security assistance. My live location: ${locStr}`
  );

  // Cross-platform SMS protocol URI
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsUrl = isIOS ? `sms:${targetPhones}&body=${messageText}` : `sms:${targetPhones}?body=${messageText}`;

  console.log("[Rakshika SMS] Launching cellular SMS app to fallback offline dispatch...");
  window.location.href = smsUrl;
};
