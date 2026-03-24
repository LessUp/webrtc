export function createPeerController(options) {
  const media = options.media;
  const rtcConfig = options.rtcConfig;
  const sendSignal = options.sendSignal;
  const state = options.state;
  const ui = options.ui;

  function setupDataChannel(peer, dataChannel) {
    peer.dc = dataChannel;
    dataChannel.onopen = function () {
      ui.appendChat('[system] chat channel opened: ' + peer.id);
    };
    dataChannel.onmessage = function (event) {
      ui.appendChat(peer.id + ': ' + event.data);
    };
    dataChannel.onclose = function () {
      ui.appendChat('[system] chat channel closed: ' + peer.id);
    };
  }

  function ensurePeer(peerId) {
    let peer = state.peers.get(peerId);
    if (peer && peer.pc && peer.pc.connectionState !== 'closed') {
      return peer;
    }

    const pc = new RTCPeerConnection(rtcConfig);
    peer = {
      id: peerId,
      polite: state.myId.localeCompare(peerId) > 0,
      pc: pc,
      dc: null,
      remoteStream: null,
      tileEl: null,
      videoEl: null,
      labelEl: null,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      pendingCandidates: [],
      connectionState: 'new'
    };
    state.peers.set(peerId, peer);

    pc.onicecandidate = function (event) {
      if (event.candidate) {
        sendSignal({ type: 'candidate', to: peerId, candidate: event.candidate });
      }
    };
    pc.ontrack = function (event) {
      peer.remoteStream = event.streams[0];
      const video = ui.ensureRemoteTile(peerId);
      if (video) {
        video.srcObject = peer.remoteStream;
      }
    };
    pc.ondatachannel = function (event) {
      setupDataChannel(peer, event.channel);
    };
    pc.onconnectionstatechange = function () {
      peer.connectionState = pc.connectionState;
      ui.updatePeerLabel(peer);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeer(peerId, { notify: false });
      }
      ui.updateControls();
    };

    ui.updatePeerLabel(peer);
    ui.updateControls();
    return peer;
  }

  async function drainPendingCandidates(peer) {
    if (!peer || !peer.pc || !peer.pc.remoteDescription) {
      return;
    }
    while (peer.pendingCandidates.length > 0) {
      const candidate = peer.pendingCandidates.shift();
      try {
        await peer.pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('addIceCandidate failed:', err);
      }
    }
  }

  async function applyDescription(peerId, description) {
    const peer = ensurePeer(peerId);
    const pc = peer.pc;
    const readyForOffer = !peer.makingOffer && (pc.signalingState === 'stable' || peer.isSettingRemoteAnswerPending);
    const offerCollision = description.type === 'offer' && !readyForOffer;
    peer.ignoreOffer = !peer.polite && offerCollision;
    if (peer.ignoreOffer) {
      return;
    }

    try {
      if (description.type === 'offer' && offerCollision && pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      peer.isSettingRemoteAnswerPending = description.type === 'answer';
      await pc.setRemoteDescription(description);
      peer.isSettingRemoteAnswerPending = false;

      if (description.type === 'offer') {
        await media.ensureLocalMedia();
        await media.syncPeerMedia(peer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'answer', to: peerId, sdp: pc.localDescription });
      }

      await drainPendingCandidates(peer);
      ui.setError('');
    } catch (err) {
      peer.isSettingRemoteAnswerPending = false;
      console.error(err);
      ui.setError('处理信令失败：' + (err.message || err.name || '未知错误'));
    }
  }

  async function handleCandidate(peerId, candidate) {
    const peer = ensurePeer(peerId);
    if (!peer.pc.remoteDescription) {
      peer.pendingCandidates.push(candidate);
      return;
    }
    try {
      await peer.pc.addIceCandidate(candidate);
    } catch (err) {
      if (!peer.ignoreOffer) {
        console.warn('addIceCandidate failed:', err);
      }
    }
  }

  async function startCall(peerId) {
    if (!peerId || peerId === state.myId) {
      ui.setError('请选择有效的远端成员');
      return;
    }
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      ui.setError('信令服务器未连接');
      return;
    }

    const peer = ensurePeer(peerId);
    try {
      await media.ensureLocalMedia();
      await media.syncPeerMedia(peer);
      if (!peer.dc || peer.dc.readyState === 'closed') {
        setupDataChannel(peer, peer.pc.createDataChannel('chat'));
      }
      peer.makingOffer = true;
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', to: peerId, sdp: peer.pc.localDescription });
      ui.setError('');
    } catch (err) {
      console.error(err);
      ui.setError('发起呼叫失败：' + (err.message || err.name || '未知错误'));
    } finally {
      peer.makingOffer = false;
      ui.updateControls();
    }
  }

  function closePeer(peerId, options) {
    const peer = state.peers.get(peerId);
    if (!peer) {
      return;
    }
    const opts = Object.assign({ notify: false }, options || {});
    if (opts.notify) {
      sendSignal({ type: 'hangup', to: peerId });
    }
    if (peer.dc) {
      try { peer.dc.close(); } catch (err) { console.warn('dc.close error:', err); }
    }
    if (peer.pc) {
      try { peer.pc.close(); } catch (err) { console.warn('pc.close error:', err); }
    }
    ui.removeRemoteTile(peerId);
    state.peers.delete(peerId);
    ui.updateControls();
  }

  function closeAllPeers(notify) {
    Array.from(state.peers.keys()).forEach(function (peerId) {
      closePeer(peerId, { notify: !!notify });
    });
  }

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
    if (target) {
      const peer = state.peers.get(target);
      if (peer && peer.dc && peer.dc.readyState === 'open') {
        channels.push(peer.dc);
      }
    }
    if (!channels.length) {
      for (const peer of state.peers.values()) {
        if (peer.dc && peer.dc.readyState === 'open') {
          channels.push(peer.dc);
        }
      }
    }
    if (!channels.length) {
      ui.setError('聊天通道未建立（请先 Call）');
      return;
    }

    channels.forEach(function (channel) {
      try { channel.send(text); } catch (err) { console.warn('dc.send error:', err); }
    });
    ui.appendChat('me: ' + text);
    input.value = '';
    ui.setError('');
  }

  return {
    applyDescription: applyDescription,
    closeAllPeers: closeAllPeers,
    closePeer: closePeer,
    ensurePeer: ensurePeer,
    handleCandidate: handleCandidate,
    startCall: startCall,
    sendChat: sendChat
  };
}
