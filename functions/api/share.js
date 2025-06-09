// Todo sharing API
import { requireAuth } from '../utils/auth.js';

export async function onRequestPost({ request, env }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const { todo_id, user_id, permission = 'read' } = await request.json();
        
        if (!todo_id || !user_id) {
            return new Response(JSON.stringify({ error: '缺少必要参数' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Check if user is the creator of the todo
        const todo = await env.DB.prepare(
            'SELECT * FROM todos WHERE id = ? AND creator_id = ?'
        ).bind(todo_id, authResult.user_id).first();
        
        if (!todo) {
            return new Response(JSON.stringify({ error: '待办事项不存在或无权限分享' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Check if target user exists
        const targetUser = await env.DB.prepare(
            'SELECT id, phone FROM users WHERE id = ?'
        ).bind(user_id).first();
        
        if (!targetUser) {
            return new Response(JSON.stringify({ error: '目标用户不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Create or update share
        await env.DB.prepare(`
            INSERT INTO todo_shares (todo_id, user_id, permission)
            VALUES (?, ?, ?)
            ON CONFLICT(todo_id, user_id) 
            DO UPDATE SET permission = ?, updated_at = CURRENT_TIMESTAMP
        `).bind(todo_id, user_id, permission, permission).run();
        
        return new Response(JSON.stringify({
            success: true,
            message: `已与 ${targetUser.phone} 分享待办事项`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Share todo error:', error);
        return new Response(JSON.stringify({ error: '分享失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete({ request, env }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const url = new URL(request.url);
        const todoId = url.searchParams.get('todo_id');
        const userId = url.searchParams.get('user_id');
        
        if (!todoId || !userId) {
            return new Response(JSON.stringify({ error: '缺少必要参数' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Check if user is the creator of the todo
        const todo = await env.DB.prepare(
            'SELECT * FROM todos WHERE id = ? AND creator_id = ?'
        ).bind(todoId, authResult.user_id).first();
        
        if (!todo) {
            return new Response(JSON.stringify({ error: '待办事项不存在或无权限操作' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Remove share
        await env.DB.prepare(
            'DELETE FROM todo_shares WHERE todo_id = ? AND user_id = ?'
        ).bind(todoId, userId).run();
        
        return new Response(JSON.stringify({
            success: true,
            message: '已取消分享'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Unshare todo error:', error);
        return new Response(JSON.stringify({ error: '取消分享失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 