import { RoomStatus } from '../state/index.js';

export function getElements() {
  const byId = function (id) { return document.getElementById(id); };
  return {
    statusEl: byId('status'),
    errorEl: byId('error'),
    chatLog: byId('chatLog'),
    membersEl: byId('members'),
    chatInput: byId('chatInput'),
    chatSend: byId('chatSend'),
    roomInput: byId('room'),
    remoteInput: byId('remote'),
    localVideo: byId('local'),
    videosEl: byId('videos'),
    joinBtn: byId('join'),
    callBtn: byId('call'),
    hangupBtn: byId('hangup'),
    muteBtn: byId('muteBtn'),
    cameraBtn: byId('cameraBtn'),
    screenBtn: byId('screenBtn'),
    recStart: byId('recStart'),
    recStop: byId('recStop'),
    idEl: byId('myId')
  };
}

/**
 * 创建 UI 控制器
 * @param {Object} options - 配置选项
 */
export function createUI(options) {
  const capabilities = options.capabilities;
  const elements = options.elements;
  const roomStateText = options.roomStateText;
  const appState = options.appState;

  // 获取子状态引用
  const room = appState.room;
  const mediaState = appState.media;
  const peers = appState.peers;

  // UI 元素缓存（与 PeerState 分离）
  const peerTiles = new Map();

  // 订阅状态变更，自动刷新 UI
  room.subscribe(updateControls);
  mediaState.subscribe(updateControls);
  peers.subscribe(updateControls);

  function setError(message) {
    if (elements.errorEl) {
      elements.errorEl.textContent = message || '';
    }
  }

  function roomStatus() {
    if (!peers.isEmpty()) {
      return 'calling';
    }
    return room.getStatus();
  }

  function statusDotClass() {
    if (!peers.isEmpty()) {
      return 'status__dot--calling';
    }
    const status = room.getStatus();
    if (status === RoomStatus.JOINED) {
      return 'status__dot--joined';
    }
    if (status === RoomStatus.CONNECTING || status === RoomStatus.RECONNECTING) {
      return 'status__dot--connecting';
    }
    return '';
  }

  function updateControls() {
    const status = room.getStatus();
    const joined = status === RoomStatus.JOINED || status === RoomStatus.RECONNECTING;
    const activeCall = !peers.isEmpty();
    const localReady = mediaState.hasLocalStream();

    if (elements.statusEl) {
      var dotClass = statusDotClass();
      elements.statusEl.innerHTML = '<span class="status__dot ' + dotClass + '"></span>' + (roomStateText[roomStatus()] || roomStateText.idle);
    }
    if (elements.joinBtn) {
      elements.joinBtn.textContent = room.isIdle() ? 'Join' : 'Leave';
      elements.joinBtn.disabled = !capabilities.webSocket || !capabilities.rtc || status === RoomStatus.CONNECTING;
    }
    if (elements.roomInput) {
      elements.roomInput.disabled = !room.isIdle();
    }
    if (elements.remoteInput) {
      elements.remoteInput.disabled = !joined;
    }
    if (elements.callBtn) {
      elements.callBtn.disabled = !joined;
    }
    if (elements.hangupBtn) {
      elements.hangupBtn.disabled = !activeCall;
    }
    if (elements.muteBtn) {
      elements.muteBtn.disabled = !localReady;
      elements.muteBtn.textContent = mediaState.isMuted() ? 'Unmute' : 'Mute';
    }
    if (elements.cameraBtn) {
      elements.cameraBtn.disabled = !localReady;
      elements.cameraBtn.textContent = mediaState.isCameraOff() ? 'Camera On' : 'Camera Off';
    }
    if (elements.screenBtn) {
      elements.screenBtn.disabled = !capabilities.screen || room.isIdle();
      elements.screenBtn.textContent = mediaState.isUsingScreen() ? 'Stop Share' : 'Share Screen';
    }
    if (elements.recStart) {
      elements.recStart.disabled = !capabilities.record || mediaState.isRecording();
    }
    if (elements.recStop) {
      elements.recStop.disabled = !mediaState.isRecording();
    }
  }

  function setRoomState(nextState) {
    room.setStatus(nextState);
  }

  function appendChat(text) {
    if (!elements.chatLog) {
      return;
    }
    const line = document.createElement('div');
    line.textContent = text;
    elements.chatLog.appendChild(line);
    elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  }

  function renderMembers(list) {
    room.setLastMembers(list);
    if (!elements.membersEl) {
      return;
    }

    const members = room.getLastMembers();
    elements.membersEl.replaceChildren();
    if (!members.length) {
      const empty = document.createElement('span');
      empty.className = 'muted';
      empty.textContent = '暂无成员';
      elements.membersEl.appendChild(empty);
      return;
    }

    members.forEach(function (id) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'member-pill';
      if (id === appState.getMyId()) {
        btn.textContent = id + ' (你)';
        btn.disabled = true;
      } else {
        btn.textContent = id;
        btn.addEventListener('click', function () {
          if (elements.remoteInput) {
            elements.remoteInput.value = id;
          }
        });
      }
      elements.membersEl.appendChild(btn);
    });
  }

  function selectedPeerId() {
    return elements.remoteInput ? elements.remoteInput.value.trim() : '';
  }

  /**
   * 确保 Peer 视频瓦片存在
   * @param {string} peerId - Peer ID
   * @returns {HTMLVideoElement|null}
   */
  function ensureRemoteTile(peerId) {
    if (!elements.videosEl) {
      return null;
    }

    // 检查是否已有瓦片
    let tile = peerTiles.get(peerId);
    if (tile && tile.videoEl) {
      return tile.videoEl;
    }

    // 创建新的瓦片
    const tileEl = document.createElement('div');
    tileEl.className = 'video-tile';
    tileEl.dataset.peer = peerId;

    const labelEl = document.createElement('div');
    labelEl.className = 'video-tile__label';
    labelEl.textContent = '远端：' + peerId;

    const videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.playsInline = true;

    const statsEl = document.createElement('div');
    statsEl.className = 'video-tile__stats';

    tileEl.appendChild(labelEl);
    tileEl.appendChild(videoEl);
    tileEl.appendChild(statsEl);
    elements.videosEl.appendChild(tileEl);

    // 缓存 UI 元素
    tile = { tileEl: tileEl, labelEl: labelEl, videoEl: videoEl, statsEl: statsEl };
    peerTiles.set(peerId, tile);

    return videoEl;
  }

  /**
   * 更新 Peer 标签
   * @param {Object} peerState - PeerState 实例
   */
  function updatePeerLabel(peerState) {
    if (!peerState) {
      return;
    }
    const tile = peerTiles.get(peerState.peerId);
    if (!tile || !tile.labelEl) {
      return;
    }
    const connectionState = peerState.getConnectionState();
    const suffix = connectionState && connectionState !== 'new'
      ? ' [' + connectionState + ']'
      : '';
    tile.labelEl.textContent = '远端：' + peerState.peerId + suffix;
  }

  /**
   * 移除 Peer 视频瓦片
   * @param {string} peerId - Peer ID
   */
  function removeRemoteTile(peerId) {
    const tile = peerTiles.get(peerId);
    if (!tile) {
      return;
    }
    if (tile.videoEl) {
      tile.videoEl.srcObject = null;
    }
    if (tile.tileEl) {
      tile.tileEl.remove();
    }
    peerTiles.delete(peerId);
  }

  /**
   * 获取 Peer 的 stats 元素
   * @param {string} peerId - Peer ID
   * @returns {HTMLElement|null}
   */
  function getStatsEl(peerId) {
    const tile = peerTiles.get(peerId);
    return tile ? tile.statsEl : null;
  }

  function initCapabilityHints() {
    if (!capabilities.webSocket || !capabilities.rtc) {
      setError('当前浏览器不支持 WebRTC / WebSocket，无法发起通话');
    } else if (!capabilities.media) {
      setError('当前浏览器不支持媒体采集，无法发起音视频通话');
    }
    if (elements.screenBtn && !capabilities.screen) {
      elements.screenBtn.title = '当前浏览器不支持屏幕共享';
    }
    if (elements.recStart && !capabilities.record) {
      elements.recStart.title = '当前浏览器不支持本地录制';
    }
  }

  return {
    appendChat: appendChat,
    ensureRemoteTile: ensureRemoteTile,
    getStatsEl: getStatsEl,
    initCapabilityHints: initCapabilityHints,
    removeRemoteTile: removeRemoteTile,
    renderMembers: renderMembers,
    selectedPeerId: selectedPeerId,
    setError: setError,
    setRoomState: setRoomState,
    updateControls: updateControls,
    updatePeerLabel: updatePeerLabel
  };
}
