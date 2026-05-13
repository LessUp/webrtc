import { RoomStatus } from '../state/index.js';
import { ServerMessageType, ClientMessageType, ErrorCode, parseMessage } from '../protocol/message.js';
import { createBrowserApi } from '../browserApi.js';

export function createSignalingController(options) {
  const capabilities = options.capabilities;
  const media = options.media;
  const peerController = options.peerController;
  const reconnectDelaysMs = options.reconnectDelaysMs;
  const appState = options.appState;
  const statsController = options.statsController;
  const ui = options.ui;
  const browserApi = options.browserApi || createBrowserApi();

  // 获取子状态引用
  const room = appState.room;
  const peers = appState.peers;
  const mediaState = appState.media;

  function scheduleReconnect() {
    if (!room.roomId || room.reconnectTimer) {
      return;
    }
    const attempts = room.reconnectAttempts;
    const delay = reconnectDelaysMs[Math.min(attempts, reconnectDelaysMs.length - 1)];
    room.reconnectTimer = browserApi.setTimeout(function () {
      room.reconnectTimer = null;
      room.incrementReconnectAttempts();
      connectWS();
    }, delay);
  }

  function connectWS() {
    if (!capabilities.webSocket || !capabilities.rtc) {
      ui.setError('当前浏览器不支持 WebRTC 或 WebSocket');
      return;
    }
    if (!room.roomId) {
      return;
    }
    if (room.isWebSocketConnecting) {
      return;
    }

    room.clearReconnectTimer(browserApi.clearTimeout);
    room.status = room.status === RoomStatus.RECONNECTING ? RoomStatus.RECONNECTING : RoomStatus.CONNECTING;

    const location = browserApi.getLocation();
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = browserApi.createWebSocket(proto + location.host + '/ws');
    room.ws = ws;

    ws.onopen = function () {
      try {
        ws.send(JSON.stringify({
          type: ClientMessageType.JOIN,
          room: room.roomId,
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
          room.status = RoomStatus.JOINED;
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
          if (msg.code === ErrorCode.DUPLICATE_ID && room.isConnecting) {
            room.retryJoinAfterClose = true;
            room.manualClose = true;
            room.status = RoomStatus.RECONNECTING;
            try { ws.close(); } catch (err) { console.warn('ws.close error:', err); }
            break;
          }
          if (room.isConnecting) {
            room.manualClose = true;
            ws.close();
            room.ws = null;
            room.roomId = null;
            ui.renderMembers([]);
            room.status = RoomStatus.IDLE;
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
      const retryJoinAfterClose = room.retryJoinAfterClose;
      const wasManual = room.manualClose;
      room.retryJoinAfterClose = false;
      room.manualClose = false;
      room.ws = null;
      room.clearReconnectTimer(browserApi.clearTimeout);
      if ((wasManual && !retryJoinAfterClose) || !room.roomId) {
        ui.renderMembers([]);
        room.status = RoomStatus.IDLE;
        return;
      }
      room.status = RoomStatus.RECONNECTING;
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
    room.clearReconnectTimer(browserApi.clearTimeout);
    const remoteInput = document.getElementById('remote');
    if (remoteInput) {
      remoteInput.value = '';
    }
    const ws = room.ws;
    if (ws) {
      room.manualClose = true;
      try {
        ws.send(JSON.stringify({
          type: ClientMessageType.LEAVE,
          room: room.roomId,
          from: appState.getMyId()
        }));
      } catch (err) {
        console.error('signal: failed to send leave:', err);
      }
      try { ws.close(); } catch (err) { console.warn('ws.close error:', err); }
    }
    room.ws = null;
    room.roomId = null;
    room.status = RoomStatus.IDLE;
  }

  return {
    connectWS: connectWS,
    leaveRoom: leaveRoom
  };
}
