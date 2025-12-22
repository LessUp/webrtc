 (function () {
  const myId = Math.random().toString(36).slice(2,10)
  const idEl = document.getElementById('myId')
  idEl.textContent = myId

  let ws
  let manualClose = false
  let pingTimer = null
  let localStream
  let roomId
  const peers = new Map()

  const statusEl = document.getElementById('status')
  const errorEl = document.getElementById('error')
  const chatLog = document.getElementById('chatLog')
  const membersEl = document.getElementById('members')
  const chatInput = document.getElementById('chatInput')
  const chatSend = document.getElementById('chatSend')

  const roomInput = document.getElementById('room')
  const remoteInput = document.getElementById('remote')
  const localVideo = document.getElementById('local')
  const videosEl = document.getElementById('videos')
  const joinBtn = document.getElementById('join')
  const callBtn = document.getElementById('call')
  const hangupBtn = document.getElementById('hangup')

  let state = 'idle'
  let muted = false
  let cameraOff = false
  let screenStream
  let usingScreen = false
  let recorder
  let recordedChunks = []

function setError(msg) {
  if (!errorEl) return
  errorEl.textContent = msg || ''
}

function setState(newState) {
  state = newState
  if (statusEl) {
    let text = '未连接'
    if (state === 'joined') text = '已加入房间'
    else if (state === 'calling') text = '通话中'
    else if (state === 'ended') text = '通话已结束'
    statusEl.textContent = text
  }
  if (joinBtn) {
    joinBtn.textContent = state === 'idle' ? 'Join' : 'Leave'
    joinBtn.disabled = false
  }
  if (roomInput) {
    roomInput.disabled = state !== 'idle'
  }
  if (remoteInput) {
    remoteInput.disabled = state === 'idle'
  }
  if (callBtn) {
    callBtn.disabled = state === 'idle'
  }
  if (hangupBtn) {
    hangupBtn.disabled = state !== 'calling'
  }
}

function appendChat(text) {
  if (!chatLog) return
  const div = document.createElement('div')
  div.textContent = text
  chatLog.appendChild(div)
  chatLog.scrollTop = chatLog.scrollHeight
}

function renderMembers(list) {
  if (!membersEl) return
  membersEl.innerHTML = ''
  if (!list || !list.length) {
    const span = document.createElement('span')
    span.className = 'muted'
    span.textContent = '暂无成员'
    membersEl.appendChild(span)
    return
  }
  list.forEach(id => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'member-pill'
    if (id === myId) {
      btn.textContent = id + ' (你)'
      btn.disabled = true
    } else {
      btn.textContent = id
      btn.onclick = () => {
        if (!remoteInput) return
        remoteInput.value = id
      }
    }
    membersEl.appendChild(btn)
  })
}

function ensureRemoteTile(peerId) {
  const peer = peers.get(peerId)
  if (!peer || !videosEl) return null
  if (peer.videoEl) return peer.videoEl

  const tile = document.createElement('div')
  tile.className = 'video-tile'
  tile.dataset.peer = peerId

  const label = document.createElement('div')
  label.className = 'video-tile__label'
  label.textContent = '远端：' + peerId

  const video = document.createElement('video')
  video.autoplay = true
  video.playsInline = true

  tile.appendChild(label)
  tile.appendChild(video)
  videosEl.appendChild(tile)

  peer.tileEl = tile
  peer.videoEl = video
  return video
}

function removeRemoteTile(peerId) {
  const peer = peers.get(peerId)
  if (!peer) return
  if (peer.videoEl) peer.videoEl.srcObject = null
  if (peer.tileEl) peer.tileEl.remove()
  peer.videoEl = null
  peer.tileEl = null
}

function syncCallState() {
  if (state === 'idle') return
  if (peers.size > 0) {
    setState('calling')
    return
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    setState('joined')
  } else {
    setState('idle')
  }
}

function setupDataChannel(peerId, dc) {
  const peer = peers.get(peerId)
  if (peer) peer.dc = dc
  dc.onopen = () => {
    appendChat('[system] chat channel opened: ' + peerId)
  }
  dc.onmessage = (e) => {
    appendChat(peerId + ': ' + e.data)
  }
  dc.onclose = () => {
    appendChat('[system] chat channel closed: ' + peerId)
  }
}

function sendChat() {
  if (!chatInput) return
  const text = chatInput.value.trim()
  if (!text) return
  const channels = []
  for (const peer of peers.values()) {
    if (peer.dc && peer.dc.readyState === 'open') channels.push(peer.dc)
  }
  if (!channels.length) {
    setError('聊天通道未建立（请先 Call）')
    return
  }
  setError('')
  channels.forEach(dc => {
    try {
      dc.send(text)
    } catch {}
  })
  appendChat('me: ' + text)
  chatInput.value = ''
}

if (chatSend) {
  chatSend.onclick = sendChat
}

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendChat()
    }
  })
}

