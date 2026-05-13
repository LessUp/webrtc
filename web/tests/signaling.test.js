/**
 * signaling.js 单元测试
 *
 * 使用 mock WebSocket 测试信令控制器的核心逻辑。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignalingController } from '../src/controllers/signaling.js';
import { createMockWebSocket } from './mocks/mockWebSocket.js';
import { createAppState, RoomStatus } from '../src/state/index.js';
import { ClientMessageType, ServerMessageType, ErrorCode } from '../src/protocol/message.js';

function createMockAppState() {
  return createAppState({ myId: 'test-client' });
}

function createMockUI() {
  return {
    setError: vi.fn(),
    renderMembers: vi.fn()
  };
}

function createMockMedia() {
  return {
    stopRecording: vi.fn(),
    stopScreenShare: vi.fn(),
    stopLocalMedia: vi.fn()
  };
}

function createMockPeerController() {
  return {
    closeAllPeers: vi.fn(),
    closePeer: vi.fn()
  };
}

function createMockBrowserApi(mockWs) {
  return {
    createWebSocket: vi.fn(() => mockWs),
    setTimeout: vi.fn(window.setTimeout),
    clearTimeout: vi.fn(window.clearTimeout),
    getLocation: vi.fn(() => ({ protocol: 'http:', host: 'localhost:8080' }))
  };
}

describe('createSignalingController', () => {
  let appState, ui, media, peerController, mockWs, browserApi;

  beforeEach(() => {
    appState = createMockAppState();
    ui = createMockUI();
    media = createMockMedia();
    peerController = createMockPeerController();
    mockWs = createMockWebSocket('ws://localhost:8080/ws');
    browserApi = createMockBrowserApi(mockWs);
  });

  describe('connectWS', () => {
    it('should create WebSocket with correct URL', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      expect(browserApi.createWebSocket).toHaveBeenCalledWith('ws://localhost:8080/ws');
    });

    it('should set status to CONNECTING', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      expect(appState.room.status).toBe(RoomStatus.CONNECTING);
    });

    it('should send JOIN message on open', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      mockWs.simulateOpen();

      const sent = mockWs.getSentMessages();
      expect(sent).toHaveLength(1);
      const msg = JSON.parse(sent[0]);
      expect(msg.type).toBe(ClientMessageType.JOIN);
      expect(msg.room).toBe('test-room');
      expect(msg.from).toBe('test-client');
    });

    it('should set status to JOINED on joined message', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: ServerMessageType.JOINED,
        room: 'test-room',
        from: 'test-client'
      });

      expect(appState.room.status).toBe(RoomStatus.JOINED);
      expect(ui.setError).toHaveBeenCalledWith('');
    });

    it('should render members on room_members message', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: ServerMessageType.ROOM_MEMBERS,
        room: 'test-room',
        members: ['test-client', 'other-user']
      });

      expect(ui.renderMembers).toHaveBeenCalledWith(['test-client', 'other-user']);
    });

    it('should handle ERROR message with DUPLICATE_ID', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: ServerMessageType.ERROR,
        code: ErrorCode.DUPLICATE_ID,
        error: 'Client ID already exists'
      });

      expect(appState.room.retryJoinAfterClose).toBe(true);
    });

    it('should not connect if WebSocket not supported', () => {
      appState.room.roomId = 'test-room';

      createSignalingController({
        capabilities: { webSocket: false, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      }).connectWS();

      expect(browserApi.createWebSocket).not.toHaveBeenCalled();
      expect(ui.setError).toHaveBeenCalledWith('当前浏览器不支持 WebRTC 或 WebSocket');
    });
  });

  describe('leaveRoom', () => {
    it('should send LEAVE message and close connection', () => {
      appState.room.roomId = 'test-room';

      const signaling = createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      });

      signaling.connectWS();
      mockWs.simulateOpen();
      mockWs.clearSentMessages();

      signaling.leaveRoom();

      const sent = mockWs.getSentMessages();
      expect(sent).toHaveLength(1);
      const msg = JSON.parse(sent[0]);
      expect(msg.type).toBe(ClientMessageType.LEAVE);
    });

    it('should reset status to IDLE', () => {
      appState.room.roomId = 'test-room';

      const signaling = createSignalingController({
        capabilities: { webSocket: true, rtc: true },
        media,
        peerController,
        reconnectDelaysMs: [1000, 2000],
        appState,
        ui,
        browserApi
      });

      signaling.connectWS();
      mockWs.simulateOpen();

      signaling.leaveRoom();

      expect(appState.room.status).toBe(RoomStatus.IDLE);
    });
  });
});
