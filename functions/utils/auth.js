// Authentication utility functions

export function validatePhone(phone) {
    // Simple Chinese phone number validation
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

export function generateAuthToken() {
    // Generate a secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyToken(token, env) {
    try {
        const sessionData = await env.AUTH_KV.get(`token:${token}`);
        if (!sessionData) {
            return null;
        }
        
        const session = JSON.parse(sessionData);
        const now = new Date();
        const expires = new Date(session.expires_at);
        
        if (now > expires) {
            // Token expired, clean up
            await env.AUTH_KV.delete(`token:${token}`);
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

export async function requireAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未授权访问' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const token = authHeader.substring(7);
    const session = await verifyToken(token, env);
    
    if (!session) {
        return new Response(JSON.stringify({ error: '登录已过期' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return { user_id: session.user_id, phone: session.phone };
} 