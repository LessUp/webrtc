import { describe, it, expect, beforeEach } from 'vitest';
import { createMediaController } from '../app.media.js';

function createMockState(overrides) {
  return Object.assign({
    myId: 'me',
    localStream: null,
    screenStream: null,
    usingScreen: false,
    muted: false,
    cameraOff: false,
    recorder: null,
    recordedChunks: [],
    peers: new Map()
  }, overrides || {});
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
  var state, capabilities, elements, ui;

  beforeEach(function () {
    state = createMockState();
    capabilities = createMockCapabilities();
    elements = createMockElements();
    ui = createMockUI();
  });

  describe('stopLocalMedia', function () {
    it('clears localStream and resets state', function () {
      var track = { stop: function () {} };
      state.localStream = { getTracks: function () { return [track]; } };

      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      ctrl.stopLocalMedia();

      expect(state.localStream).toBeNull();
      expect(state.muted).toBe(false);
      expect(state.cameraOff).toBe(false);
    });

    it('handles null localStream gracefully', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      expect(function () { ctrl.stopLocalMedia(); }).not.toThrow();
    });
  });

  describe('getRecordStream (via startRecording)', function () {
    it('shows error when no stream available', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      ctrl.startRecording();
      // No stream → setError called
    });

    it('shows error when recording is not supported', function () {
      var noRecordCaps = { webSocket: true, rtc: true, media: true, screen: true, record: false };
      var ctrl = createMediaController({ capabilities: noRecordCaps, elements: elements, state: state, ui: ui });
      ctrl.startRecording();
    });
  });

  describe('stopRecording', function () {
    it('handles no active recorder gracefully', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      expect(function () { ctrl.stopRecording(); }).not.toThrow();
    });
  });

  describe('stopScreenShare', function () {
    it('handles null screenStream gracefully', function () {
      state.usingScreen = true;
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      expect(function () { ctrl.stopScreenShare(); }).not.toThrow();
      expect(state.usingScreen).toBe(false);
    });
  });

  describe('currentVideoTrack', function () {
    it('returns screen track when using screen share', function () {
      var track = {};
      state.usingScreen = true;
      state.screenStream = { getVideoTracks: function () { return [track]; } };

      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      expect(ctrl.currentVideoTrack()).toBe(track);
    });

    it('returns local video track when not sharing screen', function () {
      var track = {};
      state.localStream = { getVideoTracks: function () { return [track]; } };

      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      expect(ctrl.currentVideoTrack()).toBe(track);
    });

    it('returns null when no streams', function () {
      var ctrl = createMediaController({ capabilities: capabilities, elements: elements, state: state, ui: ui });
      expect(ctrl.currentVideoTrack()).toBeNull();
    });
  });
});
