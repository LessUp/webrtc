export function createStatsController(appState) {
  let pollInterval = null;
  // Use WeakMap to automatically clean up when peer connections are closed
  let prevStats = new WeakMap();

  // 获取子状态引用
  const peers = appState.peers;

  function formatBitrate(bytes, deltaMs) {
    if (deltaMs <= 0 || bytes < 0) return '--';
    return Math.round(bytes * 8 / deltaMs) + ' kbps';
  }

  function extractOutboundVideo(report) {
    for (const entry of report.values()) {
      if (entry.type === 'outbound-rtp' && entry.kind === 'video') {
        return entry;
      }
    }
    return null;
  }

  function extractCandidatePair(report) {
    for (const entry of report.values()) {
      if (entry.type === 'candidate-pair' && entry.state === 'succeeded') {
        return entry;
      }
    }
    return null;
  }

  function extractInboundRtp(report, kind) {
    for (const entry of report.values()) {
      if (entry.type === 'inbound-rtp' && entry.kind === kind) {
        return entry;
      }
    }
    return null;
  }

  function extractTrack(report, kind) {
    for (const entry of report.values()) {
      if (entry.type === 'track' && entry.kind === kind) {
        return entry;
      }
    }
    return null;
  }

  function computeStats(pc) {
    return pc.getStats().then(function (report) {
      const video = extractOutboundVideo(report);
      const audioIn = extractInboundRtp(report, 'audio');
      const videoIn = extractTrack(report, 'video');
      const pair = extractCandidatePair(report);
      const now = Date.now();
      const prev = prevStats.get(pc) || {};

      const result = {
        videoBitrate: '--',
        audioLoss: '--',
        rtt: '--',
        resolution: '--',
        codec: '--'
      };

      if (video) {
        const delta = now - (prev.timestamp || now);
        const bytesDelta = (video.bytesSent || 0) - (prev.bytesSent || 0);
        if (delta > 0 && bytesDelta > 0) {
          result.videoBitrate = formatBitrate(bytesDelta, delta);
        }
        if (video.frameWidth && video.frameHeight) {
          result.resolution = video.frameWidth + 'x' + video.frameHeight;
        }
        if (video.codecId) {
          for (const entry of report.values()) {
            if (entry.id === video.codecId && entry.mimeType) {
              result.codec = entry.mimeType.replace('video/', '');
              break;
            }
          }
        }
      }

      if (audioIn) {
        const total = audioIn.packetsReceived || 0;
        const lost = audioIn.packetsLost || 0;
        if (total > 0) {
          result.audioLoss = (lost / total * 100).toFixed(1) + '%';
        }
      }

      if (pair && typeof pair.currentRoundTripTime === 'number') {
        result.rtt = Math.round(pair.currentRoundTripTime * 1000) + ' ms';
      }

      prevStats.set(pc, { timestamp: now, bytesSent: video ? video.bytesSent : 0 });
      return result;
    });
  }

  function renderStats(peerId, stats, getStatsEl) {
    const statsEl = getStatsEl ? getStatsEl(peerId) : null;
    if (!statsEl) {
      return;
    }
    statsEl.innerHTML =
      '<span>' + stats.videoBitrate + '</span>' +
      '<span>' + stats.resolution + '</span>' +
      '<span>Loss ' + stats.audioLoss + '</span>' +
      '<span>RTT ' + stats.rtt + '</span>' +
      '<span>' + stats.codec + '</span>';
  }

  function poll(getStatsEl) {
    peers.forEach(function (peerState, peerId) {
      const pc = peerState.getPeerConnection();
      if (!pc || pc.connectionState !== 'connected') {
        return;
      }
      computeStats(pc).then(function (stats) {
        renderStats(peerId, stats, getStatsEl);
      }).catch(function () {});
    });
  }

  function start(getStatsEl) {
    if (pollInterval) {
      return;
    }
    pollInterval = setInterval(function () {
      poll(getStatsEl);
    }, 2000);
  }

  function stop() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    // WeakMap doesn't have clear(), but entries are automatically
    // cleaned up when peer connections are garbage collected.
    // We create a new WeakMap to effectively clear it.
    prevStats = new WeakMap();
  }

  return {
    start: start,
    stop: stop
  };
}
