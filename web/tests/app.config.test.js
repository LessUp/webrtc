import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_RTC_CONFIG,
  RECONNECT_DELAYS_MS,
  ROOM_STATE_TEXT,
  createClientId,
  getCapabilities,
  getRtcConfig
} from '../app.config.js';

describe('app.config', function () {
  describe('DEFAULT_RTC_CONFIG', function () {
    it('has a stun server configured', function () {
      expect(DEFAULT_RTC_CONFIG.iceServers).toHaveLength(1);
      var urls = DEFAULT_RTC_CONFIG.iceServers[0].urls;
      var str = Array.isArray(urls) ? urls[0] : urls;
      expect(str).toContain('stun:');
    });
  });

  describe('RECONNECT_DELAYS_MS', function () {
    it('has exponential backoff delays', function () {
      expect(RECONNECT_DELAYS_MS).toEqual([1000, 2000, 4000, 8000]);
    });
  });

  describe('ROOM_STATE_TEXT', function () {
    it('has text for all states', function () {
      expect(ROOM_STATE_TEXT.idle).toBeDefined();
      expect(ROOM_STATE_TEXT.connecting).toBeDefined();
      expect(ROOM_STATE_TEXT.joined).toBeDefined();
      expect(ROOM_STATE_TEXT.calling).toBeDefined();
      expect(ROOM_STATE_TEXT.reconnecting).toBeDefined();
    });
  });

  describe('createClientId', function () {
    it('returns a 12-char hex string by default', function () {
      var id = createClientId();
      expect(id).toHaveLength(12);
      expect(id).toMatch(/^[0-9a-f]{12}$/);
    });

    it('returns unique ids', function () {
      var ids = new Set();
      for (var i = 0; i < 50; i++) {
        ids.add(createClientId());
      }
      expect(ids.size).toBeGreaterThan(40);
    });

    it('falls back to Math.random when crypto is unavailable', function () {
      var origCrypto = window.crypto;
      delete window.crypto;
      try {
        var id = createClientId();
        expect(id).toHaveLength(12);
        expect(id).toMatch(/^[0-9a-f]{12}$/);
      } finally {
        window.crypto = origCrypto;
      }
    });
  });

  describe('getCapabilities', function () {
    it('returns an object with capability booleans', function () {
      var caps = getCapabilities();
      expect(caps).toHaveProperty('webSocket');
      expect(caps).toHaveProperty('rtc');
      expect(caps).toHaveProperty('media');
      expect(caps).toHaveProperty('screen');
      expect(caps).toHaveProperty('record');
      expect(typeof caps.webSocket).toBe('boolean');
    });
  });

  describe('getRtcConfig', function () {
    it('returns app config when rtcConfig has iceServers', function () {
      var appConfig = { rtcConfig: { iceServers: [{ urls: 'turn:example.com:3478' }] } };
      var result = getRtcConfig(appConfig, DEFAULT_RTC_CONFIG);
      expect(result.iceServers[0].urls).toContain('turn:');
    });

    it('returns fallback when app config has no rtcConfig', function () {
      var result = getRtcConfig({}, DEFAULT_RTC_CONFIG);
      var urls = result.iceServers[0].urls;
      var str = Array.isArray(urls) ? urls[0] : urls;
      expect(str).toContain('stun:');
    });

    it('returns fallback when rtcConfig.iceServers is not an array', function () {
      var result = getRtcConfig({ rtcConfig: {} }, DEFAULT_RTC_CONFIG);
      var urls = result.iceServers[0].urls;
      var str = Array.isArray(urls) ? urls[0] : urls;
      expect(str).toContain('stun:');
    });

    it('returns fallback when appConfig is null', function () {
      var result = getRtcConfig(null, DEFAULT_RTC_CONFIG);
      var urls = result.iceServers[0].urls;
      var str = Array.isArray(urls) ? urls[0] : urls;
      expect(str).toContain('stun:');
    });
  });
});
