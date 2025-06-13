// Image-powered todo parsing API
import { requireAuth } from '../utils/auth.js';

function generateImageSystemPrompt() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0];
    const dayAfterTomorrow = new Date(now.getTime() + 2*24*60*60*1000).toISOString().split('T')[0];
    
    // Calculate weekdays for better date parsing
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const daysToThisWeekend = (6 - currentDay) % 7;
    const thisWeekSaturday = new Date(now.getTime() + daysToThisWeekend * 24*60*60*1000).toISOString().split('T')[0];
    const nextWeekSaturday = new Date(now.getTime() + (daysToThisWeekend + 7) * 24*60*60*1000).toISOString().split('T')[0];
    
    return `你是一个智能图片识别助理，专门分析包含日程、预约、通知等信息的图片。请仔细识别图片中的文字内容，并从中提取待办事项相关信息。

当前时间信息：
- 今天：${today}（${['周日','周一','周二','周三','周四','周五','周六'][currentDay]}）
- 明天：${tomorrow}
- 后天：${dayAfterTomorrow}
- 本周六：${thisWeekSaturday}
- 下周六：${nextWeekSaturday}

请按照以下要求分析图片：

1. **仔细识别图片中的所有文字信息**，包括：
   - 日期信息（年月日、星期等）
   - 时间信息（具体时间、时间段等）
   - 事件名称和描述
   - 地点信息
   - 人员信息
   - 联系方式
   - 费用信息
   - 其他重要细节

2. **从识别的内容中提取待办事项**，每个事项包含：
   - title: 简洁明确的事项标题
   - date: YYYY-MM-DD格式的日期（如果没有年份，默认为当前年份）
   - time: HH:MM格式的时间（24小时制，如果是时间段取开始时间）
   - location: 地点信息（如果有）
   - description: 详细描述，包含所有相关信息
   - category: 事项分类（如：医疗、教育、娱乐、工作、生活等）
   - priority: 紧急程度（一般/紧急/非常紧急）
   - involved_people: 涉及的人员
   - reminder_enabled: 是否需要提醒（默认true）
   - reminder_method: 提醒方式（默认"系统通知"）

3. **处理不确定信息**：
   - 如果日期模糊（如"下周"），在questions中询问具体日期
   - 如果时间模糊（如"上午"、"下午"），在questions中询问具体时间
   - 如果信息不清楚或需要用户确认，在questions中列出

4. **重要注意事项**：
   - 优先提取明确的日期时间信息
   - 一张图片可能包含多个待办事项
   - 保持事项标题简洁，详细信息放在description中
   - 对于医疗预约、考试安排等重要事项，标记为紧急

**必须严格按照JSON格式返回，包含extracted（提取的事项列表）和questions（需要确认的问题）两个字段。**

返回格式示例：
{
  "extracted": [
    {
      "title": "眼科检查",
      "date": "2025-06-14", 
      "time": "13:30",
      "location": "上海市儿童医院（泸定路）3楼B区",
      "description": "陈楚或，男，8岁，眼科普通诊疗，挂号费25元，就诊卡号J504E4C04",
      "category": "医疗",
      "priority": "紧急",
      "involved_people": ["陈楚或"],
      "reminder_enabled": true,
      "reminder_method": "系统通知"
    }
  ],
  "questions": []
}`;
}

