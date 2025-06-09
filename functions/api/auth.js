// Phone number authentication API
import { generateAuthToken, validatePhone } from '../utils/auth.js';

export async function onRequestPost({ request, env }) {
    try {
        const { phone, action } = await request.json();
        
        if (!validatePhone(phone)) {
            return new Response(JSON.stringify({ error: '手机号格式不正确' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        switch (action) {
            case 'login':
                return await handleLogin(phone, env);
            case 'verify':
                // In a real app, you'd verify SMS code here
                return await handleVerifyAndLogin(phone, env);
            default:
                return new Response(JSON.stringify({ error: '无效的操作' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return new Response(JSON.stringify({ error: '服务器错误' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleLogin(phone, env) {
    // In a real application, you would:
    // 1. Generate and send SMS verification code
    // 2. Store the code temporarily in KV
    // For demo purposes, we'll simulate this
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code in KV (expires in 5 minutes)
    await env.AUTH_KV.put(`verify:${phone}`, verificationCode, { expirationTtl: 300 });
    
    return new Response(JSON.stringify({ 
        success: true, 
        message: '验证码已发送',
        // In production, don't return the code!
        debug_code: verificationCode 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleVerifyAndLogin(phone, env) {
    // For demo purposes, we'll skip SMS verification
    // In production, verify the SMS code here
    
    try {
        // Check if user exists
        let user = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
        
        if (!user) {
            // Create new user
            const result = await env.DB.prepare(
                'INSERT INTO users (phone) VALUES (?) RETURNING id, phone, created_at'
            ).bind(phone).first();
            user = result;
        }
        
        // Generate auth token
        const token = generateAuthToken();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Store session in KV
        await env.AUTH_KV.put(`token:${token}`, JSON.stringify({
            user_id: user.id,
            phone: user.phone,
            expires_at: expires.toISOString()
        }), { expirationTtl: 7 * 24 * 60 * 60 }); // 7 days
        
        return new Response(JSON.stringify({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: '登录失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 