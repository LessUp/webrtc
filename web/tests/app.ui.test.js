import { describe, it, expect, beforeEach } from 'vitest';
import { createUI, getElements } from "../src/controllers/ui.js";

function createMockState(overrides) {
  return Object.assign({
    myId: 'testuser',
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
  }, overrides || {});
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
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: {}, state: state });
      ui.setError('test error');
      expect(elements.errorEl.textContent).toBe('test error');
    });

    it('setError clears error with empty string', function () {
      document.body.innerHTML = '<div id="error">old error</div>';
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: {}, state: state });
      ui.setError('');
      expect(elements.errorEl.textContent).toBe('');
    });

    it('setRoomState updates state and calls updateControls', function () {
      document.body.innerHTML = '<div id="status"></div><button id="join"></button>';
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({
        capabilities: createMockCapabilities(),
        elements: elements,
        roomStateText: { idle: '未连接', joined: '已加入' },
        state: state
      });
      ui.setRoomState('joined');
      expect(state.roomState).toBe('joined');
      expect(elements.statusEl.textContent).toContain('已加入');
      expect(elements.statusEl.querySelector('.status__dot--joined')).not.toBeNull();
    });

    it('updateControls disables hangup when no active peers', function () {
      document.body.innerHTML = '<button id="hangup"></button>';
      var state = createMockState({ roomState: 'joined' });
      var elements = getElements();
      var ui = createUI({
        capabilities: createMockCapabilities(),
        elements: elements,
        roomStateText: { joined: '已加入' },
        state: state
      });
      ui.updateControls();
      expect(elements.hangupBtn.disabled).toBe(true);
    });

    it('updateControls enables hangup when peers exist', function () {
      document.body.innerHTML = '<button id="hangup"></button>';
      var state = createMockState({ roomState: 'joined', peers: new Map([['peer1', {}]]) });
      var elements = getElements();
      var ui = createUI({
        capabilities: createMockCapabilities(),
        elements: elements,
        roomStateText: { joined: '已加入' },
        state: state
      });
      ui.updateControls();
      expect(elements.hangupBtn.disabled).toBe(false);
    });

    it('renderMembers shows empty message when list is empty', function () {
      document.body.innerHTML = '<div id="members"></div>';
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: {}, state: state });
      ui.renderMembers([]);
      expect(elements.membersEl.textContent).toContain('暂无成员');
    });

    it('renderMembers renders member buttons', function () {
      document.body.innerHTML = '<div id="members"></div>';
      var state = createMockState({ myId: 'me' });
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: {}, state: state });
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
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: {}, state: state });
      expect(ui.selectedPeerId()).toBe('peer1');
    });

    it('appendChat adds text to chat log', function () {
      document.body.innerHTML = '<div id="chatLog"></div>';
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({ capabilities: createMockCapabilities(), elements: elements, roomStateText: {}, state: state });
      ui.appendChat('hello');
      ui.appendChat('world');
      expect(elements.chatLog.children.length).toBe(2);
      expect(elements.chatLog.children[0].textContent).toBe('hello');
    });

    it('initCapabilityHints shows error when WebSocket not supported', function () {
      document.body.innerHTML = '<div id="error"></div>';
      var state = createMockState();
      var elements = getElements();
      var ui = createUI({
        capabilities: { webSocket: false, rtc: false, media: true, screen: true, record: true },
        elements: elements,
        roomStateText: {},
        state: state
      });
      ui.initCapabilityHints();
      expect(elements.errorEl.textContent).toContain('不支持');
    });
  });
});
