import { RoomStatus } from '../state/index.js';
import { ServerMessageType, ClientMessageType, ErrorCode, parseMessage } from '../protocol/message.js';

export function createSignalingController(options) {
  const capabilities = options.capabilities;
  const media = options.media;
  const peerController = options.peerController;
  const reconnectDelaysMs = options.reconnectDelaysMs;
  const appState = options.appState;
  const statsController = options.statsController;
  const ui = options.ui;

  // 获取子状态引用
  const room = appState.room;
  const peers = appState.peers;
  const mediaState = appState.media;

  function scheduleReconnect() {
    if (!room.getRoomId() || room.getReconnectTimer()) {
      return;
    }
    const attempts = room.getReconnectAttempts();
    const delay = reconnectDelaysMs[Math.min(attempts, reconnectDelaysMs.length - 1)];
    room.setReconnectTimer(window.setTimeout(function () {
      room.setReconnectTimer(null);
      room.incrementReconnectAttempts();
      connectWS();
    }, delay));
  }

  function connectWS() {
    if (!capabilities.webSocket || !capabilities.rtc) {
      ui.setError('当前浏览器不支持 WebRTC 或 WebSocket');
      return;
    }
    if (!room.getRoomId()) {
      return;
    }
    if (room.isWebSocketConnecting()) {
      return;
    }

    room.clearReconnectTimer();
    room.setStatus(room.getStatus() === RoomStatus.RECONNECTING ? RoomStatus.RECONNECTING : RoomStatus.CONNECTING);

    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = new WebSocket(proto + window.location.host + '/ws');
    room.setWebSocket(ws);

    ws.onopen = function () {
      try {
        ws.send(JSON.stringify({
          type: ClientMessageType.JOIN,
          room: room.getRoomId(),
          from: appState.getMyId()
        }));
      } catch (err) {
        console.error('signal: failed to send join:', err);
        ui.setError('加入房间失败');
      }
    };

    ws.onmessage = function (event) {
      const msg = parseMessage(event.data);
      if (!msg) {
        console.error('signal: failed to parse message');
        return;
      }

      switch (msg.type) {
        case ServerMessageType.JOINED:
          room.resetReconnectAttempts();
          room.setStatus(RoomStatus.JOINED);
          ui.setError('');
          break;

        case ServerMessageType.ROOM_MEMBERS: {
          const list = msg.members || [];
          ui.renderMembers(list);
          const remoteInput = document.getElementById('remote');
          if (remoteInput && !remoteInput.value.trim()) {
            const first = list.find(function (id) { return id && id !== appState.getMyId(); });
            if (first) {
              remoteInput.value = first;
            }
          }
          const activePeers = new Set(list.filter(function (id) { return id && id !== appState.getMyId(); }));
          peers.cleanupInactive(activePeers, function (peerId) {
            peerController.closePeer(peerId, { notify: false });
          });
          break;
        }

        case ClientMessageType.OFFER:
        case ClientMessageType.ANSWER:
          if (msg.from && msg.sdp) {
            void peerController.applyDescription(msg.from, msg.sdp).catch(function (err) {
              console.warn('peer: failed to apply description:', err);
            });
          }
          break;

        case ClientMessageType.CANDIDATE:
          if (msg.from && msg.candidate) {
            void peerController.handleCandidate(msg.from, msg.candidate).catch(function (err) {
              console.warn('peer: failed to handle candidate:', err);
            });
          }
          break;

        case ClientMessageType.HANGUP:
          if (msg.from) {
            peerController.closePeer(msg.from, { notify: false });
          }
          break;

        case ServerMessageType.ERROR:
          ui.setError(msg.error || '信令请求失败');
          if (msg.code === ErrorCode.DUPLICATE_ID && room.isConnecting()) {
            room.setRetryJoinAfterClose(true);
            room.setManualClose(true);
            room.setStatus(RoomStatus.RECONNECTING);
            try { ws.close(); } catch (err) { console.warn('ws.close error:', err); }
            break;
          }
          if (room.isConnecting()) {
            room.setManualClose(true);
            ws.close();
            room.setWebSocket(null);
            room.setRoomId(null);
            ui.renderMembers([]);
            room.setStatus(RoomStatus.IDLE);
          }
          break;

        case ServerMessageType.PONG:
        default:
          break;
      }
    };

    ws.onerror = function (event) {
      console.error('ws error', event);
      ui.setError('信令服务器连接出错');
    };

    ws.onclose = function () {
      const retryJoinAfterClose = room.getRetryJoinAfterClose();
      const wasManual = room.getManualClose();
      room.setRetryJoinAfterClose(false);
      room.setManualClose(false);
      room.setWebSocket(null);
      room.clearReconnectTimer();
      if ((wasManual && !retryJoinAfterClose) || !room.getRoomId()) {
        ui.renderMembers([]);
        room.setStatus(RoomStatus.IDLE);
        return;
      }
      room.setStatus(RoomStatus.RECONNECTING);
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
    if (mediaState.isUsingScreen()) {
      media.stopScreenShare();
    }
    media.stopLocalMedia();
    ui.renderMembers([]);
    ui.setError('');
    room.clearReconnectTimer();
    const remoteInput = document.getElementById('remote');
    if (remoteInput) {
      remoteInput.value = '';
    }
    const ws = room.getWebSocket();
    if (ws) {
      room.setManualClose(true);
      try {
        ws.send(JSON.stringify({
          type: ClientMessageType.LEAVE,
          room: room.getRoomId(),
          from: appState.getMyId()
        }));
      } catch (err) {
        console.error('signal: failed to send leave:', err);
      }
      try { ws.close(); } catch (err) { console.warn('ws.close error:', err); }
    }
    room.setWebSocket(null);
    room.setRoomId(null);
    room.setStatus(RoomStatus.IDLE);
  }

  return {
    connectWS: connectWS,
    leaveRoom: leaveRoom
  };
}
