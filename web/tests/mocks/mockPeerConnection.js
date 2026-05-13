/**
 * Mock RTCPeerConnection 实现
 *
 * 用于测试 peerState 模块，模拟 WebRTC 连接状态机。
 */

export var ConnectionState = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed',
  FAILED: 'failed'
};

export var SignalingState = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  HAVE_LOCAL_PRANSWER: 'have-local-pranswer',
  HAVE_REMOTE_PRANSWER: 'have-remote-pranswer',
  CLOSED: 'closed'
};

/**
 * 创建 Mock RTCPeerConnection 实例
 * @param {RTCConfiguration} config - WebRTC 配置
 * @returns {Object} Mock RTCPeerConnection 对象
 */
export function createMockPeerConnection(config) {
  var _connectionState = ConnectionState.NEW;
  var _signalingState = SignalingState.STABLE;
  var _localDescription = null;
  var _remoteDescription = null;
  var _handlers = {
    onicecandidate: null,
    ontrack: null,
    ondatachannel: null,
    onconnectionstatechange: null
  };
  var _dataChannels = [];

  var mock = {
    // 状态
    get connectionState() { return _connectionState; },
    get signalingState() { return _signalingState; },
    get localDescription() { return _localDescription; },
    get remoteDescription() { return _remoteDescription; },

    // 事件处理器
    get onicecandidate() { return _handlers.onicecandidate; },
    set onicecandidate(fn) { _handlers.onicecandidate = fn; },
    get ontrack() { return _handlers.ontrack; },
    set ontrack(fn) { _handlers.ontrack = fn; },
    get ondatachannel() { return _handlers.ondatachannel; },
    set ondatachannel(fn) { _handlers.ondatachannel = fn; },
    get onconnectionstatechange() { return _handlers.onconnectionstatechange; },
    set onconnectionstatechange(fn) { _handlers.onconnectionstatechange = fn; },

    // 创建 Offer
    createOffer: function () {
      return Promise.resolve({
        type: 'offer',
        sdp: 'mock-offer-sdp'
      });
    },

    // 创建 Answer
    createAnswer: function () {
      return Promise.resolve({
        type: 'answer',
        sdp: 'mock-answer-sdp'
      });
    },

    // 设置本地描述
    setLocalDescription: function (description) {
      _localDescription = description;
      if (description.type === 'offer') {
        _signalingState = SignalingState.HAVE_LOCAL_OFFER;
      } else if (description.type === 'answer') {
        _signalingState = SignalingState.STABLE;
      } else if (description.type === 'rollback') {
        _signalingState = SignalingState.STABLE;
      }
      return Promise.resolve();
    },

    // 设置远端描述
    setRemoteDescription: function (description) {
      _remoteDescription = description;
      if (description.type === 'offer') {
        _signalingState = SignalingState.HAVE_REMOTE_OFFER;
      } else if (description.type === 'answer') {
        _signalingState = SignalingState.STABLE;
        _connectionState = ConnectionState.CONNECTED;
      }
      return Promise.resolve();
    },

    // 添加 ICE 候选
    addIceCandidate: function (candidate) {
      return Promise.resolve();
    },

    // 创建 DataChannel
    createDataChannel: function (label) {
      var channel = {
        label: label,
        readyState: 'open',
        close: function () {
          this.readyState = 'closed';
        }
      };
      _dataChannels.push(channel);
      return channel;
    },

    // 添加轨道
    addTrack: function (track, stream) {
      return null;
    },

    // 关闭连接
    close: function () {
      _connectionState = ConnectionState.CLOSED;
      _signalingState = SignalingState.CLOSED;
    },

    // === 测试辅助方法 ===

    /**
     * 获取创建的 DataChannel
     * @returns {Object[]} DataChannel 数组
     */
    getDataChannels: function () {
      return _dataChannels.slice();
    },

    /**
     * 模拟 ICE 候选
     * @param {RTCIceCandidate} candidate - ICE 候选
     */
    simulateIceCandidate: function (candidate) {
      if (_handlers.onicecandidate) {
        _handlers.onicecandidate({ candidate: candidate });
      }
    },

    /**
     * 模拟接收轨道
     * @param {MediaStream} stream - 媒体流
     */
    simulateTrack: function (stream) {
      if (_handlers.ontrack) {
        _handlers.ontrack({ streams: [stream] });
      }
    },

    /**
     * 模拟连接状态变化
     * @param {string} state - 新状态
     */
    simulateConnectionStateChange: function (state) {
      _connectionState = state;
      if (_handlers.onconnectionstatechange) {
        _handlers.onconnectionstatechange();
      }
    },

    /**
     * 模拟接收 DataChannel
     * @param {Object} channel - DataChannel 对象
     */
    simulateDataChannel: function (channel) {
      if (_handlers.ondatachannel) {
        _handlers.ondatachannel({ channel: channel });
      }
    }
  };

  return mock;
}
