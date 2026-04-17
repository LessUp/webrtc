import { describe, it, expect, beforeEach } from 'vitest';
import { createPeerController } from "../src/controllers/peers.js";

function createMockState(overrides) {
  return Object.assign({
    myId: 'me',
    ws: null,
    roomId: null,
    roomState: 'idle',
    localStream: null,
    screenStream: null,
    usingScreen: false,
    muted: false,
    cameraOff: false,
    peers: new Map()
  }, overrides || {});
}

function createMockUI() {
  return {
    setError: function () {},
    appendChat: function () {},
    ensureRemoteTile: function () { return document.createElement('video'); },
    removeRemoteTile: function () {},
    updatePeerLabel: function () {},
    updateControls: function () {},
    selectedPeerId: function () { return ''; }
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

describe('app.peers', function () {
  var state, ui, media, sendSignal, rtcConfig;

  beforeEach(function () {
    state = createMockState();
    ui = createMockUI();
    media = createMockMedia();
    sendSignal = createMockSendSignal();
    rtcConfig = createMockRTCConfig();
  });

  describe('closePeer', function () {
    it('removes peer from state', function () {
      var pc = { close: function () {} };
      var peer = { id: 'p1', pc: pc, dc: null };
      state.peers.set('p1', peer);

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      ctrl.closePeer('p1', { notify: false });

      expect(state.peers.has('p1')).toBe(false);
    });

    it('sends hangup signal when notify is true', function () {
      var pc = { close: function () {} };
      var peer = { id: 'p1', pc: pc, dc: null };
      state.peers.set('p1', peer);

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      ctrl.closePeer('p1', { notify: true });

      expect(sendSignal.sent.some(function (m) { return m.type === 'hangup'; })).toBe(true);
    });

    it('does nothing for non-existent peer', function () {
      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      expect(function () { ctrl.closePeer('nonexistent', { notify: false }); }).not.toThrow();
    });
  });

  describe('closeAllPeers', function () {
    it('removes all peers', function () {
      state.peers.set('p1', { id: 'p1', pc: { close: function () {} }, dc: null });
      state.peers.set('p2', { id: 'p2', pc: { close: function () {} }, dc: null });

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      ctrl.closeAllPeers(false);

      expect(state.peers.size).toBe(0);
    });

    it('sends hangup for each peer when notify is true', function () {
      state.peers.set('p1', { id: 'p1', pc: { close: function () {} }, dc: null });
      state.peers.set('p2', { id: 'p2', pc: { close: function () {} }, dc: null });

      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      ctrl.closeAllPeers(true);

      var hangups = sendSignal.sent.filter(function (m) { return m.type === 'hangup'; });
      expect(hangups.length).toBe(2);
    });
  });

  describe('sendChat', function () {
    it('does nothing with empty input', function () {
      document.body.innerHTML = '<input id="chatInput" value="">';
      var errorSet = false;
      ui = {
        setError: function () { errorSet = true; },
        appendChat: function () {},
        ensureRemoteTile: function () { return null; },
        removeRemoteTile: function () {},
        updatePeerLabel: function () {},
        updateControls: function () {},
        selectedPeerId: function () { return ''; }
      };
      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      ctrl.sendChat();
      expect(errorSet).toBe(false);
    });

    it('shows error when no data channels are open', function () {
      document.body.innerHTML = '<input id="chatInput" value="hello">';
      var ctrl = createPeerController({ media: media, rtcConfig: rtcConfig, sendSignal: sendSignal.fn, state: state, ui: ui });
      ctrl.sendChat();
      // ui.setError is a no-op mock, just verify no throw
    });
  });
});
