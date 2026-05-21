/**
 * 房间状态模块
 * 管理房间连接的状态机，封装重连逻辑。
 */

import { createObservable } from './observable.js';

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
  const observable = createObservable();

  // 私有状态
  let _roomId = null;
  let _status = RoomStatus.IDLE;
  let _ws = null;
  let _manualClose = false;
  let _retryJoinAfterClose = false;
  let _reconnectTimer = null;
  let _reconnectAttempts = 0;
  let _lastMembers = [];

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

  /**
   * 重置所有状态
   */
  function reset() {
    clearReconnectTimer();
    _ws = null;
    _roomId = null;
    _status = RoomStatus.IDLE;
    _manualClose = false;
    _retryJoinAfterClose = false;
    _reconnectAttempts = 0;
    _lastMembers = [];
    observable.notify();
  }

  /**
   * 清除重连定时器
   * @param {Function} [clearFn] - 可选的清除函数，默认使用 window.clearTimeout
   */
  function clearReconnectTimer(clearFn) {
    if (_reconnectTimer) {
      const clear = clearFn || window.clearTimeout.bind(window);
      clear(_reconnectTimer);
      _reconnectTimer = null;
      observable.notify();
    }
  }

  /**
   * 增加重连尝试次数
   */
  function incrementReconnectAttempts() {
    _reconnectAttempts += 1;
    observable.notify();
  }

  /**
   * 重置重连尝试次数
   */
  function resetReconnectAttempts() {
    _reconnectAttempts = 0;
    observable.notify();
  }

  // 状态对象
  const state = {
    // 常量
    myId: myId,

    // 方法
    subscribe: observable.subscribe,
    getSnapshot: getSnapshot,
    reset: reset,
    clearReconnectTimer: clearReconnectTimer,
    incrementReconnectAttempts: incrementReconnectAttempts,
    resetReconnectAttempts: resetReconnectAttempts
  };

  // 计算属性：房间 ID
  Object.defineProperty(state, 'roomId', {
    get: function () { return _roomId; },
    set: function (value) { _roomId = value; observable.notify(); },
    enumerable: true
  });

  // 计算属性：状态
  Object.defineProperty(state, 'status', {
    get: function () { return _status; },
    set: function (value) { _status = value; observable.notify(); },
    enumerable: true
  });

  // 计算属性：状态判断
  Object.defineProperty(state, 'isIdle', {
    get: function () { return _status === RoomStatus.IDLE; },
    enumerable: true
  });

  Object.defineProperty(state, 'isConnected', {
    get: function () { return _status === RoomStatus.JOINED; },
    enumerable: true
  });

  Object.defineProperty(state, 'isConnecting', {
    get: function () {
      return _status === RoomStatus.CONNECTING || _status === RoomStatus.RECONNECTING;
    },
    enumerable: true
  });

  // 计算属性：WebSocket
  Object.defineProperty(state, 'ws', {
    get: function () { return _ws; },
    set: function (value) { _ws = value; observable.notify(); },
    enumerable: true
  });

  Object.defineProperty(state, 'isWebSocketOpen', {
    get: function () { return _ws && _ws.readyState === WebSocket.OPEN; },
    enumerable: true
  });

  Object.defineProperty(state, 'isWebSocketConnecting', {
    get: function () {
      return _ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING);
    },
    enumerable: true
  });

  // 计算属性：重连状态
  Object.defineProperty(state, 'manualClose', {
    get: function () { return _manualClose; },
    set: function (value) { _manualClose = value; observable.notify(); },
    enumerable: true
  });

  Object.defineProperty(state, 'retryJoinAfterClose', {
    get: function () { return _retryJoinAfterClose; },
    set: function (value) { _retryJoinAfterClose = value; observable.notify(); },
    enumerable: true
  });

  Object.defineProperty(state, 'reconnectTimer', {
    get: function () { return _reconnectTimer; },
    set: function (value) { _reconnectTimer = value; observable.notify(); },
    enumerable: true
  });

  Object.defineProperty(state, 'reconnectAttempts', {
    get: function () { return _reconnectAttempts; },
    enumerable: true
  });

  // 计算属性：成员列表
  Object.defineProperty(state, 'lastMembers', {
    get: function () { return _lastMembers.slice(); },
    set: function (value) { _lastMembers = Array.isArray(value) ? value.slice() : []; observable.notify(); },
    enumerable: true
  });

  return state;
}
