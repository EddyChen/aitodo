// Todo individual item API - handles PUT and DELETE for specific todo items
import { requireAuth } from '../../utils/auth.js';

export async function onRequestPut({ request, env, params }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const todoId = params.id;
        const updateData = await request.json();
        
        // Check if user has permission to update this todo
        const todo = await env.DB.prepare(`
            SELECT * FROM todos WHERE id = ? AND (
                creator_id = ? OR id IN (
                    SELECT todo_id FROM todo_shares WHERE user_id = ? AND permission = 'write'
                )
            )
        `).bind(todoId, authResult.user_id, authResult.user_id).first();
        
        if (!todo) {
            return new Response(JSON.stringify({ error: '待办事项不存在或无权限修改' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Build update query dynamically
        const allowedFields = ['title', 'description', 'due_date', 'due_time', 'priority', 'tags', 'involved_users', 'reminder_enabled', 'reminder_method', 'completed'];
        const updates = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                if (key === 'tags' || key === 'involved_users') {
                    values.push(JSON.stringify(value));
                } else {
                    values.push(value);
                }
            }
        }
        
        if (updates.length === 0) {
            return new Response(JSON.stringify({ error: '没有有效的更新字段' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(todoId);
        
        await env.DB.prepare(`
            UPDATE todos SET ${updates.join(', ')} WHERE id = ?
        `).bind(...values).run();
        
        // Fetch the complete updated todo with sharing information
        const updatedTodo = await env.DB.prepare(`
            SELECT t.*, u.phone as creator_phone,
                   ts.permission as shared_permission,
                   CASE WHEN t.creator_id = ? THEN 'owner' ELSE 'shared' END as user_relation
            FROM todos t 
            LEFT JOIN users u ON t.creator_id = u.id
            LEFT JOIN todo_shares ts ON t.id = ts.todo_id AND ts.user_id = ?
            WHERE t.id = ?
        `).bind(authResult.user_id, authResult.user_id, todoId).first();
        
        return new Response(JSON.stringify({
            success: true,
            todo: {
                ...updatedTodo,
                tags: JSON.parse(updatedTodo.tags || '[]'),
                involved_users: JSON.parse(updatedTodo.involved_users || '[]')
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update todo error:', error);
        return new Response(JSON.stringify({ error: '更新待办事项失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete({ request, env, params }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const todoId = params.id;
        
        // Check if user is the creator
        const todo = await env.DB.prepare(
            'SELECT * FROM todos WHERE id = ? AND creator_id = ?'
        ).bind(todoId, authResult.user_id).first();
        
        if (!todo) {
            return new Response(JSON.stringify({ error: '待办事项不存在或无权限删除' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Delete todo (shares will be deleted automatically due to CASCADE)
        await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(todoId).run();
        
        return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete todo error:', error);
        return new Response(JSON.stringify({ error: '删除待办事项失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 