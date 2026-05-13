/**
 * 浏览器 API 抽象层
 *
 * 封装浏览器原生 API，支持测试时注入 mock 实现。
 * 生产环境使用真实实现，测试环境注入替代实现。
 */

/**
 * 创建浏览器 API 实例
 * @param {Object} [overrides={}] - 覆盖默认实现的 API
 * @returns {Object} 浏览器 API 接口
 */
export function createBrowserApi(overrides) {
  var merged = overrides || {};
  var api = {
    /**
     * 创建 WebSocket 连接
     * @param {string} url - WebSocket URL
     * @returns {WebSocket}
     */
    createWebSocket: merged.createWebSocket || function (url) {
      return new WebSocket(url);
    },

    /**
     * 创建 RTCPeerConnection
     * @param {RTCConfiguration} config - WebRTC 配置
     * @returns {RTCPeerConnection}
     */
    createPeerConnection: merged.createPeerConnection || function (config) {
      return new RTCPeerConnection(config);
    },

    /**
     * 获取用户媒体（摄像头/麦克风）
     * @param {MediaStreamConstraints} constraints - 媒体约束
     * @returns {Promise<MediaStream>}
     */
    getUserMedia: merged.getUserMedia || function (constraints) {
      return navigator.mediaDevices.getUserMedia(constraints);
    },

    /**
     * 获取显示媒体（屏幕共享）
     * @param {DisplayMediaStreamConstraints} constraints - 显示媒体约束
     * @returns {Promise<MediaStream>}
     */
    getDisplayMedia: merged.getDisplayMedia || function (constraints) {
      return navigator.mediaDevices.getDisplayMedia(constraints);
    },

    /**
     * 创建 MediaRecorder
     * @param {MediaStream} stream - 媒体流
     * @param {Object} [options] - 录制选项
     * @returns {MediaRecorder}
     */
    createMediaRecorder: merged.createMediaRecorder || function (stream, options) {
      return new MediaRecorder(stream, options);
    },

    /**
     * 设置定时器
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟毫秒数
     * @returns {number} 定时器 ID
     */
    setTimeout: merged.setTimeout || function (callback, delay) {
      return window.setTimeout(callback, delay);
    },

    /**
     * 清除定时器
     * @param {number} id - 定时器 ID
     */
    clearTimeout: merged.clearTimeout || function (id) {
      window.clearTimeout(id);
    },

    /**
     * 获取当前位置信息
     * @returns {Object} { protocol, host }
     */
    getLocation: merged.getLocation || function () {
      return {
        protocol: window.location.protocol,
        host: window.location.host
      };
    }
  };

  return api;
}
