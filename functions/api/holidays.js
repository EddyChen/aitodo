export async function onRequestGet({ request, env }) {
  // 允许跨域请求
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!year && !month) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: year or month' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 确定要查询的年份
    const targetYear = year || month.substring(0, 4);
    const cacheKey = `holidays_${targetYear}`;
    
    console.log('Fetching holiday data for year:', targetYear);

    // 尝试从 KV 获取缓存的节假日数据
    let holidayData = null;
    try {
      const cachedData = await env.AI_TODO_KV.get(cacheKey);
      if (cachedData) {
        holidayData = JSON.parse(cachedData);
        console.log(`Found holiday data in KV for ${targetYear}, ${Object.keys(holidayData.holidays).length} special dates`);
      }
    } catch (error) {
      console.log('KV not available, trying remote fetch:', error.message);
    }

    // 如果KV中没有数据，尝试从GitHub获取
    if (!holidayData) {
      try {
        const githubUrl = `https://raw.githubusercontent.com/NateScarlet/holiday-cn/refs/heads/master/${targetYear}.json`;
        console.log(`Fetching holiday data from GitHub: ${githubUrl}`);
        
        const response = await fetch(githubUrl);
        if (response.ok) {
          const data = await response.json();
          
          // 转换为我们需要的格式
          const holidayMap = {};
          data.days.forEach(day => {
            holidayMap[day.date] = {
              name: day.name,
              isOffDay: day.isOffDay
            };
          });
          
          holidayData = {
            year: data.year,
            holidays: holidayMap,
            updated: new Date().toISOString(),
            source: 'github'
          };
          
          console.log(`Fetched holiday data from GitHub for ${targetYear}, ${Object.keys(holidayData.holidays).length} special dates`);
          
          // 尝试缓存到KV（如果可用）
          try {
            await env.AI_TODO_KV.put(cacheKey, JSON.stringify(holidayData), {
              expirationTtl: 7 * 24 * 60 * 60 // 7天缓存
            });
            console.log(`Cached holiday data to KV for ${targetYear}`);
          } catch (kvError) {
            console.log('Failed to cache to KV:', kvError.message);
          }
        } else {
          console.log(`GitHub fetch failed: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError) {
        console.log('Failed to fetch from GitHub:', fetchError.message);
      }
    }

    // 如果GitHub获取失败，使用内置的fallback数据
    if (!holidayData) {
      console.log(`Using fallback holiday data for ${targetYear}`);
      
      // 精简的fallback数据，只包含主要节假日
      const basicHolidayData = {
        '2024': {
          year: 2024,
          holidays: {
            '2024-01-01': { name: '元旦', isOffDay: true },
            '2024-02-04': { name: '春节调休', isOffDay: false },
            '2024-02-10': { name: '春节', isOffDay: true },
            '2024-02-11': { name: '春节', isOffDay: true },
            '2024-02-12': { name: '春节', isOffDay: true },
            '2024-02-13': { name: '春节', isOffDay: true },
            '2024-02-14': { name: '春节', isOffDay: true },
            '2024-02-15': { name: '春节', isOffDay: true },
            '2024-02-16': { name: '春节', isOffDay: true },
            '2024-02-17': { name: '春节', isOffDay: true },
            '2024-02-18': { name: '春节调休', isOffDay: false },
            '2024-04-04': { name: '清明节', isOffDay: true },
            '2024-04-05': { name: '清明节', isOffDay: true },
            '2024-04-06': { name: '清明节', isOffDay: true },
            '2024-04-07': { name: '清明节调休', isOffDay: false },
            '2024-04-28': { name: '劳动节调休', isOffDay: false },
            '2024-05-01': { name: '劳动节', isOffDay: true },
            '2024-05-02': { name: '劳动节', isOffDay: true },
            '2024-05-03': { name: '劳动节', isOffDay: true },
            '2024-05-04': { name: '劳动节', isOffDay: true },
            '2024-05-05': { name: '劳动节', isOffDay: true },
            '2024-05-11': { name: '劳动节调休', isOffDay: false },
            '2024-06-10': { name: '端午节', isOffDay: true },
            '2024-09-14': { name: '中秋节调休', isOffDay: false },
            '2024-09-15': { name: '中秋节', isOffDay: true },
            '2024-09-16': { name: '中秋节', isOffDay: true },
            '2024-09-17': { name: '中秋节', isOffDay: true },
            '2024-09-29': { name: '国庆节调休', isOffDay: false },
            '2024-10-01': { name: '国庆节', isOffDay: true },
            '2024-10-02': { name: '国庆节', isOffDay: true },
            '2024-10-03': { name: '国庆节', isOffDay: true },
            '2024-10-04': { name: '国庆节', isOffDay: true },
            '2024-10-05': { name: '国庆节', isOffDay: true },
            '2024-10-06': { name: '国庆节', isOffDay: true },
            '2024-10-07': { name: '国庆节', isOffDay: true },
            '2024-10-12': { name: '国庆节调休', isOffDay: false }
          },
          updated: new Date().toISOString(),
          source: 'fallback'
        },
        '2025': {
          year: 2025,
          holidays: {
            '2025-01-01': { name: '元旦', isOffDay: true },
            '2025-01-26': { name: '春节调休', isOffDay: false },
            '2025-01-28': { name: '春节', isOffDay: true },
            '2025-01-29': { name: '春节', isOffDay: true },
            '2025-01-30': { name: '春节', isOffDay: true },
            '2025-01-31': { name: '春节', isOffDay: true },
            '2025-02-01': { name: '春节', isOffDay: true },
            '2025-02-02': { name: '春节', isOffDay: true },
            '2025-02-03': { name: '春节', isOffDay: true },
            '2025-02-04': { name: '春节', isOffDay: true },
            '2025-02-08': { name: '春节调休', isOffDay: false },
            '2025-04-04': { name: '清明节', isOffDay: true },
            '2025-04-05': { name: '清明节', isOffDay: true },
            '2025-04-06': { name: '清明节', isOffDay: true },
            '2025-04-27': { name: '劳动节调休', isOffDay: false },
            '2025-05-01': { name: '劳动节', isOffDay: true },
            '2025-05-02': { name: '劳动节', isOffDay: true },
            '2025-05-03': { name: '劳动节', isOffDay: true },
            '2025-05-04': { name: '劳动节', isOffDay: true },
            '2025-05-05': { name: '劳动节', isOffDay: true },
            '2025-05-31': { name: '端午节', isOffDay: true },
            '2025-06-01': { name: '端午节', isOffDay: true },
            '2025-06-02': { name: '端午节', isOffDay: true },
            '2025-09-28': { name: '国庆节调休', isOffDay: false },
            '2025-10-01': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-02': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-03': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-04': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-05': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-06': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-07': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-08': { name: '国庆节、中秋节', isOffDay: true },
            '2025-10-11': { name: '国庆节调休', isOffDay: false }
          },
          updated: new Date().toISOString(),
          source: 'fallback'
        }
      };

      holidayData = basicHolidayData[targetYear];
      if (holidayData) {
        console.log(`Using fallback holiday data for ${targetYear}, ${Object.keys(holidayData.holidays).length} special dates`);
      }
    }

    if (!holidayData) {
      return new Response(JSON.stringify({ 
        error: `No holiday data found for year ${targetYear}`,
        hint: `Supported years: 2024, 2025`,
        sources: ['KV cache', 'GitHub: holiday-cn', 'fallback data']
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 转换为前端期望的格式
    const responseData = {
      year: parseInt(targetYear),
      holidays: holidayData.holidays,
      updated: holidayData.updated,
      source: holidayData.source || 'unknown'
    };

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Holiday API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch holiday data',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestOptions({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return new Response(null, { headers: corsHeaders });
} 