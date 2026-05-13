import { createBrowserApi } from '../browserApi.js';

export function createMediaController(options) {
  const capabilities = options.capabilities;
  const elements = options.elements;
  const appState = options.appState;
  const ui = options.ui;
  const browserApi = options.browserApi || createBrowserApi();

  // 获取子状态引用
  const mediaState = appState.media;
  const peers = appState.peers;

  async function ensureLocalMedia() {
    const localStream = mediaState.getLocalStream();
    if (localStream) {
      return localStream;
    }
    if (!capabilities.media) {
      throw new Error('当前浏览器不支持摄像头/麦克风采集');
    }

    const stream = await browserApi.getUserMedia({ audio: true, video: true });
    mediaState.setLocalStream(stream);
    stream.getAudioTracks().forEach(function (track) {
      track.enabled = !mediaState.isMuted();
    });
    stream.getVideoTracks().forEach(function (track) {
      track.enabled = !mediaState.isCameraOff();
    });
    if (elements.localVideo && !mediaState.isUsingScreen()) {
      elements.localVideo.srcObject = stream;
    }
    return stream;
  }

  /**
   * 同步媒体到 Peer 连接
   * @param {Object} ctx - 上下文对象，包含 pc 属性
   */
  async function syncPeerMedia(ctx) {
    const localStream = mediaState.getLocalStream();
    const pc = ctx ? ctx.pc : null;
    if (!pc || !localStream) {
      return;
    }

    localStream.getAudioTracks().forEach(function (track) {
      const sender = pc.getSenders().find(function (item) {
        return item.track && item.track.kind === 'audio';
      });
      if (!sender) {
        pc.addTrack(track, localStream);
      } else if (sender.track !== track) {
        sender.replaceTrack(track).catch(function (err) {
          console.warn('replaceTrack(audio) failed:', err);
        });
      }
    });

    const videoTrack = mediaState.getCurrentVideoTrack();
    if (!videoTrack) {
      return;
    }
    const videoSender = pc.getSenders().find(function (item) {
      return item.track && item.track.kind === 'video';
    });
    if (!videoSender) {
      pc.addTrack(videoTrack, mediaState.isUsingScreen() && mediaState.getScreenStream() ? mediaState.getScreenStream() : localStream);
      return;
    }
    if (videoSender.track !== videoTrack) {
      await videoSender.replaceTrack(videoTrack);
    }
  }

  async function syncAllPeerMedia() {
    const peerList = peers.values();
    for (const peerState of peerList) {
      try {
        const pc = peerState.getPeerConnection();
        if (pc) {
          await syncPeerMedia({ pc: pc });
        }
      } catch (err) {
        console.warn('syncPeerMedia failed for', peerState.peerId, err);
      }
    }
  }

  function stopLocalMedia() {
    const localStream = mediaState.getLocalStream();
    if (localStream) {
      localStream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) { console.warn('track.stop error:', err); }
      });
    }
    mediaState.setLocalStream(null);
    if (elements.localVideo && !mediaState.isUsingScreen()) {
      elements.localVideo.srcObject = null;
    }
    mediaState.setMuted(false);
    mediaState.setCameraOff(false);
  }

  async function startScreenShare() {
    if (!capabilities.screen) {
      ui.setError('当前浏览器不支持屏幕共享');
      return;
    }

    try {
      const stream = await browserApi.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach(function (item) { item.stop(); });
        throw new Error('未获取到屏幕视频轨道');
      }
      mediaState.setScreenStream(stream);
      mediaState.setUsingScreen(true);
      track.onended = function () {
        stopScreenShare();
      };
      if (elements.localVideo) {
        elements.localVideo.srcObject = stream;
      }
      await syncAllPeerMedia();
      ui.setError('');
    } catch (err) {
      console.error(err);
      ui.setError('屏幕共享失败：' + (err.message || err.name || '未知错误'));
    }
  }

  function stopScreenShare() {
    const screenStream = mediaState.getScreenStream();
    if (screenStream) {
      screenStream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) { console.warn('screen track.stop error:', err); }
      });
    }
    mediaState.setScreenStream(null);
    mediaState.setUsingScreen(false);
    if (elements.localVideo) {
      elements.localVideo.srcObject = mediaState.getLocalStream();
    }
    void syncAllPeerMedia();
  }

  function getRecordStream() {
    for (const peerState of peers.values()) {
      const stream = peerState.getRemoteStream();
      if (stream) {
        return stream;
      }
    }
    if (mediaState.isUsingScreen() && mediaState.getScreenStream()) {
      return mediaState.getScreenStream();
    }
    return mediaState.getLocalStream();
  }

  function startRecording() {
    if (!capabilities.record) {
      ui.setError('当前浏览器不支持录制');
      return;
    }
    if (mediaState.isRecording()) {
      return;
    }

    const stream = getRecordStream();
    if (!stream) {
      ui.setError('没有可录制的媒体流');
      return;
    }

    try {
      mediaState.clearRecordedChunks();
      const recorder = browserApi.createMediaRecorder(stream);
      mediaState.setRecorder(recorder);

      recorder.ondataavailable = function (event) {
        if (event.data && event.data.size > 0) {
          mediaState.addRecordedChunk(event.data);
        }
      };
      recorder.onerror = function (event) {
        const err = event.error || event;
        ui.setError('录制出错：' + (err.message || err.name || '未知错误'));
      };
      recorder.onstop = function () {
        const chunks = mediaState.getRecordedChunks().slice();
        mediaState.setRecorder(null);
        mediaState.clearRecordedChunks();
        if (!chunks.length) {
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
      };

      recorder.start();
      ui.setError('');
    } catch (err) {
      console.error(err);
      ui.setError('创建录制器失败：' + (err.message || err.name || '未知错误'));
    }
  }

  function stopRecording() {
    const recorder = mediaState.getRecorder();
    if (!recorder || recorder.state === 'inactive') {
      return;
    }
    recorder.stop();
  }

  return {
    currentVideoTrack: function () { return mediaState.getCurrentVideoTrack(); },
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
