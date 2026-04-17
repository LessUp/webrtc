export function createStatsController(state) {
  var pollInterval = null;
  // Use WeakMap to automatically clean up when peer connections are closed
  var prevStats = new WeakMap();

  function formatBitrate(bytes, deltaMs) {
    if (deltaMs <= 0 || bytes < 0) return '--';
    return Math.round(bytes * 8 / deltaMs) + ' kbps';
  }

  function extractOutboundVideo(report) {
    for (var entry of report.values()) {
      if (entry.type === 'outbound-rtp' && entry.kind === 'video') {
        return entry;
      }
    }
    return null;
  }

  function extractCandidatePair(report) {
    for (var entry of report.values()) {
      if (entry.type === 'candidate-pair' && entry.state === 'succeeded') {
        return entry;
      }
    }
    return null;
  }

  function extractInboundRtp(report, kind) {
    for (var entry of report.values()) {
      if (entry.type === 'inbound-rtp' && entry.kind === kind) {
        return entry;
      }
    }
    return null;
  }

  function extractTrack(report, kind) {
    for (var entry of report.values()) {
      if (entry.type === 'track' && entry.kind === kind) {
        return entry;
      }
    }
    return null;
  }

  function computeStats(pc) {
    return pc.getStats().then(function (report) {
      var video = extractOutboundVideo(report);
      var audioIn = extractInboundRtp(report, 'audio');
      var videoIn = extractTrack(report, 'video');
      var pair = extractCandidatePair(report);
      var now = Date.now();
      var prev = prevStats.get(pc) || {};

      var result = {
        videoBitrate: '--',
        audioLoss: '--',
        rtt: '--',
        resolution: '--',
        codec: '--'
      };

      if (video) {
        var delta = now - (prev.timestamp || now);
        var bytesDelta = (video.bytesSent || 0) - (prev.bytesSent || 0);
        if (delta > 0 && bytesDelta > 0) {
          result.videoBitrate = formatBitrate(bytesDelta, delta);
        }
        if (video.frameWidth && video.frameHeight) {
          result.resolution = video.frameWidth + 'x' + video.frameHeight;
        }
        if (video.codecId) {
          for (var entry of report.values()) {
            if (entry.id === video.codecId && entry.mimeType) {
              result.codec = entry.mimeType.replace('video/', '');
              break;
            }
          }
        }
      }

      if (audioIn) {
        var total = audioIn.packetsReceived || 0;
        var lost = audioIn.packetsLost || 0;
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

  function renderStats(peerId, stats) {
    var peer = state.peers.get(peerId);
    if (!peer || !peer.statsEl) {
      return;
    }
    peer.statsEl.innerHTML =
      '<span>' + stats.videoBitrate + '</span>' +
      '<span>' + stats.resolution + '</span>' +
      '<span>Loss ' + stats.audioLoss + '</span>' +
      '<span>RTT ' + stats.rtt + '</span>' +
      '<span>' + stats.codec + '</span>';
  }

  function poll() {
    state.peers.forEach(function (peer, peerId) {
      if (!peer.pc || peer.pc.connectionState !== 'connected') {
        return;
      }
      computeStats(peer.pc).then(function (stats) {
        renderStats(peerId, stats);
      }).catch(function () {});
    });
  }

  function start() {
    if (pollInterval) {
      return;
    }
    pollInterval = setInterval(poll, 2000);
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
