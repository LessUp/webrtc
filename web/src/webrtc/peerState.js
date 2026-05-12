/**
 * PeerState 类
 * 封装 WebRTC Perfect Negotiation 状态机。
 *
 * 这个类专注于 WebRTC 协商逻辑，不包含 UI 元素。
 * UI 元素由 ui.js 管理。
 */

import { ClientMessageType } from '../protocol/message.js';

/**
 * 连接状态枚举
 * @readonly
 * @enum {string}
 */
export const PeerConnectionState = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed',
  FAILED: 'failed'
};

/**
 * 创建 PeerState 实例
 * @param {Object} options - 配置选项
 * @param {string} options.peerId - 远端 Peer ID
 * @param {string} options.myId - 本地客户端 ID（用于判断 polite）
 * @param {Object} options.rtcConfig - RTCPeerConnection 配置
 * @param {Object} options.callbacks - 回调函数
 * @param {Function} options.callbacks.onIceCandidate - ICE 候选回调
 * @param {Function} options.callbacks.onTrack - 接收轨道回调
 * @param {Function} options.callbacks.onDataChannel - DataChannel 创建回调
 * @param {Function} options.callbacks.onConnectionStateChange - 连接状态变化回调
 * @returns {Object} PeerState 实例
 */
export function createPeerState(options) {
  const peerId = options.peerId;
  const myId = options.myId;
  const rtcConfig = options.rtcConfig;
  const callbacks = options.callbacks || {};

  // Perfect Negotiation 状态
  const polite = myId.localeCompare(peerId) > 0;
  let pc = null;
  let dc = null;
  let makingOffer = false;
  let ignoreOffer = false;
  let isSettingRemoteAnswerPending = false;
  let pendingCandidates = [];
  let connectionState = PeerConnectionState.NEW;
  let remoteStream = null;

  /**
   * 获取 RTCPeerConnection 实例
   * @returns {RTCPeerConnection|null}
   */
  function getPeerConnection() {
    return pc;
  }

  /**
   * 获取 DataChannel 实例
   * @returns {RTCDataChannel|null}
   */
  function getDataChannel() {
    return dc;
  }

  /**
   * 设置 DataChannel 实例
   * @param {RTCDataChannel} channel
   */
  function setDataChannel(channel) {
    dc = channel;
  }

  /**
   * 获取远端媒体流
   * @returns {MediaStream|null}
   */
  function getRemoteStream() {
    return remoteStream;
  }

  /**
   * 获取连接状态
   * @returns {string}
   */
  function getConnectionState() {
    return connectionState;
  }

  /**
   * 初始化 RTCPeerConnection
   */
  function initConnection() {
    if (pc && pc.connectionState !== 'closed') {
      return pc;
    }

    pc = new RTCPeerConnection(rtcConfig);

    // ICE 候选
    pc.onicecandidate = function (event) {
      if (event.candidate && callbacks.onIceCandidate) {
        callbacks.onIceCandidate(event.candidate);
      }
    };

    // 接收轨道
    pc.ontrack = function (event) {
      remoteStream = event.streams[0];
      if (callbacks.onTrack) {
        callbacks.onTrack(remoteStream);
      }
    };

    // 接收 DataChannel
    pc.ondatachannel = function (event) {
      dc = event.channel;
      if (callbacks.onDataChannel) {
        callbacks.onDataChannel(event.channel);
      }
    };

    // 连接状态变化
    pc.onconnectionstatechange = function () {
      connectionState = pc.connectionState;
      if (callbacks.onConnectionStateChange) {
        callbacks.onConnectionStateChange(connectionState);
      }
    };

    return pc;
  }

  /**
   * 创建 DataChannel
   * @param {string} label - DataChannel 标签
   * @returns {RTCDataChannel}
   */
  function createDataChannel(label) {
    if (!pc) {
      initConnection();
    }
    if (!dc || dc.readyState === 'closed') {
      dc = pc.createDataChannel(label);
    }
    return dc;
  }

  /**
   * 处理远端描述（offer/answer）
   * 实现 Perfect Negotiation 算法
   * @param {RTCSessionDescriptionInit} description - SDP 描述
   * @param {Object} handlers - 处理函数
   * @param {Function} handlers.ensureLocalMedia - 确保本地媒体
   * @param {Function} handlers.syncPeerMedia - 同步媒体到 Peer
   * @param {Function} handlers.sendSignal - 发送信令
   * @returns {Promise<void>}
   */
  async function handleRemoteDescription(description, handlers) {
    initConnection();

    const readyForOffer = !makingOffer && (pc.signalingState === 'stable' || isSettingRemoteAnswerPending);
    const offerCollision = description.type === 'offer' && !readyForOffer;
    ignoreOffer = !polite && offerCollision;

    if (ignoreOffer) {
      return;
    }

    try {
      if (description.type === 'offer' && offerCollision && pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      isSettingRemoteAnswerPending = description.type === 'answer';
      await pc.setRemoteDescription(description);
      isSettingRemoteAnswerPending = false;

      if (description.type === 'offer') {
        if (handlers.ensureLocalMedia) {
          await handlers.ensureLocalMedia();
        }
        if (handlers.syncPeerMedia) {
          await handlers.syncPeerMedia({ pc: pc });
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (handlers.sendSignal) {
          handlers.sendSignal({ type: ClientMessageType.ANSWER, sdp: pc.localDescription });
        }
      }

      await drainPendingCandidates();
    } catch (err) {
      isSettingRemoteAnswerPending = false;
      throw err;
    }
  }

  /**
   * 处理 ICE 候选
   * @param {RTCIceCandidateInit} candidate - ICE 候选
   * @returns {Promise<void>}
   */
  async function handleIceCandidate(candidate) {
    initConnection();

    if (!pc.remoteDescription) {
      pendingCandidates.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      if (!ignoreOffer) {
        console.warn('addIceCandidate failed:', err);
      }
    }
  }

  /**
   * 排空待处理的 ICE 候选
   */
  async function drainPendingCandidates() {
    if (!pc || !pc.remoteDescription) {
      return;
    }
    while (pendingCandidates.length > 0) {
      const candidate = pendingCandidates.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('addIceCandidate failed:', err);
      }
    }
  }

  /**
   * 发起呼叫（创建 offer）
   * @param {Object} handlers - 处理函数
   * @param {Function} handlers.ensureLocalMedia - 确保本地媒体
   * @param {Function} handlers.syncPeerMedia - 同步媒体到 Peer
   * @param {Function} handlers.sendSignal - 发送信令
   * @returns {Promise<void>}
   */
  async function createOffer(handlers) {
    initConnection();

    try {
      if (handlers.ensureLocalMedia) {
        await handlers.ensureLocalMedia();
      }
      if (handlers.syncPeerMedia) {
        await handlers.syncPeerMedia({ pc: pc });
      }

      makingOffer = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (handlers.sendSignal) {
        handlers.sendSignal({ type: ClientMessageType.OFFER, sdp: pc.localDescription });
      }
    } finally {
      makingOffer = false;
    }
  }

  /**
   * 关闭连接
   */
  function close() {
    if (dc) {
      try {
        dc.close();
      } catch (err) {
        console.warn('dc.close error:', err);
      }
      dc = null;
    }
    if (pc) {
      try {
        pc.close();
      } catch (err) {
        console.warn('pc.close error:', err);
      }
      pc = null;
    }
    remoteStream = null;
    connectionState = PeerConnectionState.CLOSED;
    pendingCandidates = [];
  }

  /**
   * 获取快照（用于调试）
   * @returns {Object}
   */
  function getSnapshot() {
    return {
      peerId: peerId,
      polite: polite,
      connectionState: connectionState,
      makingOffer: makingOffer,
      ignoreOffer: ignoreOffer,
      isSettingRemoteAnswerPending: isSettingRemoteAnswerPending,
      pendingCandidatesCount: pendingCandidates.length,
      hasDataChannel: !!dc,
      hasRemoteStream: !!remoteStream
    };
  }

  return {
    // 常量
    peerId: peerId,
    polite: polite,

    // 获取器
    getPeerConnection: getPeerConnection,
    getDataChannel: getDataChannel,
    setDataChannel: setDataChannel,
    getRemoteStream: getRemoteStream,
    getConnectionState: getConnectionState,

    // 连接管理
    initConnection: initConnection,
    createDataChannel: createDataChannel,
    createOffer: createOffer,
    handleRemoteDescription: handleRemoteDescription,
    handleIceCandidate: handleIceCandidate,
    close: close,

    // 调试
    getSnapshot: getSnapshot
  };
}
