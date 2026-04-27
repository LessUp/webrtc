export const DEFAULT_RTC_CONFIG = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
};

export const ROOM_STATE_TEXT = {
  idle: '未连接',
  connecting: '正在加入房间',
  joined: '已加入房间',
  calling: '通话中',
  reconnecting: '信令重连中'
};

export const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000];

export function createClientId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(6);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, function (value) {
      return value.toString(16).padStart(2, '0');
    }).join('');
  }
  // No secure random available - reject rather than use unsafe fallback
  throw new Error('Secure random number generation not available. Please use a modern browser with crypto support.');
}

export function getCapabilities() {
  return {
    webSocket: typeof window.WebSocket === 'function',
    rtc: typeof window.RTCPeerConnection === 'function',
    media: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    screen: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
    record: typeof window.MediaRecorder === 'function'
  };
}

export function getRtcConfig(appConfig, fallbackConfig) {
  if (appConfig && appConfig.rtcConfig && Array.isArray(appConfig.rtcConfig.iceServers)) {
    return appConfig.rtcConfig;
  }
  return fallbackConfig;
}
