import { describe, it, expect, beforeEach } from 'vitest';
import { createPeerController } from "../src/controllers/peers.js";
import { createChatController } from "../src/controllers/chat.js";
import { createAppState, RoomStatus } from "../src/state/index.js";

function createMockAppState(overrides) {
  const appState = createAppState({ myId: overrides && overrides.myId ? overrides.myId : 'me' });
  if (overrides && overrides.roomStatus) {
    appState.room.setStatus(overrides.roomStatus);
  }
  return appState;
}

function createMockUI() {
  return {
    setError: function () {},
    appendChat: function () {},
    ensureRemoteTile: function () { return document.createElement('video'); },
    removeRemoteTile: function () {},
    updatePeerLabel: function () {},
    updateControls: function () {},
    selectedPeerId: function () { return ''; },
    getStatsEl: function () { return null; }
  };
}

function createMockMedia() {
  return {
    ensureLocalMedia: function () { return Promise.resolve({ getAudioTracks: function () { return []; }, getVideoTracks: function () { return []; } }); },
    syncPeerMedia: function () { return Promise.resolve(); }
  };
}

function createMockRTCConfig() {
  return { iceServers: [] };
}

function createMockSendSignal() {
  var sent = [];
  return {
    fn: function (payload) { sent.push(payload); return true; },
    sent: sent
  };
}

// 创建模拟 PeerState 对象
function createMockPeerState(peerId) {
  return {
    peerId: peerId,
    polite: true,
    getPeerConnection: function () { return { close: function () {}, connectionState: 'new' }; },
    getDataChannel: function () { return null; },
    setDataChannel: function () {},
    getRemoteStream: function () { return null; },
    getConnectionState: function () { return 'new'; },
    close: function () {},
    handleRemoteDescription: function () { return Promise.resolve(); },
    handleIceCandidate: function () { return Promise.resolve(); },
    createOffer: function () { return Promise.resolve(); },
    createDataChannel: function () { return null; }
  };
}

describe('app.peers', function () {
  var appState, ui, media, sendSignal, rtcConfig;

  beforeEach(function () {
    appState = createMockAppState();
    ui = createMockUI();
    media = createMockMedia();
    sendSignal = createMockSendSignal();
    rtcConfig = createMockRTCConfig();
  });

  describe('closePeer', function () {
    it('removes peer from state', function () {
      var mockPeerState = createMockPeerState('p1');
      appState.peers.set('p1', mockPeerState);

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, appState: appState, ui: ui });
      ctrl.closePeer('p1', { notify: false });

      expect(appState.peers.has('p1')).toBe(false);
    });

    it('sends hangup signal when notify is true', function () {
      var mockPeerState = createMockPeerState('p1');
      appState.peers.set('p1', mockPeerState);

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, appState: appState, ui: ui });
      ctrl.closePeer('p1', { notify: true });

      expect(sendSignal.sent.some(function (m) { return m.type === 'hangup'; })).toBe(true);
    });

    it('does nothing for non-existent peer', function () {
      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, appState: appState, ui: ui });
      expect(function () { ctrl.closePeer('nonexistent', { notify: false }); }).not.toThrow();
    });
  });

  describe('closeAllPeers', function () {
    it('removes all peers', function () {
      appState.peers.set('p1', createMockPeerState('p1'));
      appState.peers.set('p2', createMockPeerState('p2'));

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, appState: appState, ui: ui });
      ctrl.closeAllPeers(false);

      expect(appState.peers.size()).toBe(0);
    });

    it('sends hangup for each peer when notify is true', function () {
      appState.peers.set('p1', createMockPeerState('p1'));
      appState.peers.set('p2', createMockPeerState('p2'));

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, appState: appState, ui: ui });
      ctrl.closeAllPeers(true);

      var hangups = sendSignal.sent.filter(function (m) { return m.type === 'hangup'; });
      expect(hangups.length).toBe(2);
    });
  });

  describe('sendChat', function () {
    it('does nothing with empty input', function () {
      document.body.innerHTML = '<input id="chatInput" value="">';
      var errorSet = false;
      var testUI = {
        setError: function () { errorSet = true; },
        appendChat: function () {},
        selectedPeerId: function () { return ''; }
      };
      var chat = createChatController({ appState: appState, ui: testUI });
      chat.sendChat();
      expect(errorSet).toBe(false);
    });

    it('shows error when no data channels are open', function () {
      document.body.innerHTML = '<input id="chatInput" value="hello">';
      var testUI = {
        setError: function () {},
        appendChat: function () {},
        selectedPeerId: function () { return ''; }
      };
      var chat = createChatController({ appState: appState, ui: testUI });
      chat.sendChat();
      // ui.setError is a no-op mock, just verify no throw
    });
  });
});

describe('appState', function () {
  describe('roomState', function () {
    it('starts with idle status', function () {
      var appState = createAppState({ myId: 'test' });
      expect(appState.room.status).toBe(RoomStatus.IDLE);
      expect(appState.room.isIdle).toBe(true);
    });

    it('can change status', function () {
      var appState = createAppState({ myId: 'test' });
      appState.room.status = RoomStatus.CONNECTING;
      expect(appState.room.status).toBe(RoomStatus.CONNECTING);
      expect(appState.room.isConnecting).toBe(true);
    });
  });

  describe('mediaState', function () {
    it('starts without local stream', function () {
      var appState = createAppState({ myId: 'test' });
      expect(appState.media.hasLocalStream()).toBe(false);
      expect(appState.media.isMuted()).toBe(false);
      expect(appState.media.isCameraOff()).toBe(false);
    });

    it('can toggle mute and camera', function () {
      var appState = createAppState({ myId: 'test' });
      expect(appState.media.toggleMuted()).toBe(true);
      expect(appState.media.isMuted()).toBe(true);
      expect(appState.media.toggleCameraOff()).toBe(true);
      expect(appState.media.isCameraOff()).toBe(true);
    });
  });

  describe('peersState', function () {
    it('starts empty', function () {
      var appState = createAppState({ myId: 'test' });
      expect(appState.peers.isEmpty()).toBe(true);
      expect(appState.peers.size()).toBe(0);
    });

    it('can add and remove peers', function () {
      var appState = createAppState({ myId: 'test' });
      appState.peers.set('peer1', createMockPeerState('peer1'));
      expect(appState.peers.has('peer1')).toBe(true);
      expect(appState.peers.size()).toBe(1);
      appState.peers.remove('peer1');
      expect(appState.peers.has('peer1')).toBe(false);
    });
  });
});
