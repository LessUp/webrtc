/**
 * Mock WebSocket 实现
 *
 * 用于测试 signaling 控制器，模拟 WebSocket 状态机。
 */

export var WebSocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

/**
 * 创建 Mock WebSocket 实例
 * @param {string} url - WebSocket URL
 * @returns {Object} Mock WebSocket 对象
 */
export function createMockWebSocket(url) {
  var _state = WebSocketState.CONNECTING;
  var _sent = [];
  var _handlers = {
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null
  };

  var mock = {
    url: url,
    readyState: _state,

    // 事件处理器
    get onopen() { return _handlers.onopen; },
    set onopen(fn) { _handlers.onopen = fn; },
    get onmessage() { return _handlers.onmessage; },
    set onmessage(fn) { _handlers.onmessage = fn; },
    get onerror() { return _handlers.onerror; },
    set onerror(fn) { _handlers.onerror = fn; },
    get onclose() { return _handlers.onclose; },
    set onclose(fn) { _handlers.onclose = fn; },

    // 发送消息
    send: function (data) {
      if (_state !== WebSocketState.OPEN) {
        throw new Error('WebSocket is not open');
      }
      _sent.push(data);
    },

    // 关闭连接
    close: function () {
      _state = WebSocketState.CLOSED;
      mock.readyState = _state;
    },

    // === 测试辅助方法 ===

    /**
     * 获取已发送的消息
     * @returns {string[]} 消息数组
     */
    getSentMessages: function () {
      return _sent.slice();
    },

    /**
     * 清空已发送消息
     */
    clearSentMessages: function () {
      _sent = [];
    },

    /**
     * 模拟连接打开
     */
    simulateOpen: function () {
      _state = WebSocketState.OPEN;
      mock.readyState = _state;
      if (_handlers.onopen) {
        _handlers.onopen();
      }
    },

    /**
     * 模拟接收消息
     * @param {Object|string} data - 消息数据
     */
    simulateMessage: function (data) {
      if (_handlers.onmessage) {
        var eventData = typeof data === 'string' ? data : JSON.stringify(data);
        _handlers.onmessage({ data: eventData });
      }
    },

    /**
     * 模拟错误
     * @param {Error} error - 错误对象
     */
    simulateError: function (error) {
      if (_handlers.onerror) {
        _handlers.onerror({ error: error });
      }
    },

    /**
     * 模拟连接关闭
     * @param {number} code - 关闭码
     * @param {string} reason - 关闭原因
     */
    simulateClose: function (code, reason) {
      _state = WebSocketState.CLOSED;
      mock.readyState = _state;
      if (_handlers.onclose) {
        _handlers.onclose({ code: code || 1000, reason: reason || '' });
      }
    }
  };

  return mock;
}
