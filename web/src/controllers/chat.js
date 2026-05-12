/**
 * 聊天控制器模块
 * 管理 DataChannel 聊天消息收发，独立于 Peer 连接管理。
 */

/**
 * 创建聊天控制器
 * @param {Object} options - 配置选项
 * @param {Object} options.appState - 应用状态
 * @param {Object} options.ui - UI 控制器，提供 appendChat、setError、selectedPeerId 方法
 * @returns {Object} 聊天控制器接口
 */
export function createChatController(options) {
  const appState = options.appState;
  const ui = options.ui;

  // 获取子状态引用
  const peers = appState.peers;

  /**
   * 发送聊天消息到指定的或所有活跃的 DataChannel
   */
  function sendChat() {
    const input = document.getElementById('chatInput');
    if (!input) {
      return;
    }
    const text = input.value.trim();
    if (!text) {
      return;
    }

    const target = ui.selectedPeerId();
    const channels = [];

    // 优先发送到选定的 Peer
    if (target) {
      const peerState = peers.get(target);
      if (peerState) {
        const dc = peerState.getDataChannel();
        if (dc && dc.readyState === 'open') {
          channels.push(dc);
        }
      }
    }

    // 如果没有选定或选定通道不可用，广播到所有活跃通道
    if (!channels.length) {
      peers.forEach(function (peerState) {
        const dc = peerState.getDataChannel();
        if (dc && dc.readyState === 'open') {
          channels.push(dc);
        }
      });
    }

    if (!channels.length) {
      ui.setError('聊天通道未建立（请先 Call）');
      return;
    }

    channels.forEach(function (channel) {
      try {
        channel.send(text);
      } catch (err) {
        console.warn('dc.send error:', err);
      }
    });

    ui.appendChat('me: ' + text);
    input.value = '';
    ui.setError('');
  }

  /**
   * 设置 Peer DataChannel 的事件处理
   * @param {Object} peerState - PeerState 实例
   * @param {RTCDataChannel} dataChannel - DataChannel 实例
   */
  function setupDataChannel(peerState, dataChannel) {
    peerState.setDataChannel(dataChannel);

    dataChannel.onopen = function () {
      ui.appendChat('[system] chat channel opened: ' + peerState.peerId);
    };

    dataChannel.onmessage = function (event) {
      ui.appendChat(peerState.peerId + ': ' + event.data);
    };

    dataChannel.onclose = function () {
      ui.appendChat('[system] chat channel closed: ' + peerState.peerId);
    };
  }

  return {
    sendChat: sendChat,
    setupDataChannel: setupDataChannel
  };
}
