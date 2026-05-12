/**
 * 信令消息类型定义
 * 与后端 internal/signal/message.go 保持同步
 */

// ============ 消息类型常量 ============

/**
 * 客户端发送的消息类型
 */
export const ClientMessageType = {
  JOIN: 'join',
  LEAVE: 'leave',
  PING: 'ping',
  OFFER: 'offer',
  ANSWER: 'answer',
  CANDIDATE: 'candidate',
  HANGUP: 'hangup'
};

/**
 * 服务器发送的消息类型
 */
export const ServerMessageType = {
  JOINED: 'joined',
  PONG: 'pong',
  ROOM_MEMBERS: 'room_members',
  ERROR: 'error'
};

// ============ 类型守卫 ============

/**
 * 判断是否为客户端消息类型
 * @param {string} type
 * @returns {boolean}
 */
export function isClientMessageType(type) {
  return Object.values(ClientMessageType).includes(type);
}

/**
 * 判断是否为服务器消息类型
 * @param {string} type
 * @returns {boolean}
 */
export function isServerMessageType(type) {
  return Object.values(ServerMessageType).includes(type);
}

/**
 * 判断消息是否需要路由
 * @param {string} type
 * @returns {boolean}
 */
export function needsRouting(type) {
  return [
    ClientMessageType.OFFER,
    ClientMessageType.ANSWER,
    ClientMessageType.CANDIDATE,
    ClientMessageType.HANGUP
  ].includes(type);
}

// ============ 消息验证 ============

/**
 * 验证消息的基本结构
 * @param {unknown} msg
 * @returns {Object|null}
 */
export function validateMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    return null;
  }

  const m = msg;
  if (typeof m.type !== 'string') {
    return null;
  }

  // 根据类型进行特定验证
  switch (m.type) {
    case ClientMessageType.JOIN:
      if (typeof m.room === 'string' && typeof m.from === 'string') {
        return { type: m.type, room: m.room, from: m.from };
      }
      return null;

    case ClientMessageType.LEAVE:
      if (typeof m.room === 'string' && typeof m.from === 'string') {
        return { type: m.type, room: m.room, from: m.from };
      }
      return null;

    case ClientMessageType.PING:
      return { type: m.type };

    case ClientMessageType.OFFER:
    case ClientMessageType.ANSWER:
      if (typeof m.to === 'string' && m.sdp) {
        return { type: m.type, to: m.to, sdp: m.sdp };
      }
      return null;

    case ClientMessageType.CANDIDATE:
      if (typeof m.to === 'string' && m.candidate) {
        return { type: m.type, to: m.to, candidate: m.candidate };
      }
      return null;

    case ClientMessageType.HANGUP:
      return { type: m.type, to: m.to };

    case ServerMessageType.JOINED:
      if (typeof m.room === 'string' && typeof m.from === 'string') {
        return { type: m.type, room: m.room, from: m.from };
      }
      return null;

    case ServerMessageType.PONG:
      return { type: m.type };

    case ServerMessageType.ROOM_MEMBERS:
      if (typeof m.room === 'string' && Array.isArray(m.members)) {
        return { type: m.type, room: m.room, members: m.members };
      }
      return null;

    case ServerMessageType.ERROR:
      if (typeof m.code === 'string' && typeof m.error === 'string') {
        return { type: m.type, code: m.code, error: m.error };
      }
      return null;

    default:
      return null;
  }
}

/**
 * 解析并验证 JSON 消息
 * @param {string} data
 * @returns {Object|null}
 */
export function parseMessage(data) {
  try {
    const parsed = JSON.parse(data);
    return validateMessage(parsed);
  } catch {
    return null;
  }
}

// ============ 错误码常量 ============

/**
 * 服务器错误码
 */
export const ErrorCode = {
  INVALID_ID: 'invalid_id',
  INVALID_ROOM: 'invalid_room',
  INVALID_JOIN: 'invalid_join',
  DUPLICATE_ID: 'duplicate_id',
  ROOM_FULL: 'room_full',
  ROOM_LIMIT_REACHED: 'room_limit_reached',
  ROOM_MISSING: 'room_missing',
  ALREADY_JOINED: 'already_joined',
  IDENTITY_LOCKED: 'identity_locked',
  NOT_JOINED: 'not_joined',
  INVALID_TARGET: 'invalid_target',
  TARGET_NOT_FOUND: 'target_not_found',
  MEMBERSHIP_LOST: 'membership_lost',
  UNKNOWN_TYPE: 'unknown_type',
  RATE_LIMITED: 'rate_limited'
};
