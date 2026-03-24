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

export function createUI(options) {
  const capabilities = options.capabilities;
  const elements = options.elements;
  const roomStateText = options.roomStateText;
  const state = options.state;

  function setError(message) {
    if (elements.errorEl) {
      elements.errorEl.textContent = message || '';
    }
  }

  function roomStatus() {
    if (state.peers.size > 0) {
      return 'calling';
    }
    return state.roomState;
  }

  function updateControls() {
    const joined = state.roomState === 'joined' || state.roomState === 'reconnecting';
    const activeCall = state.peers.size > 0;
    const localReady = !!state.localStream;

    if (elements.statusEl) {
      elements.statusEl.textContent = roomStateText[roomStatus()] || roomStateText.idle;
    }
    if (elements.joinBtn) {
      elements.joinBtn.textContent = state.roomState === 'idle' ? 'Join' : 'Leave';
      elements.joinBtn.disabled = !capabilities.webSocket || !capabilities.rtc || state.roomState === 'connecting';
    }
    if (elements.roomInput) {
      elements.roomInput.disabled = state.roomState !== 'idle';
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
      elements.muteBtn.textContent = state.muted ? 'Unmute' : 'Mute';
    }
    if (elements.cameraBtn) {
      elements.cameraBtn.disabled = !localReady;
      elements.cameraBtn.textContent = state.cameraOff ? 'Camera On' : 'Camera Off';
    }
    if (elements.screenBtn) {
      elements.screenBtn.disabled = !capabilities.screen || state.roomState === 'idle';
      elements.screenBtn.textContent = state.usingScreen ? 'Stop Share' : 'Share Screen';
    }
    if (elements.recStart) {
      elements.recStart.disabled = !capabilities.record || (state.recorder && state.recorder.state !== 'inactive');
    }
    if (elements.recStop) {
      elements.recStop.disabled = !state.recorder || state.recorder.state === 'inactive';
    }
  }

  function setRoomState(nextState) {
    state.roomState = nextState;
    updateControls();
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
    state.lastMembers = Array.isArray(list) ? list.slice() : [];
    if (!elements.membersEl) {
      return;
    }

    elements.membersEl.replaceChildren();
    if (!state.lastMembers.length) {
      const empty = document.createElement('span');
      empty.className = 'muted';
      empty.textContent = '暂无成员';
      elements.membersEl.appendChild(empty);
      return;
    }

    state.lastMembers.forEach(function (id) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'member-pill';
      if (id === state.myId) {
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

  function ensureRemoteTile(peerId) {
    const peer = state.peers.get(peerId);
    if (!peer || !elements.videosEl) {
      return null;
    }
    if (peer.videoEl) {
      return peer.videoEl;
    }

    const tile = document.createElement('div');
    tile.className = 'video-tile';
    tile.dataset.peer = peerId;

    const label = document.createElement('div');
    label.className = 'video-tile__label';
    label.textContent = '远端：' + peerId;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;

    tile.appendChild(label);
    tile.appendChild(video);
    elements.videosEl.appendChild(tile);

    peer.tileEl = tile;
    peer.labelEl = label;
    peer.videoEl = video;
    return video;
  }

  function updatePeerLabel(peer) {
    if (!peer || !peer.labelEl) {
      return;
    }
    const suffix = peer.connectionState && peer.connectionState !== 'new'
      ? ' [' + peer.connectionState + ']'
      : '';
    peer.labelEl.textContent = '远端：' + peer.id + suffix;
  }

  function removeRemoteTile(peerId) {
    const peer = state.peers.get(peerId);
    if (!peer) {
      return;
    }
    if (peer.videoEl) {
      peer.videoEl.srcObject = null;
    }
    if (peer.tileEl) {
      peer.tileEl.remove();
    }
    peer.videoEl = null;
    peer.tileEl = null;
    peer.labelEl = null;
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
