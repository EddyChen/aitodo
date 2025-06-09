// Todo CRUD API
import { requireAuth } from '../utils/auth.js';

export async function onRequestGet({ request, env, params }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const url = new URL(request.url);
        const date = url.searchParams.get('date'); // YYYY-MM-DD format
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT t.*, u.phone as creator_phone 
            FROM todos t 
            LEFT JOIN users u ON t.creator_id = u.id
            WHERE (t.creator_id = ? OR t.id IN (
                SELECT todo_id FROM todo_shares WHERE user_id = ?
            ))
        `;
        let params = [authResult.user_id, authResult.user_id];
        
        if (date) {
            query += ' AND t.due_date = ?';
            params.push(date);
        }
        
        query += ' ORDER BY t.priority DESC, t.due_date ASC, t.due_time ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const todos = await env.DB.prepare(query).bind(...params).all();
        
        // Process todos to parse JSON fields
        const processedTodos = todos.results.map(todo => ({
            ...todo,
            tags: todo.tags ? JSON.parse(todo.tags) : [],
            involved_users: todo.involved_users ? JSON.parse(todo.involved_users) : [],
            priority_order: getPriorityOrder(todo.priority)
        }));
        
        return new Response(JSON.stringify({
            success: true,
            todos: processedTodos,
            pagination: {
                page,
                limit,
                total: todos.results.length
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get todos error:', error);
        return new Response(JSON.stringify({ error: '获取待办事项失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost({ request, env }) {
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }
    
    try {
        const todoData = await request.json();
        const {
            title,
            description,
            due_date,
            due_time,
            priority = '一般',
            tags = [],
            involved_users = [],
            reminder_enabled = false,
            reminder_method
        } = todoData;
        
        if (!title || title.trim().length === 0) {
            return new Response(JSON.stringify({ error: '待办事项标题不能为空' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validate priority
        if (!['一般', '紧急', '非常紧急'].includes(priority)) {
            return new Response(JSON.stringify({ error: '无效的紧急程度' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const result = await env.DB.prepare(`
            INSERT INTO todos (
                creator_id, title, description, due_date, due_time, 
                priority, tags, involved_users, reminder_enabled, reminder_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        `).bind(
            authResult.user_id,
            title.trim(),
            description || null,
            due_date || null,
            due_time || null,
            priority,
            JSON.stringify(tags),
            JSON.stringify(involved_users),
            reminder_enabled,
            reminder_method || null
        ).first();
        
        // If there are involved users, create sharing records
        if (involved_users.length > 0) {
            for (const userId of involved_users) {
                try {
                    await env.DB.prepare(`
                        INSERT INTO todo_shares (todo_id, user_id, permission)
                        VALUES (?, ?, 'read')
                    `).bind(result.id, userId).run();
                } catch (err) {
                    console.error('Error creating share record:', err);
                    // Continue even if sharing fails
                }
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            todo: {
                ...result,
                tags: JSON.parse(result.tags),
                involved_users: JSON.parse(result.involved_users)
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create todo error:', error);
        return new Response(JSON.stringify({ error: '创建待办事项失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
        
        const result = await env.DB.prepare(`
            UPDATE todos SET ${updates.join(', ')} WHERE id = ? RETURNING *
        `).bind(...values).first();
        
        return new Response(JSON.stringify({
            success: true,
            todo: {
                ...result,
                tags: JSON.parse(result.tags || '[]'),
                involved_users: JSON.parse(result.involved_users || '[]')
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

function getPriorityOrder(priority) {
    switch (priority) {
        case '非常紧急': return 3;
        case '紧急': return 2;
        case '一般': return 1;
        default: return 1;
    }
} 