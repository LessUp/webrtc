export function createSignalingController(options) {
  const capabilities = options.capabilities;
  const media = options.media;
  const peerController = options.peerController;
  const reconnectDelaysMs = options.reconnectDelaysMs;
  const state = options.state;
  const statsController = options.statsController;
  const ui = options.ui;

  function scheduleReconnect() {
    if (!state.roomId || state.reconnectTimer) {
      return;
    }
    const delay = reconnectDelaysMs[Math.min(state.reconnectAttempts, reconnectDelaysMs.length - 1)];
    state.reconnectTimer = window.setTimeout(function () {
      state.reconnectTimer = null;
      state.reconnectAttempts += 1;
      connectWS();
    }, delay);
  }

  function clearReconnectTimer() {
    if (!state.reconnectTimer) {
      return;
    }
    window.clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  function connectWS() {
    if (!capabilities.webSocket || !capabilities.rtc) {
      ui.setError('当前浏览器不支持 WebRTC 或 WebSocket');
      return;
    }
    if (!state.roomId) {
      return;
    }
    if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    clearReconnectTimer();
    ui.setRoomState(state.roomState === 'reconnecting' ? 'reconnecting' : 'connecting');

    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = new WebSocket(proto + window.location.host + '/ws');
    state.ws = ws;

    ws.onopen = function () {
      ws.send(JSON.stringify({ type: 'join', room: state.roomId, from: state.myId }));
    };

    ws.onmessage = function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (parseErr) {
        console.error('signal: failed to parse message:', parseErr);
        return;
      }
      switch (msg.type) {
        case 'joined':
          state.reconnectAttempts = 0;
          ui.setRoomState('joined');
          ui.setError('');
          break;
        case 'room_members': {
          const list = Array.isArray(msg.members) ? msg.members : [];
          ui.renderMembers(list);
          const remoteInput = document.getElementById('remote');
          if (remoteInput && !remoteInput.value.trim()) {
            const first = list.find(function (id) { return id && id !== state.myId; });
            if (first) {
              remoteInput.value = first;
            }
          }
          const activePeers = new Set(list.filter(function (id) { return id && id !== state.myId; }));
          Array.from(state.peers.keys()).forEach(function (peerId) {
            if (!activePeers.has(peerId)) {
              peerController.closePeer(peerId, { notify: false });
            }
          });
          ui.updateControls();
          break;
        }
        case 'offer':
        case 'answer':
          if (msg.from && msg.sdp) {
            void peerController.applyDescription(msg.from, msg.sdp);
          }
          break;
        case 'candidate':
          if (msg.from && msg.candidate) {
            void peerController.handleCandidate(msg.from, msg.candidate);
          }
          break;
        case 'hangup':
          if (msg.from) {
            peerController.closePeer(msg.from, { notify: false });
          }
          break;
        case 'error':
          ui.setError(msg.error || '信令请求失败');
          if (msg.code === 'duplicate_id' && (state.roomState === 'connecting' || state.roomState === 'reconnecting')) {
            state.retryJoinAfterClose = true;
            state.manualClose = true;
            ui.setRoomState('reconnecting');
            try { ws.close(); } catch (err) { console.warn('ws.close error:', err); }
            break;
          }
          if (state.roomState === 'connecting' || state.roomState === 'reconnecting') {
            state.manualClose = true;
            ws.close();
            state.ws = null;
            state.roomId = null;
            ui.renderMembers([]);
            ui.setRoomState('idle');
          }
          break;
        case 'pong':
        default:
          break;
      }
    };

    ws.onerror = function (event) {
      console.error('ws error', event);
      ui.setError('信令服务器连接出错');
    };

    ws.onclose = function () {
      const retryJoinAfterClose = state.retryJoinAfterClose;
      const wasManual = state.manualClose;
      state.retryJoinAfterClose = false;
      state.manualClose = false;
      state.ws = null;
      clearReconnectTimer();
      if ((wasManual && !retryJoinAfterClose) || !state.roomId) {
        ui.renderMembers([]);
        ui.setRoomState('idle');
        return;
      }
      ui.setRoomState('reconnecting');
      ui.setError('连接断开，正在重连…');
      scheduleReconnect();
    };
  }

  function leaveRoom() {
    if (statsController) {
      statsController.stop();
    }
    media.stopRecording();
    peerController.closeAllPeers(true);
    if (state.usingScreen) {
      media.stopScreenShare();
    }
    media.stopLocalMedia();
    ui.renderMembers([]);
    ui.setError('');
    clearReconnectTimer();
    const remoteInput = document.getElementById('remote');
    if (remoteInput) {
      remoteInput.value = '';
    }
    if (state.ws) {
      state.manualClose = true;
      state.ws.send(JSON.stringify({ type: 'leave', room: state.roomId, from: state.myId }));
      try { state.ws.close(); } catch (err) { console.warn('ws.close error:', err); }
    }
    state.ws = null;
    state.roomId = null;
    ui.setRoomState('idle');
  }

  return {
    connectWS: connectWS,
    leaveRoom: leaveRoom
  };
}
