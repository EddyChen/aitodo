// User search and management API for sharing
import { requireAuth } from '../utils/auth.js';

export async function onRequestGet({ request, env }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q'); // Search query (phone number)
        
        if (!query || query.length < 3) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: '搜索关键词至少需要3个字符' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Search users by phone (partial match)
        const users = await env.DB.prepare(`
            SELECT id, phone, name 
            FROM users 
            WHERE phone LIKE ? AND id != ?
            LIMIT 10
        `).bind(`%${query}%`, authResult.user_id).all();
        
        return new Response(JSON.stringify({
            success: true,
            users: users.results
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Search users error:', error);
        return new Response(JSON.stringify({ error: '搜索用户失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 