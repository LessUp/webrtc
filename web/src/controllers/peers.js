/**
 * Peer 控制器模块
 * 管理 WebRTC Peer 连接的创建、SDP/ICE 协商和生命周期。
 * 使用 PeerState 封装 WebRTC 状态机。
 */

import { createPeerState } from '../webrtc/peerState.js';
import { ClientMessageType } from '../protocol/message.js';

export function createPeerController(options) {
  const media = options.media;
  const rtcConfig = options.rtcConfig;
  const sendSignal = options.sendSignal;
  const appState = options.appState;
  const ui = options.ui;
  const chat = options.chat; // 可选：聊天控制器

  // 获取子状态引用
  const room = appState.room;
  const peers = appState.peers;

  /**
   * 确保存在 PeerState 实例
   * @param {string} peerId - 远端 ID
   * @returns {Object} PeerState 实例
   */
  function ensurePeer(peerId) {
    let peerState = peers.get(peerId);
    if (peerState && peerState.getPeerConnection()?.connectionState !== 'closed') {
      return peerState;
    }

    // 创建 PeerState 实例
    peerState = createPeerState({
      peerId: peerId,
      myId: appState.getMyId(),
      rtcConfig: rtcConfig,
      callbacks: {
        onIceCandidate: function (candidate) {
          sendSignal({ type: ClientMessageType.CANDIDATE, to: peerId, candidate: candidate });
        },
        onTrack: function (stream) {
          const video = ui.ensureRemoteTile(peerId);
          if (video) {
            video.srcObject = stream;
          }
        },
        onDataChannel: function (channel) {
          if (chat && chat.setupDataChannel) {
            chat.setupDataChannel(peerState, channel);
          }
        },
        onConnectionStateChange: function (state) {
          ui.updatePeerLabel(peerState);
          if (state === 'failed' || state === 'closed') {
            closePeer(peerId, { notify: false });
          }
        }
      }
    });

    peers.set(peerId, peerState);
    ui.updatePeerLabel(peerState);
    return peerState;
  }

  /**
   * 处理远端描述
   * @param {string} peerId - 远端 ID
   * @param {RTCSessionDescriptionInit} description - SDP 描述
   */
  async function applyDescription(peerId, description) {
    const peerState = ensurePeer(peerId);
    try {
      await peerState.handleRemoteDescription(description, {
        ensureLocalMedia: media.ensureLocalMedia,
        syncPeerMedia: function (ctx) {
          return media.syncPeerMedia(ctx);
        },
        sendSignal: function (payload) {
          sendSignal(Object.assign({ to: peerId }, payload));
        }
      });
      ui.setError('');
    } catch (err) {
      console.error(err);
      ui.setError('处理信令失败：' + (err.message || err.name || '未知错误'));
    }
  }

  /**
   * 处理 ICE 候选
   * @param {string} peerId - 远端 ID
   * @param {RTCIceCandidateInit} candidate - ICE 候选
   */
  async function handleCandidate(peerId, candidate) {
    const peerState = ensurePeer(peerId);
    await peerState.handleIceCandidate(candidate);
  }

  /**
   * 发起呼叫
   * @param {string} peerId - 远端 ID
   */
  async function startCall(peerId) {
    if (!peerId || peerId === appState.getMyId()) {
      ui.setError('请选择有效的远端成员');
      return;
    }
    if (!room.isWebSocketOpen()) {
      ui.setError('信令服务器未连接');
      return;
    }

    const peerState = ensurePeer(peerId);
    try {
      // 创建 DataChannel 用于聊天
      peerState.createDataChannel('chat');
      if (chat && chat.setupDataChannel) {
        chat.setupDataChannel(peerState, peerState.getDataChannel());
      }

      await peerState.createOffer({
        ensureLocalMedia: media.ensureLocalMedia,
        syncPeerMedia: function (ctx) {
          return media.syncPeerMedia(ctx);
        },
        sendSignal: function (payload) {
          sendSignal(Object.assign({ to: peerId }, payload));
        }
      });
      ui.setError('');
    } catch (err) {
      console.error(err);
      ui.setError('发起呼叫失败：' + (err.message || err.name || '未知错误'));
    }
  }

  /**
   * 关闭单个 Peer 连接
   * @param {string} peerId - 远端 ID
   * @param {Object} options - 选项
   */
  function closePeer(peerId, options) {
    const peerState = peers.get(peerId);
    if (!peerState) {
      return;
    }
    const opts = Object.assign({ notify: false }, options || {});
    if (opts.notify) {
      sendSignal({ type: ClientMessageType.HANGUP, to: peerId });
    }
    peerState.close();
    ui.removeRemoteTile(peerId);
    peers.remove(peerId);
  }

  /**
   * 关闭所有 Peer 连接
   * @param {boolean} notify - 是否发送 hangup 通知
   */
  function closeAllPeers(notify) {
    peers.keys().forEach(function (peerId) {
      closePeer(peerId, { notify: !!notify });
    });
  }

  return {
    applyDescription: applyDescription,
    closeAllPeers: closeAllPeers,
    closePeer: closePeer,
    ensurePeer: ensurePeer,
    handleCandidate: handleCandidate,
    startCall: startCall
  };
}
