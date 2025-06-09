// Test OpenRouter API connection
export async function onRequestGet({ request, env }) {
    try {
        console.log('Testing OpenRouter API...');
        console.log('API Key exists:', !!env.OPENROUTER_API_KEY);
        console.log('Base URL:', env.OPENROUTER_BASE_URL);
        console.log('Model:', env.OPENROUTER_MODEL);
        
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
                messages: [
                    { role: 'user', content: 'Hello, just testing the connection. Please respond with "OK".' }
                ],
                temperature: 0.1,
                max_tokens: 100
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return new Response(JSON.stringify({ 
                error: `API Error: ${response.status}`,
                details: errorText
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const data = await response.json();
        console.log('Success response:', JSON.stringify(data, null, 2));
        
        return new Response(JSON.stringify({
            success: true,
            status: response.status,
            model: env.OPENROUTER_MODEL,
            response: data
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Test error:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 