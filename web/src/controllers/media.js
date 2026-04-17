export function createMediaController(options) {
  const capabilities = options.capabilities;
  const elements = options.elements;
  const state = options.state;
  const ui = options.ui;

  async function ensureLocalMedia() {
    if (state.localStream) {
      return state.localStream;
    }
    if (!capabilities.media) {
      throw new Error('当前浏览器不支持摄像头/麦克风采集');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    state.localStream = stream;
    state.localStream.getAudioTracks().forEach(function (track) {
      track.enabled = !state.muted;
    });
    state.localStream.getVideoTracks().forEach(function (track) {
      track.enabled = !state.cameraOff;
    });
    if (elements.localVideo && !state.usingScreen) {
      elements.localVideo.srcObject = state.localStream;
    }
    ui.updateControls();
    return state.localStream;
  }

  function currentVideoTrack() {
    if (state.usingScreen && state.screenStream) {
      return state.screenStream.getVideoTracks()[0] || null;
    }
    if (!state.localStream) {
      return null;
    }
    return state.localStream.getVideoTracks()[0] || null;
  }

  async function syncPeerMedia(peer) {
    if (!peer || !peer.pc || !state.localStream) {
      return;
    }

    state.localStream.getAudioTracks().forEach(function (track) {
      const sender = peer.pc.getSenders().find(function (item) {
        return item.track && item.track.kind === 'audio';
      });
      if (!sender) {
        peer.pc.addTrack(track, state.localStream);
      } else if (sender.track !== track) {
        sender.replaceTrack(track).catch(function (err) {
          console.warn('replaceTrack(audio) failed:', err);
        });
      }
    });

    const videoTrack = currentVideoTrack();
    if (!videoTrack) {
      return;
    }
    const videoSender = peer.pc.getSenders().find(function (item) {
      return item.track && item.track.kind === 'video';
    });
    if (!videoSender) {
      peer.pc.addTrack(videoTrack, state.usingScreen && state.screenStream ? state.screenStream : state.localStream);
      return;
    }
    if (videoSender.track !== videoTrack) {
      await videoSender.replaceTrack(videoTrack);
    }
  }

  async function syncAllPeerMedia() {
    const peers = Array.from(state.peers.values());
    for (const peer of peers) {
      try {
        await syncPeerMedia(peer);
      } catch (err) {
        console.warn('syncPeerMedia failed for', peer.id, err);
      }
    }
  }

  function stopLocalMedia() {
    if (state.localStream) {
      state.localStream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) { console.warn('track.stop error:', err); }
      });
    }
    state.localStream = null;
    if (elements.localVideo && !state.usingScreen) {
      elements.localVideo.srcObject = null;
    }
    state.muted = false;
    state.cameraOff = false;
    ui.updateControls();
  }

  async function startScreenShare() {
    if (!capabilities.screen) {
      ui.setError('当前浏览器不支持屏幕共享');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach(function (item) { item.stop(); });
        throw new Error('未获取到屏幕视频轨道');
      }
      state.screenStream = stream;
      state.usingScreen = true;
      track.onended = function () {
        stopScreenShare();
      };
      if (elements.localVideo) {
        elements.localVideo.srcObject = stream;
      }
      await syncAllPeerMedia();
      ui.updateControls();
      ui.setError('');
    } catch (err) {
      console.error(err);
      ui.setError('屏幕共享失败：' + (err.message || err.name || '未知错误'));
    }
  }

  function stopScreenShare() {
    if (state.screenStream) {
      state.screenStream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) { console.warn('screen track.stop error:', err); }
      });
    }
    state.screenStream = null;
    state.usingScreen = false;
    if (elements.localVideo) {
      elements.localVideo.srcObject = state.localStream;
    }
    void syncAllPeerMedia();
    ui.updateControls();
  }

  function getRecordStream() {
    for (const peer of state.peers.values()) {
      if (peer.remoteStream) {
        return peer.remoteStream;
      }
    }
    if (state.usingScreen && state.screenStream) {
      return state.screenStream;
    }
    return state.localStream;
  }

  function startRecording() {
    if (!capabilities.record) {
      ui.setError('当前浏览器不支持录制');
      return;
    }
    if (state.recorder && state.recorder.state !== 'inactive') {
      return;
    }

    const stream = getRecordStream();
    if (!stream) {
      ui.setError('没有可录制的媒体流');
      return;
    }

    try {
      state.recordedChunks = [];
      state.recorder = new MediaRecorder(stream);
    } catch (err) {
      console.error(err);
      ui.setError('创建录制器失败：' + (err.message || err.name || '未知错误'));
      return;
    }

    state.recorder.ondataavailable = function (event) {
      if (event.data && event.data.size > 0) {
        state.recordedChunks.push(event.data);
      }
    };
    state.recorder.onerror = function (event) {
      const err = event.error || event;
      ui.setError('录制出错：' + (err.message || err.name || '未知错误'));
    };
    state.recorder.onstop = function () {
      const chunks = state.recordedChunks.slice();
      state.recorder = null;
      state.recordedChunks = [];
      if (!chunks.length) {
        ui.updateControls();
        return;
      }
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'webrtc-recording.webm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      ui.updateControls();
    };

    state.recorder.start();
    ui.setError('');
    ui.updateControls();
  }

  function stopRecording() {
    if (!state.recorder || state.recorder.state === 'inactive') {
      return;
    }
    state.recorder.stop();
  }

  return {
    currentVideoTrack: currentVideoTrack,
    ensureLocalMedia: ensureLocalMedia,
    startRecording: startRecording,
    startScreenShare: startScreenShare,
    stopLocalMedia: stopLocalMedia,
    stopRecording: stopRecording,
    stopScreenShare: stopScreenShare,
    syncAllPeerMedia: syncAllPeerMedia,
    syncPeerMedia: syncPeerMedia
  };
}
