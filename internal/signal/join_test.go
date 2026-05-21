package signal

import (
	"testing"
)

func TestNormalizeClientID(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		maxLen   int
		expected string
	}{
		// 有效情况
		{"simple alphanumeric", "user123", 64, "user123"},
		{"with hyphen", "user-123", 64, "user-123"},
		{"with underscore", "user_123", 64, "user_123"},
		{"uppercase", "USER123", 64, "USER123"},
		{"mixed case", "User_123-ABC", 64, "User_123-ABC"},
		{"only numbers", "123456", 64, "123456"},
		{"single char", "a", 64, "a"},
		{"exact max length", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 62, "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"},

		// 无效情况 - 应返回空字符串
		{"empty string", "", 64, ""},
		{"only spaces", "   ", 64, ""},
		{"with space", "user 123", 64, ""},
		{"with special char @", "user@123", 64, ""},
		{"with special char !", "user!123", 64, ""},
		{"with special char #", "user#123", 64, ""},
		{"with special char $", "user$123", 64, ""},
		{"with special char %", "user%123", 64, ""},
		{"with special char &", "user&123", 64, ""},
		{"with special char *", "user*123", 64, ""},
		{"with dot", "user.123", 64, ""},
		{"with plus", "user+123", 64, ""},
		{"with equals", "user=123", 64, ""},
		{"with slash", "user/123", 64, ""},
		{"with backslash", "user\\123", 64, ""},
		{"with colon", "user:123", 64, ""},
		{"with semicolon", "user;123", 64, ""},
		{"with comma", "user,123", 64, ""},
		{"with question", "user?123", 64, ""},
		{"with brackets", "user[123]", 64, ""},
		{"with parentheses", "user(123)", 64, ""},
		{"with braces", "user{123}", 64, ""},
		{"with angle brackets", "user<123>", 64, ""},
		{"with pipe", "user|123", 64, ""},
		{"with tilde", "user~123", 64, ""},
		{"with backtick", "user`123", 64, ""},
		{"with quote", "user'123", 64, ""},
		{"with double quote", "user\"123", 64, ""},
		{"exceeds max length", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZx", 62, ""},
		{"control char tab", "user\t123", 64, ""},
		{"control char newline", "user\n123", 64, ""},
		{"unicode chinese", "用户123", 64, ""},
		{"unicode emoji", "user😀123", 64, ""},

		// 边界情况
		{"leading spaces", "  user123", 64, "user123"},
		{"trailing spaces", "user123  ", 64, "user123"},
		{"both sides spaces", "  user123  ", 64, "user123"},
		{"max length 1", "a", 1, "a"},
		{"exceeds max length 1", "ab", 1, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeClientID(tt.input, tt.maxLen)
			if got != tt.expected {
				t.Errorf("normalizeClientID(%q, %d) = %q, want %q", tt.input, tt.maxLen, got, tt.expected)
			}
		})
	}
}

func TestNormalizeRoomName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		maxLen   int
		expected string
	}{
		// 有效情况
		{"simple room", "room1", 64, "room1"},
		{"with space", "room 1", 64, "room 1"},
		{"with hyphen", "room-1", 64, "room-1"},
		{"with underscore", "room_1", 64, "room_1"},
		{"with dot", "room.1", 64, "room.1"},
		{"chinese characters", "房间一", 64, "房间一"},
		{"mixed language", "团队 room.1", 64, "团队 room.1"},
		{"single char", "a", 64, "a"},
		{"exact max length", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 62, "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"},
		{"special chars allowed", "room-1_v2.0", 64, "room-1_v2.0"},

		// 无效情况 - 应返回空字符串
		{"empty string", "", 64, ""},
		{"only spaces", "   ", 64, ""},
		{"exceeds max length", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZx", 62, ""},
		{"control char tab", "room\t1", 64, ""},
		{"control char newline", "room\n1", 64, ""},
		{"control char carriage return", "room\r1", 64, ""},
		{"control char null", "room\x001", 64, ""},
		{"control char bell", "room\x071", 64, ""},
		{"control char escape", "room\x1b1", 64, ""},

		// 边界情况
		{"leading spaces", "  room1", 64, "room1"},
		{"trailing spaces", "room1  ", 64, "room1"},
		{"both sides spaces", "  room1  ", 64, "room1"},
		{"max length 1", "a", 1, "a"},
		{"exceeds max length 1", "ab", 1, ""},
		{"emoji allowed", "room😀1", 64, "room😀1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeRoomName(tt.input, tt.maxLen)
			if got != tt.expected {
				t.Errorf("normalizeRoomName(%q, %d) = %q, want %q", tt.input, tt.maxLen, got, tt.expected)
			}
		})
	}
}

func TestNormalizeClientIDConsistency(t *testing.T) {
	// 测试多次调用结果一致
	input := "user_123-ABC"
	for i := 0; i < 10; i++ {
		got := normalizeClientID(input, 64)
		if got != input {
			t.Errorf("normalizeClientID inconsistent on iteration %d: got %q, want %q", i, got, input)
		}
	}
}

func TestNormalizeRoomNameConsistency(t *testing.T) {
	// 测试多次调用结果一致
	input := "团队 room.1"
	for i := 0; i < 10; i++ {
		got := normalizeRoomName(input, 64)
		if got != input {
			t.Errorf("normalizeRoomName inconsistent on iteration %d: got %q, want %q", i, got, input)
		}
	}
}

func TestNormalizeClientIDWithMaxClientIDLength(t *testing.T) {
	// 测试使用实际常量 MaxClientIDLength
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"valid id", "user123", "user123"},
		{"too long", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", ""}, // 65 chars
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeClientID(tt.input, MaxClientIDLength)
			if got != tt.expected {
				t.Errorf("normalizeClientID(%q, MaxClientIDLength) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestNormalizeRoomNameWithMaxRoomIDLength(t *testing.T) {
	// 测试使用实际常量 MaxRoomIDLength
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"valid room", "room1", "room1"},
		{"too long", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", ""}, // 65 chars
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeRoomName(tt.input, MaxRoomIDLength)
			if got != tt.expected {
				t.Errorf("normalizeRoomName(%q, MaxRoomIDLength) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}
