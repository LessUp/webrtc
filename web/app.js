 const myId = Math.random().toString(36).slice(2,10)
 const idEl = document.getElementById('myId')
 idEl.textContent = myId

 let ws
 let pc
 let localStream
 let roomId
 let remoteId

 const statusEl = document.getElementById('status')
 const errorEl = document.getElementById('error')
 let state = 'idle'
 let muted = false
 let cameraOff = false
 let screenStream
 let usingScreen = false

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
    }
  }
  ws.onerror = (e) => {
    console.error('ws error', e)
    setError('信令服务器连接出错')
  }
  ws.onclose = () => {
    setError('信令服务器连接已关闭')
    setState('idle')
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
