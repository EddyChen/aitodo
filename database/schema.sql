-- Users table for phone number authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Todos table for todo items
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    priority VARCHAR(20) DEFAULT '一般', -- 一般、紧急、非常紧急
    tags TEXT, -- JSON array of tags
    involved_users TEXT, -- JSON array of user IDs
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_method VARCHAR(50), -- SMS, 系统通知等
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Todo sharing table for multi-user access
CREATE TABLE IF NOT EXISTS todo_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission VARCHAR(20) DEFAULT 'read', -- read, write
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(todo_id, user_id)
);

-- User sessions/tokens for KV storage reference
-- KV will store: auth_token -> { user_id, phone, expires_at }

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_creator_date ON todos(creator_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todo_shares_user ON todo_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone); 