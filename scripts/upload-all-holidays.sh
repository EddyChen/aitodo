#!/bin/bash

# 批量上传节假日数据到 KV 存储
# 使用方法: ./scripts/upload-all-holidays.sh

echo "🚀 开始上传节假日数据到 KV 存储..."

# 上传 2024 年数据
echo "📅 上传 2024 年节假日数据..."
HOLIDAY_DATA_2024=$(node scripts/import-holidays.js 2024)
if [ $? -eq 0 ]; then
    npx wrangler kv:key put --binding=AI_TODO_KV "holidays_2024" "$HOLIDAY_DATA_2024"
    echo "✅ 2024 年数据上传完成"
else
    echo "❌ 2024 年数据处理失败"
    exit 1
fi

# 上传 2025 年数据
echo "📅 上传 2025 年节假日数据..."
HOLIDAY_DATA_2025=$(node scripts/import-holidays.js 2025)
if [ $? -eq 0 ]; then
    npx wrangler kv:key put --binding=AI_TODO_KV "holidays_2025" "$HOLIDAY_DATA_2025"
    echo "✅ 2025 年数据上传完成"
else
    echo "❌ 2025 年数据处理失败"
    exit 1
fi

echo "🎉 所有节假日数据上传完成！"
echo ""
echo "📋 可以使用以下命令查看 KV 中的数据："
echo "npx wrangler kv:key get --binding=AI_TODO_KV holidays_2024"
echo "npx wrangler kv:key get --binding=AI_TODO_KV holidays_2025" 