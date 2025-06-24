#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 导入节假日数据到 KV 存储
 * 使用方法：
 * npx wrangler kv:key put --binding=AI_TODO_KV "holidays_2025" "$(node scripts/import-holidays.js 2025)"
 * npx wrangler kv:key put --binding=AI_TODO_KV "holidays_2024" "$(node scripts/import-holidays.js 2024)"
 */

function main() {
  const year = process.argv[2];
  
  if (!year) {
    console.error('请指定年份，例如: node scripts/import-holidays.js 2025');
    process.exit(1);
  }
  
  const jsonFile = path.join(__dirname, '..', 'assets', `${year}.json`);
  
  if (!fs.existsSync(jsonFile)) {
    console.error(`文件不存在: ${jsonFile}`);
    process.exit(1);
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    // 转换为更简洁的格式，按日期索引
    const holidayMap = {};
    
    data.days.forEach(day => {
      holidayMap[day.date] = {
        name: day.name,
        isOffDay: day.isOffDay
      };
    });
    
    const result = {
      year: data.year,
      holidays: holidayMap,
      updated: new Date().toISOString()
    };
    
    // 输出JSON字符串供wrangler使用
    console.log(JSON.stringify(result));
    
  } catch (error) {
    console.error('解析JSON文件失败:', error.message);
    process.exit(1);
  }
}

main(); 