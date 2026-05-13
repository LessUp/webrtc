/**
 * Peer 状态模块
 * 管理 WebRTC Peer 连接集合。
 */

import { createObservable } from './observable.js';

/**
 * 创建 Peer 状态管理器
 * @returns {Object} Peer 状态接口
 */
export function createPeersState() {
  var observable = createObservable();

  // 私有状态
  var _peers = new Map();

  /**
   * 获取当前状态快照
   * @returns {Object} 状态快照
   */
  function getSnapshot() {
    return {
      peers: new Map(_peers),
      size: _peers.size
    };
  }

  // === Peer 管理 ===

  function get(peerId) { return _peers.get(peerId); }
  function set(peerId, peer) { _peers.set(peerId, peer); observable.notify(); }
  function has(peerId) { return _peers.has(peerId); }
  function remove(peerId) {
    var result = _peers.delete(peerId);
    if (result) observable.notify();
    return result;
  }
  function clear() { _peers.clear(); observable.notify(); }
  function size() { return _peers.size; }
  function isEmpty() { return _peers.size === 0; }

  /**
   * 获取所有 Peer ID
   * @returns {string[]}
   */
  function keys() { return Array.from(_peers.keys()); }

  /**
   * 获取所有 Peer 对象
   * @returns {Object[]}
   */
  function values() { return Array.from(_peers.values()); }

  /**
   * 遍历所有 Peer
   * @param {Function} callback - 回调函数 (peer, peerId) => void
   */
  function forEach(callback) { _peers.forEach(callback); }

  /**
   * 获取活跃 Peer 的 ID 列表（排除自身）
   * @param {string} myId - 自身 ID
   * @returns {string[]}
   */
  function getActivePeerIds(myId) {
    return Array.from(_peers.keys()).filter(function (id) {
      return id && id !== myId;
    });
  }

  /**
   * 清理不活跃的 Peer
   * @param {Set} activeIds - 活跃 ID 集合
   * @param {Function} closeCallback - 关闭回调 (peerId) => void
   */
  function cleanupInactive(activeIds, closeCallback) {
    Array.from(_peers.keys()).forEach(function (peerId) {
      if (!activeIds.has(peerId)) {
        closeCallback(peerId);
      }
    });
  }

  return {
    // 订阅
    subscribe: observable.subscribe,

    // 快照
    getSnapshot: getSnapshot,

    // Map 代理
    get: get,
    set: set,
    has: has,
    remove: remove,
    clear: clear,
    size: size,
    isEmpty: isEmpty,
    keys: keys,
    values: values,
    forEach: forEach,

    // 工具方法
    getActivePeerIds: getActivePeerIds,
    cleanupInactive: cleanupInactive
  };
}
