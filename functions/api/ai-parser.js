// AI-powered todo parsing API
import { requireAuth } from '../utils/auth.js';

function generateSystemPrompt() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0];
    const dayAfterTomorrow = new Date(now.getTime() + 2*24*60*60*1000).toISOString().split('T')[0];
    
    return `你是一个智能待办事项助理。用户会用自然语言描述他们的待办事项，你需要从中提取以下信息：

1. 日期 (due_date): YYYY-MM-DD格式，如果没有明确指定，根据上下文推断
   - "今天"：${today}
   - "明天"：${tomorrow}
   - "后天"：${dayAfterTomorrow}
   - 当前日期：${today}
2. 时间 (due_time): HH:MM格式，24小时制
3. 主题 (title): 简洁的待办事项标题
4. 具体描述 (description): 详细描述
5. 涉及人员 (involved_people): 提到的其他人的姓名或称呼
6. 是否提醒 (reminder_enabled): true/false
7. 提醒方式 (reminder_method): 如短信、系统通知等
8. 紧急程度 (priority): 一般/紧急/非常紧急
9. 场景标签 (tags): 相关的标签，如工作、生活、学习等

如果某些信息缺失或不清楚，你需要：
1. 对于常见缺失信息，直接在extracted中提供默认值：
   - 涉及人员 (involved_people): 默认为空数组 []（表示仅创建人自己）
   - 是否提醒 (reminder_enabled): 默认为 true
   - 提醒方式 (reminder_method): 默认为 "系统通知"
   - 紧急程度 (priority): 默认为 "一般"
2. extracted字段必须包含所有9个字段，缺失的字段用默认值补充
3. 只对真正重要且无法推断的信息进行询问
4. 尽量减少询问，提供智能的默认值

**重要：必须严格以有效的JSON格式返回，不能包含任何其他文本。返回的JSON必须包含extracted（已提取信息）和questions（需要询问的问题）两个字段。extracted字段必须包含所有9个字段：due_date, due_time, title, description, involved_people, reminder_enabled, reminder_method, priority, tags。

示例格式（包含所有字段和默认值）：
{
  "extracted": {
    "title": "开会",
    "due_date": "${tomorrow}",
    "due_time": "14:00",
    "description": "团队周会",
    "involved_people": [],
    "reminder_enabled": true,
    "reminder_method": "系统通知",
    "priority": "一般",
    "tags": ["工作"]
  },
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
        const { text, conversation_id } = await request.json();
        
        if (!text || text.trim().length === 0) {
            return new Response(JSON.stringify({ error: '请输入待办事项内容' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get conversation history if exists
        let conversationHistory = [];
        if (conversation_id) {
            const historyKey = `conversation:${authResult.user_id}:${conversation_id}`;
            const historyData = await env.AUTH_KV.get(historyKey);
            if (historyData) {
                conversationHistory = JSON.parse(historyData);
            }
        }
        
        // Build messages for AI with dynamic system prompt
        const messages = [
            { role: 'system', content: generateSystemPrompt() },
            ...conversationHistory,
            { role: 'user', content: text }
        ];
        
        // Call OpenRouter API
        const aiResponse = await callOpenRouter(messages, env);
        
        if (!aiResponse.success) {
            throw new Error(aiResponse.error);
        }
        
        // Log the raw AI response for debugging
        console.log('AI raw response:', aiResponse.content);
        
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse.content);
        } catch (jsonError) {
            console.error('JSON parsing failed for response:', aiResponse.content);
            throw new Error(`AI返回的格式无效: ${jsonError.message}`);
        }
        
        // Update conversation history
        const newConversationId = conversation_id || generateConversationId();
        conversationHistory.push(
            { role: 'user', content: text },
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
            ...parsedResponse
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('AI Parser error:', error);
        return new Response(JSON.stringify({ error: '解析失败，请重试' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function callOpenRouter(messages, env) {
    try {
        console.log('Calling OpenRouter with model:', env.OPENROUTER_MODEL);
        console.log('Messages:', JSON.stringify(messages, null, 2));
        
        const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-todo-assistant.pages.dev',
                'X-Title': 'AI Todo Assistant'
            },
            body: JSON.stringify({
                model: env.OPENROUTER_MODEL,
                messages: messages,
                temperature: 0.1,
                max_tokens: 3000
            })
        });
        
        console.log('OpenRouter response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error response:', errorText);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('OpenRouter response data:', JSON.stringify(data, null, 2));
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from AI');
        }
        
        const content = data.choices[0].message.content;
        console.log('AI content length:', content ? content.length : 0);
        
        return {
            success: true,
            content: content
        };
        
    } catch (error) {
        console.error('OpenRouter API error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function generateConversationId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
} 