const servers = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] }
const pingIntervalMs = 25000

function startPing() {
  stopPing()
  pingTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', room: roomId, from: myId }))
    }
  }, pingIntervalMs)
}

function stopPing() {
  if (!pingTimer) return
  clearInterval(pingTimer)
  pingTimer = null
}

async function getMedia() {
  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      if (localVideo) localVideo.srcObject = localStream
      setError('')
    } catch (err) {
      console.error(err)
      setError('无法获取摄像头/麦克风：' + (err.message || err.name || '未知错误'))
      throw err
    }
  }
}

const recStart = document.getElementById('recStart')
const recStop = document.getElementById('recStop')

if (recStop) {
  recStop.disabled = true
}

if (recStart) {
  recStart.onclick = () => {
    if (recorder && recorder.state && recorder.state !== 'inactive') {
      return
    }
    const stream = getRecordStream()
    if (!stream) {
      setError('没有可录制的媒体流')
      return
    }
    recordedChunks = []
    try {
      recorder = new MediaRecorder(stream)
    } catch (err) {
      console.error(err)
      setError('创建录制器失败：' + (err.message || err.name || '未知错误'))
      return
    }
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data)
    }
    recorder.onerror = (e) => {
      const err = e.error || e
      console.error('recorder error', err)
      setError('录制出错：' + (err.message || err.name || '未知错误'))
    }
    recorder.onstop = () => {
      if (!recordedChunks.length) {
        if (recStart) recStart.disabled = false
        if (recStop) recStop.disabled = true
        return
      }
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'webrtc-recording.webm'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      recorder = null
      recordedChunks = []
      if (recStart) recStart.disabled = false
      if (recStop) recStop.disabled = true
    }
    setError('')
    recorder.start()
    recStart.disabled = true
    if (recStop) recStop.disabled = false
  }
}

if (recStop) {
  recStop.onclick = () => {
    if (!recorder || recorder.state === 'inactive') return
    recorder.stop()
  }
}

function connectWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
  ws = new WebSocket(proto + location.host + '/ws')
  ws.onopen = () => {
    setError('')
    ws.send(JSON.stringify({ type: 'join', room: roomId, from: myId }))
    setState('joined')
    startPing()
  }
  ws.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.type === 'offer') {
      if (!msg.from) return
      const peer = await ensurePC(msg.from)
      if (remoteInput) remoteInput.value = msg.from || ''
      await peer.pc.setRemoteDescription(msg.sdp)
      const answer = await peer.pc.createAnswer()
      await peer.pc.setLocalDescription(answer)
      send({ type: 'answer', room: roomId, from: myId, to: msg.from, sdp: peer.pc.localDescription })
      setState('calling')
    } else if (msg.type === 'answer') {
      if (!msg.from) return
      const peer = peers.get(msg.from)
      if (peer && peer.pc) await peer.pc.setRemoteDescription(msg.sdp)
    } else if (msg.type === 'candidate') {
      if (!msg.from) return
      const peer = peers.get(msg.from)
      if (peer && peer.pc && msg.candidate) {
        try { await peer.pc.addIceCandidate(msg.candidate) } catch {}
      }
    } else if (msg.type === 'room_members') {
      const list = msg.members || []
      renderMembers(list)
      if (state === 'joined' && remoteInput && !remoteInput.value.trim()) {
        const peer = list.find(id => id && id !== myId)
        if (peer) remoteInput.value = peer
      }

      const active = new Set(list.filter(id => id && id !== myId))
      for (const pid of Array.from(peers.keys())) {
        if (!active.has(pid)) closePeerConnection(pid)
      }
      syncCallState()
    }
  }
  ws.onerror = (e) => {
    console.error('ws error', e)
    setError('信令服务器连接出错')
  }
  ws.onclose = () => {
    stopPing()
    ws = null
    closePeerConnection()
    roomId = null
    if (remoteInput) remoteInput.value = ''
    if (manualClose) {
      manualClose = false
      setError('')
    } else {
      setError('信令服务器连接已关闭')
    }
    setState('idle')
    renderMembers([])
  }
}

async function ensurePC(target) {
  let peer = peers.get(target)
  if (peer && peer.pc && peer.pc.connectionState !== 'closed' && peer.pc.connectionState !== 'failed') return peer

  const pc = new RTCPeerConnection(servers)
  peer = { id: target, pc, dc: null, remoteStream: null, tileEl: null, videoEl: null }
  peers.set(target, peer)

  pc.onicecandidate = (e) => {
    if (e.candidate) send({ type: 'candidate', room: roomId, from: myId, to: target, candidate: e.candidate })
  }
  pc.ontrack = (e) => {
    peer.remoteStream = e.streams[0]
    const video = ensureRemoteTile(target)
    if (video) video.srcObject = peer.remoteStream
  }
  pc.ondatachannel = (e) => {
    setupDataChannel(target, e.channel)
  }
  pc.onconnectionstatechange = () => {
    const st = pc.connectionState
    if (st === 'failed' || st === 'disconnected' || st === 'closed') {
      closePeerConnection(target)
      syncCallState()
    }
  }

  await getMedia()
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream))
  if (usingScreen && screenStream) {
    const track = screenStream.getVideoTracks()[0]
    if (track) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
      if (sender) {
        sender.replaceTrack(track).catch(() => {})
      }
    }
  }

  return peer
}

function closePeerConnection(peerId) {
  if (!peerId) {
    for (const pid of Array.from(peers.keys())) closePeerConnection(pid)
    return
  }

  const peer = peers.get(peerId)
  if (!peer) return

  if (peer.dc) {
    try { peer.dc.close() } catch {}
  }
  peer.dc = null

  if (peer.pc) {
    try { peer.pc.close() } catch {}
  }
  peer.pc = null

  removeRemoteTile(peerId)
  peers.delete(peerId)
  syncCallState()
}

function stopLocalMedia() {
  if (localStream) {
    localStream.getTracks().forEach(t => { try { t.stop() } catch {} })
    localStream = null
  }
  if (localVideo) localVideo.srcObject = null
  muted = false
  cameraOff = false
  const muteButton = document.getElementById('muteBtn')
  if (muteButton) muteButton.textContent = 'Mute'
  const cameraButton = document.getElementById('cameraBtn')
  if (cameraButton) cameraButton.textContent = 'Camera Off'
}

function leaveRoom() {
  closePeerConnection()
  if (usingScreen) {
    stopScreenShare()
  }
  stopLocalMedia()
  renderMembers([])
  if (remoteInput) remoteInput.value = ''
  setError('')
  stopPing()
  if (ws) {
    try {
      manualClose = true
      ws.send(JSON.stringify({ type: 'leave', room: roomId, from: myId }))
    } catch {}
    try { ws.close() } catch {}
  }
  ws = null
  roomId = null
  setState('idle')
}

