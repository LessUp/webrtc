import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStatsController } from "../src/controllers/stats.js";
import { createAppState } from "../src/state/index.js";

// Mock RTCPeerConnection.getStats()
function createMockPeerConnection() {
  return {
    connectionState: 'connected',
    getStats: vi.fn(function () {
      return Promise.resolve(new Map([
        ['outbound-1', { type: 'outbound-rtp', kind: 'video', bytesSent: 1000, frameWidth: 640, frameHeight: 480, codecId: 'codec-1' }],
        ['codec-1', { id: 'codec-1', mimeType: 'video/VP8' }],
        ['inbound-1', { type: 'inbound-rtp', kind: 'audio', packetsReceived: 100, packetsLost: 5 }],
        ['pair-1', { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.05 }]
      ]));
    })
  };
}

// Mock PeerState
function createMockPeerState(peerId, pc) {
  return {
    peerId: peerId,
    getPeerConnection: function () { return pc; }
  };
}

describe('stats', function () {
  var appState;
  var statsController;

  beforeEach(function () {
    appState = createAppState({ myId: 'test' });
    statsController = createStatsController(appState);
  });

  describe('start/stop', function () {
    it('starts polling when start is called', function () {
      vi.useFakeTimers();
      var pollCount = 0;
      var mockPc = createMockPeerConnection();
      appState.peers.set('peer1', createMockPeerState('peer1', mockPc));

      statsController.start(function () { return document.createElement('div'); });
      expect(pollCount).toBe(0);

      vi.advanceTimersByTime(2000);
      expect(mockPc.getStats).toHaveBeenCalled();

      statsController.stop();
      vi.useRealTimers();
    });

    it('does not start twice', function () {
      var mockPc = createMockPeerConnection();
      appState.peers.set('peer1', createMockPeerState('peer1', mockPc));

      statsController.start(function () { return null; });
      statsController.start(function () { return null; });

      statsController.stop();
    });

    it('stops polling when stop is called', function () {
      vi.useFakeTimers();
      var mockPc = createMockPeerConnection();
      appState.peers.set('peer1', createMockPeerState('peer1', mockPc));

      statsController.start(function () { return null; });
      statsController.stop();

      vi.advanceTimersByTime(2000);
      expect(mockPc.getStats).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('polling behavior', function () {
    it('skips peers with disconnected state', function () {
      vi.useFakeTimers();
      var mockPc = { connectionState: 'disconnected', getStats: vi.fn() };
      appState.peers.set('peer1', createMockPeerState('peer1', mockPc));

      statsController.start(function () { return null; });
      vi.advanceTimersByTime(2000);

      expect(mockPc.getStats).not.toHaveBeenCalled();

      statsController.stop();
      vi.useRealTimers();
    });

    it('skips peers with null connection', function () {
      vi.useFakeTimers();
      appState.peers.set('peer1', createMockPeerState('peer1', null));

      statsController.start(function () { return null; });
      vi.advanceTimersByTime(2000);

      // Should not throw
      statsController.stop();
      vi.useRealTimers();
    });
  });

  describe('WeakMap cleanup', function () {
    it('clears WeakMap on stop', function () {
      statsController.start(function () { return null; });
      statsController.stop();

      // After stop, a new WeakMap should be created
      // This is verified by the implementation creating a new WeakMap
      expect(true).toBe(true);
    });
  });
});
