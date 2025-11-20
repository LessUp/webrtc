 (function () {
 const myId = Math.random().toString(36).slice(2,10)
const idEl = document.getElementById('myId')
idEl.textContent = myId

let ws
let pc
let localStream
let roomId
let remoteId
let dataChannel

const statusEl = document.getElementById('status')
const errorEl = document.getElementById('error')
const chatLog = document.getElementById('chatLog')
const membersEl = document.getElementById('members')
const chatInput = document.getElementById('chatInput')
const chatSend = document.getElementById('chatSend')
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
  if (typeof joinBtn !== 'undefined' && typeof callBtn !== 'undefined' && typeof hangupBtn !== 'undefined') {
    joinBtn.disabled = state !== 'idle'
    callBtn.disabled = state !== 'joined'
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
    membersEl.textContent = 'Members: (none)'
    return
  }
  const label = document.createElement('span')
  label.textContent = 'Members: '
  membersEl.appendChild(label)
  list.forEach(id => {
    const btn = document.createElement('button')
    btn.textContent = id === myId ? id + ' (you)' : id
    btn.onclick = () => {
      if (id === myId) return
      const remoteInput = document.getElementById('remote')
      if (remoteInput) remoteInput.value = id
    }
    membersEl.appendChild(btn)
  })
}

function setupDataChannel(dc) {
  dataChannel = dc
  dc.onopen = () => {
    appendChat('[system] chat channel opened')
  }
  dc.onmessage = (e) => {
    appendChat('peer: ' + e.data)
  }
  dc.onclose = () => {
    appendChat('[system] chat channel closed')
  }
}

const servers = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] }

async function getMedia() {
  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      document.getElementById('local').srcObject = localStream
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
  if (ws && ws.readyState === WebSocket.OPEN) return
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
  ws = new WebSocket(proto + location.host + '/ws')
  ws.onopen = () => {
    setError('')
    ws.send(JSON.stringify({ type: 'join', room: roomId, from: myId }))
    setState('joined')
  }
  ws.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.type === 'offer') {
      await ensurePC(msg.from)
      await pc.setRemoteDescription(msg.sdp)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send({ type: 'answer', room: roomId, from: myId, to: msg.from, sdp: pc.localDescription })
    } else if (msg.type === 'answer') {
      if (pc) {
        await pc.setRemoteDescription(msg.sdp)
      }
    } else if (msg.type === 'candidate') {
      if (pc && msg.candidate) {
        try { await pc.addIceCandidate(msg.candidate) } catch {}
      }
    } else if (msg.type === 'room_members') {
      const list = msg.members || []
      renderMembers(list)
    }
  }
  ws.onerror = (e) => {
    console.error('ws error', e)
    setError('信令服务器连接出错')
  }
  ws.onclose = () => {
    setError('信令服务器连接已关闭')
    setState('idle')
    renderMembers([])
  }
}

async function ensurePC(target) {
  remoteId = target
  if (pc) return
  pc = new RTCPeerConnection(servers)
  pc.onicecandidate = (e) => {
    if (e.candidate) send({ type: 'candidate', room: roomId, from: myId, to: remoteId, candidate: e.candidate })
  }
  pc.ontrack = (e) => {
    document.getElementById('remoteVideo').srcObject = e.streams[0]
  }
  pc.ondatachannel = (e) => {
    setupDataChannel(e.channel)
  }
  await getMedia()
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream))
}

function stopScreenShare() {
  if (!usingScreen) return
  const localVideo = document.getElementById('local')
  if (screenStream) {
    screenStream.getTracks().forEach(t => { try { t.stop() } catch {} })
    screenStream = null
  }
  if (localStream) {
    localVideo.srcObject = localStream
    const cameraTrack = localStream.getVideoTracks()[0]
    if (pc && cameraTrack) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
      if (sender) {
        sender.replaceTrack(cameraTrack).catch(() => {})
      }
    }
  } else {
    localVideo.srcObject = null
  }
  usingScreen = false
  const btn = document.getElementById('screenBtn')
  if (btn) btn.textContent = 'Share Screen'
}

function getRecordStream() {
  const remoteVideo = document.getElementById('remoteVideo')
  const remoteStream = remoteVideo && remoteVideo.srcObject
  if (remoteStream) return remoteStream
  if (localStream) return localStream
  return null
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj))
  }
}

const joinBtn = document.getElementById('join')
joinBtn.onclick = async () => {
  roomId = document.getElementById('room').value.trim()
  if (!roomId) return
  connectWS()
  try {
    await getMedia()
  } catch {
    // error already handled in getMedia
    return
  }
}

const callBtn = document.getElementById('call')
callBtn.onclick = async () => {
  const id = document.getElementById('remote').value.trim()
  if (!id || !roomId) return
  await ensurePC(id)
  if (!dataChannel) {
    const dc = pc.createDataChannel('chat')
    setupDataChannel(dc)
  }
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  send({ type: 'offer', room: roomId, from: myId, to: id, sdp: pc.localDescription })
  setState('calling')
}

const hangupBtn = document.getElementById('hangup')
hangupBtn.onclick = () => {
  if (pc) {
    pc.getSenders().forEach(s => { try { s.track && s.track.stop() } catch {} })
    pc.close()
    pc = null
  }
  if (roomId) {
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
        const localVideo = document.getElementById('local')
        localVideo.srcObject = screenStream
        if (pc) {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
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
