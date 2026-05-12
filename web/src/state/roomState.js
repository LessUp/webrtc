/**
 * 房间状态模块
 * 管理房间连接的状态机，封装重连逻辑。
 */

/**
 * 房间状态枚举
 * @readonly
 * @enum {string}
 */
export const RoomStatus = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  JOINED: 'joined',
  RECONNECTING: 'reconnecting'
};

/**
 * 创建房间状态管理器
 * @param {Object} options - 配置选项
 * @param {string} options.myId - 客户端 ID
 * @returns {Object} 房间状态接口
 */
export function createRoomState(options) {
  const myId = options.myId;

  // 私有状态
  let _roomId = null;
  let _status = RoomStatus.IDLE;
  let _ws = null;
  let _manualClose = false;
  let _retryJoinAfterClose = false;
  let _reconnectTimer = null;
  let _reconnectAttempts = 0;
  let _lastMembers = [];

  // 订阅机制
  const _subscribers = new Set();
  let _notifying = false;

  function subscribe(fn) {
    _subscribers.add(fn);
    return function () { _subscribers.delete(fn); };
  }

  function notify() {
    if (_notifying) return;
    _notifying = true;
    try { _subscribers.forEach(function (fn) { fn(); }); }
    finally { _notifying = false; }
  }

  /**
   * 获取当前状态快照
   * @returns {Object} 状态快照
   */
  function getSnapshot() {
    return {
      myId: myId,
      roomId: _roomId,
      status: _status,
      ws: _ws,
      manualClose: _manualClose,
      retryJoinAfterClose: _retryJoinAfterClose,
      reconnectTimer: _reconnectTimer,
      reconnectAttempts: _reconnectAttempts,
      lastMembers: _lastMembers.slice()
    };
  }

  // === 房间 ID ===

  function getRoomId() {
    return _roomId;
  }

  function setRoomId(id) {
    _roomId = id;
    notify();
  }

  // === 状态 ===

  function getStatus() {
    return _status;
  }

  function setStatus(status) {
    _status = status;
    notify();
  }

  function isIdle() {
    return _status === RoomStatus.IDLE;
  }

  function isConnected() {
    return _status === RoomStatus.JOINED;
  }

  function isConnecting() {
    return _status === RoomStatus.CONNECTING || _status === RoomStatus.RECONNECTING;
  }

  // === WebSocket ===

  function getWebSocket() {
    return _ws;
  }

  function setWebSocket(ws) {
    _ws = ws;
    notify();
  }

  function isWebSocketOpen() {
    return _ws && _ws.readyState === WebSocket.OPEN;
  }

  function isWebSocketConnecting() {
    return _ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING);
  }

  // === 重连状态 ===

  function getManualClose() {
    return _manualClose;
  }

  function setManualClose(value) {
    _manualClose = value;
    notify();
  }

  function getRetryJoinAfterClose() {
    return _retryJoinAfterClose;
  }

  function setRetryJoinAfterClose(value) {
    _retryJoinAfterClose = value;
    notify();
  }

  function getReconnectTimer() {
    return _reconnectTimer;
  }

  function setReconnectTimer(timer) {
    _reconnectTimer = timer;
    notify();
  }

  function clearReconnectTimer() {
    if (_reconnectTimer) {
      window.clearTimeout(_reconnectTimer);
      _reconnectTimer = null;
      notify();
    }
  }

  function getReconnectAttempts() {
    return _reconnectAttempts;
  }

  function incrementReconnectAttempts() {
    _reconnectAttempts += 1;
    notify();
  }

  function resetReconnectAttempts() {
    _reconnectAttempts = 0;
    notify();
  }

  // === 成员列表 ===

  function getLastMembers() {
    return _lastMembers.slice();
  }

  function setLastMembers(members) {
    _lastMembers = Array.isArray(members) ? members.slice() : [];
    notify();
  }

  // === 重置 ===

  function reset() {
    clearReconnectTimer();
    _ws = null;
    _roomId = null;
    _status = RoomStatus.IDLE;
    _manualClose = false;
    _retryJoinAfterClose = false;
    _reconnectAttempts = 0;
    _lastMembers = [];
    notify();
  }

  return {
    // 订阅
    subscribe: subscribe,

    // 快照
    getSnapshot: getSnapshot,

    // 房间 ID
    getRoomId: getRoomId,
    setRoomId: setRoomId,

    // 状态
    getStatus: getStatus,
    setStatus: setStatus,
    isIdle: isIdle,
    isConnected: isConnected,
    isConnecting: isConnecting,

    // WebSocket
    getWebSocket: getWebSocket,
    setWebSocket: setWebSocket,
    isWebSocketOpen: isWebSocketOpen,
    isWebSocketConnecting: isWebSocketConnecting,

    // 重连状态
    getManualClose: getManualClose,
    setManualClose: setManualClose,
    getRetryJoinAfterClose: getRetryJoinAfterClose,
    setRetryJoinAfterClose: setRetryJoinAfterClose,
    getReconnectTimer: getReconnectTimer,
    setReconnectTimer: setReconnectTimer,
    clearReconnectTimer: clearReconnectTimer,
    getReconnectAttempts: getReconnectAttempts,
    incrementReconnectAttempts: incrementReconnectAttempts,
    resetReconnectAttempts: resetReconnectAttempts,

    // 成员列表
    getLastMembers: getLastMembers,
    setLastMembers: setLastMembers,

    // 重置
    reset: reset,

    // 常量
    myId: myId
  };
}
