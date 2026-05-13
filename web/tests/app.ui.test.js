import { describe, it, expect, beforeEach } from 'vitest';
import { createUI, getElements } from "../src/controllers/ui.js";
import { createAppState, RoomStatus } from "../src/state/index.js";

function createMockAppState(overrides) {
  const appState = createAppState({ myId: overrides && overrides.myId ? overrides.myId : 'testuser' });
  // 设置初始状态
  if (overrides) {
    if (overrides.roomState) appState.room.status = overrides.roomState;
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
  return {
    webSocket: true,
    rtc: true,
    media: true,
    screen: true,
    record: true
  };
}

const ROOM_STATE_TEXT = {
  idle: '未连接',
  connecting: '连接中',
  joined: '已加入',
  reconnecting: '重连中',
  calling: '通话中'
};

describe('app.ui', function () {
  beforeEach(function () {
    document.body.innerHTML = '';
  });

  describe('getElements', function () {
    it('returns null for missing elements', function () {
      document.body.innerHTML = '<div id="status"></div>';
      var el = getElements();
      expect(el.statusEl).not.toBeNull();
      expect(el.errorEl).toBeNull();
      expect(el.joinBtn).toBeNull();
    });

    it('finds all known element IDs', function () {
      document.body.innerHTML =
        '<div id="status"></div><div id="error"></div><div id="members"></div>' +
        '<input id="chatInput"><button id="chatSend"></button>' +
        '<input id="room"><input id="remote"><video id="local"></video>' +
        '<div id="videos"></div><button id="join"></button>' +
        '<button id="call"></button><button id="hangup"></button>' +
        '<button id="muteBtn"></button><button id="cameraBtn"></button>' +
        '<button id="screenBtn"></button><button id="recStart"></button>' +
        '<button id="recStop"></button><span id="myId"></span>';
      var el = getElements();
      expect(el.statusEl).not.toBeNull();
      expect(el.joinBtn).not.toBeNull();
      expect(el.hangupBtn).not.toBeNull();
    });
  });

  describe('createUI', function () {
    it('setError sets error text', function () {
      document.body.innerHTML = '<div id="error"></div>';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: ROOM_STATE_TEXT, appState: appState });
      ui.setError('test error');
      expect(elements.errorEl.textContent).toBe('test error');
    });

    it('setError clears error with empty string', function () {
      document.body.innerHTML = '<div id="error">old error</div>';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: ROOM_STATE_TEXT, appState: appState });
      ui.setError('');
      expect(elements.errorEl.textContent).toBe('');
    });

    it('setRoomState updates state and calls updateControls', function () {
      document.body.innerHTML = '<div id="status"></div><button id="join"></button>';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({
        capabilities: createMockCapabilities(),
        elements: elements,
        roomStateText: ROOM_STATE_TEXT,
        appState: appState
      });
      ui.setRoomState(RoomStatus.JOINED);
      expect(appState.room.status).toBe(RoomStatus.JOINED);
      expect(elements.statusEl.textContent).toContain('已加入');
      expect(elements.statusEl.querySelector('.status__dot--joined')).not.toBeNull();
    });

    it('updateControls disables hangup when no active peers', function () {
      document.body.innerHTML = '<button id="hangup"></button>';
      var appState = createMockAppState({ roomState: RoomStatus.JOINED });
      var elements = getElements();
      var ui = createUI({
        capabilities: createMockCapabilities(),
        elements: elements,
        roomStateText: ROOM_STATE_TEXT,
        appState: appState
      });
      ui.updateControls();
      expect(elements.hangupBtn.disabled).toBe(true);
    });

    it('updateControls enables hangup when peers exist', function () {
      document.body.innerHTML = '<button id="hangup"></button>';
      var appState = createMockAppState({ roomState: RoomStatus.JOINED, peers: new Map([['peer1', {}]]) });
      var elements = getElements();
      var ui = createUI({
        capabilities: createMockCapabilities(),
        elements: elements,
        roomStateText: ROOM_STATE_TEXT,
        appState: appState
      });
      ui.updateControls();
      expect(elements.hangupBtn.disabled).toBe(false);
    });

    it('renderMembers shows empty message when list is empty', function () {
      document.body.innerHTML = '<div id="members"></div>';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: ROOM_STATE_TEXT, appState: appState });
      ui.renderMembers([]);
      expect(elements.membersEl.textContent).toContain('暂无成员');
    });

    it('renderMembers renders member buttons', function () {
      document.body.innerHTML = '<div id="members"></div>';
      var appState = createMockAppState({ myId: 'me' });
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: ROOM_STATE_TEXT, appState: appState });
      ui.renderMembers(['me', 'other']);
      var pills = elements.membersEl.querySelectorAll('.member-pill');
      expect(pills.length).toBe(2);
      expect(pills[0].textContent).toContain('(你)');
      expect(pills[0].disabled).toBe(true);
      expect(pills[1].textContent).toBe('other');
      expect(pills[1].disabled).toBe(false);
    });

    it('selectedPeerId returns trimmed remote input value', function () {
      document.body.innerHTML = '<input id="remote" value="  peer1  ">';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: ROOM_STATE_TEXT, appState: appState });
      expect(ui.selectedPeerId()).toBe('peer1');
    });

    it('appendChat adds text to chat log', function () {
      document.body.innerHTML = '<div id="chatLog"></div>';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: ROOM_STATE_TEXT, appState: appState });
      ui.appendChat('hello');
      ui.appendChat('world');
      expect(elements.chatLog.children.length).toBe(2);
      expect(elements.chatLog.children[0].textContent).toBe('hello');
    });

    it('initCapabilityHints shows error when WebSocket not supported', function () {
      document.body.innerHTML = '<div id="error"></div>';
      var appState = createMockAppState();
      var elements = getElements();
      var ui = createUI({
        capabilities: { webSocket: false, rtc: false, media: true, screen: true, record: true },
        elements: elements,
        roomStateText: ROOM_STATE_TEXT,
        appState: appState
      });
      ui.initCapabilityHints();
      expect(elements.errorEl.textContent).toContain('不支持');
    });
  });
});
