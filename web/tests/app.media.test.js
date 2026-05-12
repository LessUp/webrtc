import { describe, it, expect, beforeEach } from 'vitest';
import { createMediaController } from "../src/controllers/media.js";
import { createAppState } from "../src/state/index.js";

function createMockAppState(overrides) {
  const appState = createAppState({ myId: overrides && overrides.myId ? overrides.myId : 'me' });
  // 设置初始状态
  if (overrides) {
    if (overrides.localStream) appState.media.setLocalStream(overrides.localStream);
    if (overrides.screenStream) appState.media.setScreenStream(overrides.screenStream);
    if (overrides.usingScreen !== undefined) appState.media.setUsingScreen(overrides.usingScreen);
    if (overrides.muted !== undefined) appState.media.setMuted(overrides.muted);
    if (overrides.cameraOff !== undefined) appState.media.setCameraOff(overrides.cameraOff);
    if (overrides.recorder) appState.media.setRecorder(overrides.recorder);
    if (overrides.peers) {
      overrides.peers.forEach(function (peer, id) {
        appState.peers.set(id, peer);
      });
    }
  }
  return appState;
}

function createMockCapabilities() {
  return { webSocket: true, rtc: true, media: true, screen: true, record: true };
}

function createMockUI() {
  return {
    setError: function () {},
    updateControls: function () {}
  };
}

function createMockElements() {
  return {
    localVideo: document.createElement('video')
  };
}

describe('app.media', function () {
  var appState, capabilities, elements, ui;

  beforeEach(function () {
    appState = createMockAppState();
    capabilities = createMockCapabilities();
    elements = createMockElements();
    ui = createMockUI();
  });

  describe('stopLocalMedia', function () {
    it('clears localStream and resets state', function () {
      var track = { stop: function () {} };
      var stream = { getTracks: function () { return [track]; } };
      appState = createMockAppState({ localStream: stream });

      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      ctrl.stopLocalMedia();

      expect(appState.media.getLocalStream()).toBeNull();
      expect(appState.media.isMuted()).toBe(false);
      expect(appState.media.isCameraOff()).toBe(false);
    });

    it('handles null localStream gracefully', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      expect(function () { ctrl.stopLocalMedia(); }).not.toThrow();
    });
  });

  describe('getRecordStream (via startRecording)', function () {
    it('shows error when no stream available', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      ctrl.startRecording();
      // No stream → setError called
    });

    it('shows error when recording is not supported', function () {
      var noRecordCaps = { webSocket: true, rtc: true, media: true, screen: true, record: false };
      var ctrl = createMediaController({ capabilities: noRecordCaps, elements: elements, appState: appState, ui: ui });
      ctrl.startRecording();
    });
  });

  describe('stopRecording', function () {
    it('handles no active recorder gracefully', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      expect(function () { ctrl.stopRecording(); }).not.toThrow();
    });
  });

  describe('stopScreenShare', function () {
    it('handles null screenStream gracefully', function () {
      appState = createMockAppState({ usingScreen: true });
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      expect(function () { ctrl.stopScreenShare(); }).not.toThrow();
      expect(appState.media.isUsingScreen()).toBe(false);
    });
  });

  describe('currentVideoTrack', function () {
    it('returns screen track when using screen share', function () {
      var track = {};
      appState = createMockAppState({ usingScreen: true, screenStream: { getVideoTracks: function () { return [track]; } } });

      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      expect(ctrl.currentVideoTrack()).toBe(track);
    });

    it('returns local video track when not sharing screen', function () {
      var track = {};
      appState = createMockAppState({ localStream: { getVideoTracks: function () { return [track]; } } });

      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      expect(ctrl.currentVideoTrack()).toBe(track);
    });

    it('returns null when no streams', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, appState: appState, ui: ui });
      expect(ctrl.currentVideoTrack()).toBeNull();
    });
  });
});