function stopScreenShare() {
  if (!usingScreen) return
  if (screenStream) {
    screenStream.getTracks().forEach(t => { try { t.stop() } catch {} })
    screenStream = null
  }
  if (localStream) {
    if (localVideo) localVideo.srcObject = localStream
    const cameraTrack = localStream.getVideoTracks()[0]
    if (cameraTrack) {
      for (const peer of peers.values()) {
        if (!peer.pc) continue
        const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) sender.replaceTrack(cameraTrack).catch(() => {})
      }
    }
  } else {
    if (localVideo) localVideo.srcObject = null
  }
  usingScreen = false
  const btn = document.getElementById('screenBtn')
  if (btn) btn.textContent = 'Share Screen'
}

function getRecordStream() {
  for (const peer of peers.values()) {
    if (peer.remoteStream) return peer.remoteStream
  }
  if (usingScreen && screenStream) return screenStream
  if (localStream) return localStream
  return null
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj))
  }
}

joinBtn.onclick = async () => {
  if (state !== 'idle') {
    leaveRoom()
    return
  }
  roomId = (roomInput ? roomInput.value : '').trim()
  if (!roomId) return
  try {
    await getMedia()
  } catch {
    // error already handled in getMedia
    return
  }
  connectWS()
}

callBtn.onclick = async () => {
  const id = (remoteInput ? remoteInput.value : '').trim()
  if (!id || !roomId) return
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    setError('信令服务器未连接')
    return
  }
  const peer = await ensurePC(id)
  if (!peer.dc) {
    const dc = peer.pc.createDataChannel('chat')
    setupDataChannel(id, dc)
  }
  const offer = await peer.pc.createOffer()
  await peer.pc.setLocalDescription(offer)
  send({ type: 'offer', room: roomId, from: myId, to: id, sdp: peer.pc.localDescription })
  setState('calling')
}

hangupBtn.onclick = () => {
  closePeerConnection()
  if (roomId && ws && ws.readyState === WebSocket.OPEN) {
    setState('joined')
  } else {
    setState('idle')
  }
}

const muteBtn = document.getElementById('muteBtn')
if (muteBtn) {
  muteBtn.onclick = () => {
    if (!localStream) return
    const tracks = localStream.getAudioTracks()
    if (!tracks.length) return
    muted = !muted
    tracks.forEach(t => { t.enabled = !muted })
    muteBtn.textContent = muted ? 'Unmute' : 'Mute'
  }
}

const cameraBtn = document.getElementById('cameraBtn')
if (cameraBtn) {
  cameraBtn.onclick = () => {
    if (!localStream) return
    const tracks = localStream.getVideoTracks()
    if (!tracks.length) return
    cameraOff = !cameraOff
    tracks.forEach(t => { t.enabled = !cameraOff })
    cameraBtn.textContent = cameraOff ? 'Camera On' : 'Camera Off'
  }
}

const screenBtn = document.getElementById('screenBtn')
if (screenBtn) {
  screenBtn.onclick = async () => {
    if (!usingScreen) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const track = stream.getVideoTracks()[0]
        if (!track) {
          setError('未获取到屏幕视频轨道')
          stream.getTracks().forEach(t => { try { t.stop() } catch {} })
          return
        }
        screenStream = stream
        usingScreen = true
        screenBtn.textContent = 'Stop Share'
        if (localVideo) localVideo.srcObject = screenStream
        for (const peer of peers.values()) {
          if (!peer.pc) continue
          const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video')
          if (sender) {
            await sender.replaceTrack(track)
          }
        }
        track.onended = () => {
          stopScreenShare()
        }
        setError('')
      } catch (err) {
        console.error(err)
        setError('屏幕共享失败：' + (err.message || err.name || '未知错误'))
      }
    } else {
      stopScreenShare()
    }
  }
}
setState('idle')
})();
