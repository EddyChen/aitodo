export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    
    if (!year && !month) {
      return new Response(JSON.stringify({ error: 'Year or month parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate cache key
    const cacheKey = year ? `holidays_year_${year}` : `holidays_month_${month}`;
    
    // Try to get from cache first
    let cachedData = null;
    try {
      cachedData = await env.AI_TODO_KV.get(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Check if cache is still valid (cache for 7 days)
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          console.log('Returning cached holiday data');
          return new Response(JSON.stringify({
            success: true,
            data: parsed.data,
            source: 'cache'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (error) {
      console.log('Cache retrieval failed:', error);
    }

    // If not in cache or cache expired, fetch from API
    const apiUrl = year 
      ? `https://api.apihubs.cn/holiday/get?size=500&year=${year}`
      : `https://api.apihubs.cn/holiday/get?size=500&month=${month}`;
    
    console.log('Fetching holiday data from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'AI-Todo-Assistant/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Holiday API returned ${response.status}: ${response.statusText}`);
    }

    const holidayData = await response.json();
    
    // Cache the result
    try {
      const cacheValue = {
        data: holidayData,
        timestamp: Date.now()
      };
      await env.AI_TODO_KV.put(cacheKey, JSON.stringify(cacheValue));
      console.log('Holiday data cached successfully');
    } catch (error) {
      console.log('Failed to cache holiday data:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      data: holidayData,
      source: 'api'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Holiday API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch holiday data',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
} 