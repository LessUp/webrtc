import {
  DEFAULT_RTC_CONFIG,
  RECONNECT_DELAYS_MS,
  ROOM_STATE_TEXT,
  createClientId,
  getCapabilities,
  getRtcConfig
} from '../config.js';
import { createAppState, RoomStatus } from '../state/index.js';
import { createChatController } from '../controllers/chat.js';
import { createMediaController } from '../controllers/media.js';
import { createPeerController } from '../controllers/peers.js';
import { createSignalingController } from '../controllers/signaling.js';
import { createStatsController } from '../controllers/stats.js';
import { createUI, getElements } from '../controllers/ui.js';

const elements = getElements();
const capabilities = getCapabilities();
const appConfig = window.__APP_CONFIG__ || {};
const rtcConfig = getRtcConfig(appConfig, DEFAULT_RTC_CONFIG);

// 使用新的状态管理器
const appState = createAppState({ myId: createClientId() });

if (elements.idEl) {
  elements.idEl.textContent = appState.getMyId();
}

const ui = createUI({
  capabilities: capabilities,
  elements: elements,
  roomStateText: ROOM_STATE_TEXT,
  appState: appState
});

function sendSignal(payload) {
  if (!appState.room.isWebSocketOpen() || !appState.room.getRoomId()) {
    return false;
  }
  const ws = appState.room.getWebSocket();
  ws.send(JSON.stringify(Object.assign({ room: appState.room.getRoomId(), from: appState.getMyId() }, payload)));
  return true;
}

const media = createMediaController({
  capabilities: capabilities,
  elements: elements,
  appState: appState,
  ui: ui
});

const stats = createStatsController(appState);

const chat = createChatController({
  appState: appState,
  ui: ui
});

const peers = createPeerController({
  chat: chat,
  media: media,
  rtcConfig: rtcConfig,
  sendSignal: sendSignal,
  appState: appState,
  ui: ui
});

const signaling = createSignalingController({
  capabilities: capabilities,
  media: media,
  peerController: peers,
  reconnectDelaysMs: RECONNECT_DELAYS_MS,
  appState: appState,
  statsController: stats,
  ui: ui
});

function bindEvents() {
  if (elements.joinBtn) {
    elements.joinBtn.addEventListener('click', function () {
      if (!appState.room.isIdle()) {
        signaling.leaveRoom();
        return;
      }
      const roomId = elements.roomInput ? elements.roomInput.value.trim() : '';
      if (!roomId) {
        ui.setError('请输入房间名');
        return;
      }
      appState.room.setRoomId(roomId);
      signaling.connectWS();
    });
  }

  if (elements.callBtn) {
    elements.callBtn.addEventListener('click', function () {
      peers.startCall(ui.selectedPeerId());
    });
  }

  if (elements.hangupBtn) {
    elements.hangupBtn.addEventListener('click', function () {
      const target = ui.selectedPeerId();
      if (target && appState.peers.has(target)) {
        peers.closePeer(target, { notify: true });
        return;
      }
      peers.closeAllPeers(true);
    });
  }

  if (elements.muteBtn) {
    elements.muteBtn.addEventListener('click', function () {
      const localStream = appState.media.getLocalStream();
      if (!localStream) {
        return;
      }
      const muted = appState.media.toggleMuted();
      localStream.getAudioTracks().forEach(function (track) {
        track.enabled = !muted;
      });
    });
  }

  if (elements.cameraBtn) {
    elements.cameraBtn.addEventListener('click', function () {
      const localStream = appState.media.getLocalStream();
      if (!localStream) {
        return;
      }
      const cameraOff = appState.media.toggleCameraOff();
      localStream.getVideoTracks().forEach(function (track) {
        track.enabled = !cameraOff;
      });
    });
  }

  if (elements.screenBtn) {
    elements.screenBtn.addEventListener('click', function () {
      if (appState.media.isUsingScreen()) {
        media.stopScreenShare();
        return;
      }
      media.startScreenShare();
    });
  }

  if (elements.chatSend) {
    elements.chatSend.addEventListener('click', chat.sendChat);
  }
  if (elements.chatInput) {
    elements.chatInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        chat.sendChat();
      }
    });
  }
  if (elements.recStart) {
    elements.recStart.addEventListener('click', media.startRecording);
  }
  if (elements.recStop) {
    elements.recStop.addEventListener('click', media.stopRecording);
  }

  window.addEventListener('beforeunload', function () {
    signaling.leaveRoom();
  });
}

bindEvents();
ui.initCapabilityHints();
stats.start(ui.getStatsEl.bind(ui));
ui.renderMembers([]);
