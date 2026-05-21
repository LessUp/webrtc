/**
 * 媒体状态模块
 * 管理本地媒体流、屏幕共享和录制状态。
 */

import { createObservable } from './observable.js';

/**
 * 创建媒体状态管理器
 * @returns {Object} 媒体状态接口
 */
export function createMediaState() {
  const observable = createObservable();

  // 私有状态
  let _localStream = null;
  let _screenStream = null;
  let _usingScreen = false;
  let _muted = false;
  let _cameraOff = false;
  let _recorder = null;
  let _recordedChunks = [];

  /**
   * 获取当前状态快照
   * @returns {Object} 状态快照
   */
  function getSnapshot() {
    return {
      localStream: _localStream,
      screenStream: _screenStream,
      usingScreen: _usingScreen,
      muted: _muted,
      cameraOff: _cameraOff,
      recorder: _recorder,
      recordedChunks: _recordedChunks.slice()
    };
  }

  // === 本地流 ===

  function getLocalStream() { return _localStream; }
  function setLocalStream(stream) { _localStream = stream; observable.notify(); }
  function hasLocalStream() { return !!_localStream; }

  // === 屏幕流 ===

  function getScreenStream() { return _screenStream; }
  function setScreenStream(stream) { _screenStream = stream; observable.notify(); }
  function isUsingScreen() { return _usingScreen; }
  function setUsingScreen(value) { _usingScreen = value; observable.notify(); }

  /**
   * 获取当前视频轨道
   * @returns {MediaStreamTrack|null}
   */
  function getCurrentVideoTrack() {
    if (_usingScreen && _screenStream) {
      return _screenStream.getVideoTracks()[0] || null;
    }
    if (!_localStream) {
      return null;
    }
    return _localStream.getVideoTracks()[0] || null;
  }

  // === 静音/摄像头 ===

  function isMuted() { return _muted; }
  function setMuted(value) { _muted = value; observable.notify(); }
  function toggleMuted() { _muted = !_muted; observable.notify(); return _muted; }
  function isCameraOff() { return _cameraOff; }
  function setCameraOff(value) { _cameraOff = value; observable.notify(); }
  function toggleCameraOff() { _cameraOff = !_cameraOff; observable.notify(); return _cameraOff; }

  // === 录制 ===

  function getRecorder() { return _recorder; }
  function setRecorder(recorder) { _recorder = recorder; observable.notify(); }
  function isRecording() { return _recorder && _recorder.state !== 'inactive'; }
  function getRecordedChunks() { return _recordedChunks; }
  function setRecordedChunks(chunks) { _recordedChunks = chunks; observable.notify(); }
  function addRecordedChunk(chunk) { _recordedChunks.push(chunk); observable.notify(); }
  function clearRecordedChunks() { _recordedChunks = []; observable.notify(); }

  // === 重置 ===

  function reset() {
    // 停止本地流轨道
    if (_localStream) {
      _localStream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) { console.warn('track.stop error:', err); }
      });
    }
    // 停止屏幕流轨道
    if (_screenStream) {
      _screenStream.getTracks().forEach(function (track) {
        try { track.stop(); } catch (err) { console.warn('screen track.stop error:', err); }
      });
    }
    _localStream = null;
    _screenStream = null;
    _usingScreen = false;
    _muted = false;
    _cameraOff = false;
    _recorder = null;
    _recordedChunks = [];
    observable.notify();
  }

  return {
    // 订阅
    subscribe: observable.subscribe,

    // 快照
    getSnapshot: getSnapshot,

    // 本地流
    getLocalStream: getLocalStream,
    setLocalStream: setLocalStream,
    hasLocalStream: hasLocalStream,

    // 屏幕流
    getScreenStream: getScreenStream,
    setScreenStream: setScreenStream,
    isUsingScreen: isUsingScreen,
    setUsingScreen: setUsingScreen,
    getCurrentVideoTrack: getCurrentVideoTrack,

    // 静音/摄像头
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMuted: toggleMuted,
    isCameraOff: isCameraOff,
    setCameraOff: setCameraOff,
    toggleCameraOff: toggleCameraOff,

    // 录制
    getRecorder: getRecorder,
    setRecorder: setRecorder,
    isRecording: isRecording,
    getRecordedChunks: getRecordedChunks,
    setRecordedChunks: setRecordedChunks,
    addRecordedChunk: addRecordedChunk,
    clearRecordedChunks: clearRecordedChunks,

    // 重置
    reset: reset
  };
}
