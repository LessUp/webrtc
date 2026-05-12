package signal

// ProtocolError 表示信令协议级别的错误，包含错误码和可读消息。
// 错误码用于客户端程序化处理，消息用于人类阅读。
type ProtocolError struct {
	Code    string
	Message string
}

func (e *ProtocolError) Error() string { return e.Message }

// 信令协议错误定义
// 这些错误码与 openspec/specs/signaling/spec.md 中定义的错误码保持同步。
var (
	// 客户端身份相关错误
	ErrInvalidID      = &ProtocolError{Code: "invalid_id", Message: "invalid client id"}
	ErrDuplicateID    = &ProtocolError{Code: "duplicate_id", Message: "client id already exists in room"}
	ErrIdentityLocked = &ProtocolError{Code: "identity_locked", Message: "connection identity is immutable"}

	// 房间相关错误
	ErrInvalidRoom      = &ProtocolError{Code: "invalid_room", Message: "invalid room name"}
	ErrRoomFull         = &ProtocolError{Code: "room_full", Message: "room is full"}
	ErrRoomLimitReached = &ProtocolError{Code: "room_limit_reached", Message: "room limit reached"}
	ErrRoomMissing      = &ProtocolError{Code: "room_missing", Message: "room no longer exists"}

	// 加入相关错误
	ErrInvalidJoin   = &ProtocolError{Code: "invalid_join", Message: "room and id are required"}
	ErrAlreadyJoined = &ProtocolError{Code: "already_joined", Message: "leave the current room before joining another"}
	ErrNotJoined     = &ProtocolError{Code: "not_joined", Message: "join a room first"}

	// 消息路由相关错误
	ErrInvalidTarget  = &ProtocolError{Code: "invalid_target", Message: "invalid target client"}
	ErrTargetNotFound = &ProtocolError{Code: "target_not_found", Message: "target client is not in the room"}
	ErrMembershipLost = &ProtocolError{Code: "membership_lost", Message: "client is no longer registered in room"}

	// 消息处理相关错误
	ErrUnknownType = &ProtocolError{Code: "unknown_type", Message: "unsupported message type"}
	ErrRateLimited = &ProtocolError{Code: "rate_limited", Message: "too many messages, please slow down"}
)