export async function onRequestPost({ request, env }) {
    // Verify authentication
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult; // Return error response
    }
    
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');
        const conversation_id = formData.get('conversation_id');
        
        if (!imageFile) {
            return new Response(JSON.stringify({ error: '请上传图片' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validate image type
        if (!imageFile.type.startsWith('image/')) {
            return new Response(JSON.stringify({ error: '请上传有效的图片文件' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate unique filename
        const imageId = generateImageId();
        const fileExtension = getFileExtension(imageFile.type);
        const fileName = `${imageId}.${fileExtension}`;
        
        // Upload image to R2 storage
        const imageBuffer = await imageFile.arrayBuffer();
        await env.IMAGE_STORAGE.put(fileName, imageBuffer, {
            httpMetadata: { contentType: imageFile.type }
        });
        
        // Convert image to base64 for API call
        const base64Image = arrayBufferToBase64(imageBuffer);
        
        // Get conversation history if exists
        let conversationHistory = [];
        if (conversation_id) {
            const historyKey = `conversation:${authResult.user_id}:${conversation_id}`;
            const historyData = await env.AUTH_KV.get(historyKey);
            if (historyData) {
                conversationHistory = JSON.parse(historyData);
            }
        }
        
        // Build messages for AI with system prompt and image
        const messages = [
            { role: 'system', content: generateImageSystemPrompt() },
            ...conversationHistory,
            { 
                role: 'user', 
                content: [
                    { type: 'text', text: '请分析这张图片中的内容，提取其中的待办事项信息。' },
                    { 
                        type: 'image_url', 
                        image_url: { url: `data:${imageFile.type};base64,${base64Image}` }
                    }
                ]
            }
        ];
        
        // Call OpenRouter API with vision model
        const aiResponse = await callOpenRouterVision(messages, env);
        
        if (!aiResponse.success) {
            throw new Error(aiResponse.error);
        }
        
        // Log the raw AI response for debugging
        console.log('AI raw response:', aiResponse.content);
        
        let parsedResponse;
        try {
            // Clean up the response - remove markdown code blocks if present
            let cleanContent = aiResponse.content.trim();
            if (cleanContent.startsWith('```json') && cleanContent.endsWith('```')) {
                cleanContent = cleanContent.slice(7, -3).trim(); // Remove ```json and ```
            } else if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
                cleanContent = cleanContent.slice(3, -3).trim(); // Remove ``` and ```
            }
            
            console.log('Cleaned AI response:', cleanContent);
            parsedResponse = JSON.parse(cleanContent);
        } catch (jsonError) {
            console.error('JSON parsing failed for response:', aiResponse.content);
            throw new Error(`AI返回的格式无效: ${jsonError.message}`);
        }
        
        // Update conversation history
        const newConversationId = conversation_id || generateConversationId();
        conversationHistory.push(
            { role: 'user', content: '用户上传了一张图片进行分析' },
            { role: 'assistant', content: aiResponse.content }
        );
        
        // Keep only last 10 messages to avoid token limits
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }
        
        // Store updated conversation
        const historyKey = `conversation:${authResult.user_id}:${newConversationId}`;
        await env.AUTH_KV.put(historyKey, JSON.stringify(conversationHistory), { expirationTtl: 3600 }); // 1 hour
        
        return new Response(JSON.stringify({
            success: true,
            conversation_id: newConversationId,
            image_id: imageId,
            image_url: fileName,
            ...parsedResponse
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Image Parser error:', error);
        return new Response(JSON.stringify({ error: '图片解析失败，请重试' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function callOpenRouterVision(messages, env) {
    try {
        console.log('Calling OpenRouter Vision with model:', env.MULTI_MODEL_NAME);
        
        const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://todo.chenrf.top',
                'X-Title': 'AI Todo Assistant - Image'
            },
            body: JSON.stringify({
                model: env.MULTI_MODEL_NAME,
                messages: messages,
                temperature: 0.1,
                max_tokens: 4000
            })
        });
        
        console.log('OpenRouter Vision response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter Vision error response:', errorText);
            throw new Error(`OpenRouter Vision API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('OpenRouter Vision response data:', JSON.stringify(data, null, 2));
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from AI Vision');
        }
        
        const content = data.choices[0].message.content;
        console.log('AI Vision content length:', content ? content.length : 0);
        
        return {
            success: true,
            content: content
        };
        
    } catch (error) {
        console.error('OpenRouter Vision API error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function generateImageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateConversationId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFileExtension(mimeType) {
    const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg', 
        'image/png': 'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heif'
    };
    return mimeToExt[mimeType] || 'jpg';
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
} 