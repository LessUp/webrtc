#!/bin/bash
#
# check-protocol-sync.sh - 验证 YAML、Go、JS 三处协议定义的一致性
#
# 用法: ./scripts/check-protocol-sync.sh
# 退出码: 0 表示一致，1 表示有差异
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

YAML_FILE="$ROOT_DIR/openspec/specs/api/signaling.yaml"
GO_ERRORS_FILE="$ROOT_DIR/internal/signal/errors.go"
GO_MESSAGE_FILE="$ROOT_DIR/internal/signal/message.go"
JS_MESSAGE_FILE="$ROOT_DIR/web/src/protocol/message.js"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "检查协议定义一致性..."
echo ""

# 从 YAML 提取消息类型 enum（Message schema 下的 type.enum，行 53-64）
extract_yaml_message_types() {
    sed -n '53,64p' "$YAML_FILE" | \
        grep -E '^\s+-\s+\w+' | \
        sed 's/^\s*-\s*//' | sort -u
}

# 从 YAML 提取错误码 enum（Error schema 下的 code.enum，行 95-110）
extract_yaml_error_codes() {
    sed -n '95,110p' "$YAML_FILE" | \
        grep -E '^\s+-\s+\w+' | \
        sed 's/^\s*-\s*//' | sort -u
}

# 从 Go 提取消息类型常量
extract_go_message_types() {
    grep -oE 'MsgType\w+\s*=' "$GO_MESSAGE_FILE" | \
        sed 's/MsgType\(\w\+\)\s*=.*/\1/' | \
        # 转换 CamelCase 到 snake_case: Join -> join, RoomMembers -> room_members
        while read word; do
            echo "$word" | sed -E 's/([A-Z])/_\L\1/g' | sed 's/^_//'
        done | sort -u
}

# 从 Go 提取错误码
extract_go_error_codes() {
    grep -oE 'Err\w+\s*=' "$GO_ERRORS_FILE" | \
        sed 's/Err\(\w\+\)\s*=.*/\1/' | \
        # 转换 CamelCase 到 snake_case
        # 先处理连续大写字母（如 ID -> Id），再转换
        while read word; do
            echo "$word" | \
                sed -E 's/([A-Z])([A-Z]+)/\U\1\L\2/g' | \
                sed -E 's/([A-Z])/_\L\1/g' | \
                sed 's/^_//'
        done | sort -u
}

# 从 JS 提取错误码（值已经是 snake_case）
extract_js_error_codes() {
    # 提取 ErrorCode 对象内的值
    sed -n '/export const ErrorCode/,/^};$/p' "$JS_MESSAGE_FILE" | \
        grep -oE "'[a-z_]+'" | \
        sed "s/'//g" | sort -u
}

# 比较两个列表
compare_lists() {
    local name="$1"
    local list1="$2"
    local list2="$3"

    if [ -z "$list1" ] && [ -z "$list2" ]; then
        echo -e "${GREEN}✓ $name 一致（均为空）${NC}"
        return 0
    fi

    if [ -z "$list1" ] || [ -z "$list2" ]; then
        echo -e "${YELLOW}⊘ $name 跳过（无法提取数据）${NC}"
        echo "  YAML: $(echo "$list1" | wc -l) 项"
        echo "  代码: $(echo "$list2" | wc -l) 项"
        return 0
    fi

    local diff_output
    diff_output=$(diff <(echo "$list1") <(echo "$list2") 2>/dev/null || true)

    if [ -z "$diff_output" ]; then
        echo -e "${GREEN}✓ $name 一致${NC}"
        return 0
    else
        echo -e "${RED}✗ $name 不一致${NC}"
        echo "$diff_output" | while read -r line; do
            if [[ "$line" == "<"* ]]; then
                echo "  仅在 YAML: ${line#< }"
            elif [[ "$line" == ">"* ]]; then
                echo "  仅在代码: ${line#> }"
            fi
        done
        return 1
    fi
}

# 主检查逻辑
errors=0

echo "=== 消息类型检查 ==="

yaml_types=$(extract_yaml_message_types)
go_types=$(extract_go_message_types)

compare_lists "YAML vs Go 消息类型" "$yaml_types" "$go_types" || ((errors++))

echo ""
echo "=== 错误码检查 ==="

yaml_codes=$(extract_yaml_error_codes)
go_codes=$(extract_go_error_codes)
js_codes=$(extract_js_error_codes)

compare_lists "YAML vs Go 错误码" "$yaml_codes" "$go_codes" || ((errors++))
compare_lists "YAML vs JS 错误码" "$yaml_codes" "$js_codes" || ((errors++))

echo ""
echo "=== 汇总 ==="

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}所有协议定义一致${NC}"
    exit 0
else
    echo -e "${RED}发现 $errors 处不一致${NC}"
    exit 1
fi
