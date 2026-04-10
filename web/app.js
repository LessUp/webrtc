import {
  DEFAULT_RTC_CONFIG,
  RECONNECT_DELAYS_MS,
  ROOM_STATE_TEXT,
  createClientId,
  getCapabilities,
  getRtcConfig
} from './app.config.js';
import { createMediaController } from './app.media.js';
import { createPeerController } from './app.peers.js';
import { createSignalingController } from './app.signaling.js';
import { createStatsController } from './app.stats.js';
import { createUI, getElements } from './app.ui.js';

const elements = getElements();
const capabilities = getCapabilities();
const appConfig = window.__APP_CONFIG__ || {};
const rtcConfig = getRtcConfig(appConfig, DEFAULT_RTC_CONFIG);

const state = {
  myId: createClientId(),
  ws: null,
  manualClose: false,
  retryJoinAfterClose: false,
  reconnectTimer: null,
  reconnectAttempts: 0,
  roomId: null,
  roomState: 'idle',
  lastMembers: [],
  localStream: null,
  screenStream: null,
  usingScreen: false,
  muted: false,
  cameraOff: false,
  recorder: null,
  recordedChunks: [],
  peers: new Map()
};

if (elements.idEl) {
  elements.idEl.textContent = state.myId;
}

const ui = createUI({
  capabilities: capabilities,
  elements: elements,
  roomStateText: ROOM_STATE_TEXT,
  state: state
});

function sendSignal(payload) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN || !state.roomId) {
    return false;
  }
  state.ws.send(JSON.stringify(Object.assign({ room: state.roomId, from: state.myId }, payload)));
  return true;
}

const media = createMediaController({
  capabilities: capabilities,
  elements: elements,
  state: state,
  ui: ui
});

const peers = createPeerController({
  media: media,
  rtcConfig: rtcConfig,
  sendSignal: sendSignal,
  state: state,
  ui: ui
});

const signaling = createSignalingController({
  capabilities: capabilities,
  media: media,
  peerController: peers,
  reconnectDelaysMs: RECONNECT_DELAYS_MS,
  state: state,
  ui: ui
});

const stats = createStatsController(state);

function bindEvents() {
  if (elements.joinBtn) {
    elements.joinBtn.addEventListener('click', function () {
      if (state.roomState !== 'idle') {
        signaling.leaveRoom();
        return;
      }
      state.roomId = elements.roomInput ? elements.roomInput.value.trim() : '';
      if (!state.roomId) {
        ui.setError('请输入房间名');
        return;
      }
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
      if (target && state.peers.has(target)) {
        peers.closePeer(target, { notify: true });
        return;
      }
      peers.closeAllPeers(true);
    });
  }

  if (elements.muteBtn) {
    elements.muteBtn.addEventListener('click', function () {
      if (!state.localStream) {
        return;
      }
      state.muted = !state.muted;
      state.localStream.getAudioTracks().forEach(function (track) {
        track.enabled = !state.muted;
      });
      ui.updateControls();
    });
  }

  if (elements.cameraBtn) {
    elements.cameraBtn.addEventListener('click', function () {
      if (!state.localStream) {
        return;
      }
      state.cameraOff = !state.cameraOff;
      state.localStream.getVideoTracks().forEach(function (track) {
        track.enabled = !state.cameraOff;
      });
      ui.updateControls();
    });
  }

  if (elements.screenBtn) {
    elements.screenBtn.addEventListener('click', function () {
      if (state.usingScreen) {
        media.stopScreenShare();
        return;
      }
      media.startScreenShare();
    });
  }

  if (elements.chatSend) {
    elements.chatSend.addEventListener('click', peers.sendChat);
  }
  if (elements.chatInput) {
    elements.chatInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        peers.sendChat();
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
stats.start();
ui.initCapabilityHints();
ui.renderMembers([]);
ui.updateControls();
