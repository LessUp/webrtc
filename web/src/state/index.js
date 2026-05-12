/**
 * 应用状态模块
 * 聚合房间、媒体、Peer 三大领域状态。
 */

import { createMediaState } from './mediaState.js';
import { createPeersState } from './peersState.js';
import { createRoomState, RoomStatus } from './roomState.js';

/**
 * 创建应用状态管理器
 * @param {Object} options - 配置选项
 * @param {string} options.myId - 客户端 ID
 * @returns {Object} 应用状态接口
 */
export function createAppState(options) {
  const myId = options.myId;
  const roomState = createRoomState({ myId: myId });
  const mediaState = createMediaState();
  const peersState = createPeersState();

  /**
   * 获取完整的客户端 ID
   * @returns {string}
   */
  function getMyId() {
    return myId;
  }

  /**
   * 获取所有状态的快照（用于调试）
   * @returns {Object}
   */
  function getSnapshot() {
    return {
      myId: myId,
      room: roomState.getSnapshot(),
      media: mediaState.getSnapshot(),
      peers: peersState.getSnapshot()
    };
  }

  /**
   * 重置所有状态
   */
  function resetAll() {
    roomState.reset();
    mediaState.reset();
    peersState.clear();
  }

  return {
    // 常量
    RoomStatus: RoomStatus,

    // 子状态
    room: roomState,
    media: mediaState,
    peers: peersState,

    // 全局
    getMyId: getMyId,
    getSnapshot: getSnapshot,
    resetAll: resetAll
  };
}

// 导出枚举
export { RoomStatus };
