/**
 * Tidy AI - Dedicated Memory System
 *
 * Persistent local storage using SQLite for:
 * - User profiles (facts, preferences)
 * - Conversations
 * - Messages
 * - Conversation summaries
 * - Future: Vector embeddings for semantic memory
 */

import Database from "better-sqlite3";
import { getMemoryDbPath } from "../cli/config";

// Types
export interface User {
  id: number;
  displayName: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  conversationId: number;
  summary: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: number;
  profileJson: string; // JSON string of facts/preferences
  updatedAt: string;
}

export interface ProfileFact {
  key: string;
  value: string;
  confidence?: number;
  source?: string; // e.g., "conversation-123", "user-input"
}

// Memory Manager Class
export class MemoryManager {
  private db: Database.Database;
  private isInitialized: boolean = false;

  constructor(dbPath?: string) {
    const path = dbPath || getMemoryDbPath();
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL"); // Write-ahead logging for better concurrency
    this.db.pragma("foreign_keys = ON");
  }

  /**
   * Initialize database schema
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        display_name TEXT NOT NULL DEFAULT 'User',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Conversation',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // Conversation summaries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_summaries (
        conversation_id INTEGER PRIMARY KEY,
        summary TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // User profiles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY,
        profile_json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for common queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
        ON messages(conversation_id, created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_conversations_user 
        ON conversations(user_id, updated_at DESC);
    `);

    // Create default user if none exists
    const userCount = this.db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };
    if (userCount.count === 0) {
      this.db
        .prepare("INSERT INTO users (display_name) VALUES (?)")
        .run("Default User");
    }

    this.isInitialized = true;
  }

  /**
   * Get or create default user
   */
  getDefaultUser(): User {
    this.initialize();
    return this.db
      .prepare("SELECT * FROM users ORDER BY id ASC LIMIT 1")
      .get() as User;
  }

  /**
   * Create a new conversation
   */
  createConversation(
    userId: number,
    title: string = "New Conversation"
  ): Conversation {
    this.initialize();
    const result = this.db
      .prepare(
        `
      INSERT INTO conversations (user_id, title) 
      VALUES (?, ?)
    `
      )
      .run(userId, title);

    return this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(result.lastInsertRowid) as Conversation;
  }

  /**
   * Get all conversations for a user
   */
  getUserConversations(userId: number, limit: number = 50): Conversation[] {
    this.initialize();
    return this.db
      .prepare(
        `
      SELECT * FROM conversations 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ?
    `
      )
      .all(userId, limit) as Conversation[];
  }

  /**
   * Get a specific conversation
   */
  getConversation(conversationId: number): Conversation | undefined {
    this.initialize();
    return this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(conversationId) as Conversation | undefined;
  }

  /**
   * Update conversation title
   */
  updateConversationTitle(conversationId: number, title: string): void {
    this.initialize();
    this.db
      .prepare(
        `
      UPDATE conversations 
      SET title = ?, updated_at = datetime('now') 
      WHERE id = ?
    `
      )
      .run(title, conversationId);
  }

  /**
   * Delete a conversation (cascades to messages)
   */
  deleteConversation(conversationId: number): void {
    this.initialize();
    this.db
      .prepare("DELETE FROM conversations WHERE id = ?")
      .run(conversationId);
  }

  /**
   * Append a message to a conversation
   */
  appendMessage(
    conversationId: number,
    role: "user" | "assistant" | "system",
    content: string
  ): Message {
    this.initialize();

    const result = this.db
      .prepare(
        `
      INSERT INTO messages (conversation_id, role, content) 
      VALUES (?, ?, ?)
    `
      )
      .run(conversationId, role, content);

    // Update conversation's updated_at
    this.db
      .prepare(
        `
      UPDATE conversations 
      SET updated_at = datetime('now') 
      WHERE id = ?
    `
      )
      .run(conversationId);

    return this.db
      .prepare("SELECT * FROM messages WHERE id = ?")
      .get(result.lastInsertRowid) as Message;
  }

  /**
   * Get messages for a conversation
   */
  getMessages(conversationId: number, limit: number = 100): Message[] {
    this.initialize();
    return this.db
      .prepare(
        `
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC 
      LIMIT ?
    `
      )
      .all(conversationId, limit) as Message[];
  }

  /**
   * Get recent messages for context window
   */
  getRecentMessages(conversationId: number, limit: number = 20): Message[] {
    this.initialize();
    return this.db
      .prepare(
        `
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `
      )
      .all(conversationId, limit)
      .reverse() as Message[];
  }

  /**
   * Save conversation summary
   */
  saveSummary(conversationId: number, summary: string): void {
    this.initialize();
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO conversation_summaries (conversation_id, summary, updated_at) 
      VALUES (?, ?, datetime('now'))
    `
      )
      .run(conversationId, summary);
  }

  /**
   * Get conversation summary
   */
  getSummary(conversationId: number): ConversationSummary | undefined {
    this.initialize();
    return this.db
      .prepare("SELECT * FROM conversation_summaries WHERE conversation_id = ?")
      .get(conversationId) as ConversationSummary | undefined;
  }

  /**
   * Load user profile
   */
  loadUserProfile(userId: number): Record<string, ProfileFact> {
    this.initialize();
    const profile = this.db
      .prepare("SELECT profile_json FROM user_profiles WHERE user_id = ?")
      .get(userId) as { profile_json: string } | undefined;

    if (!profile) {
      return {};
    }

    try {
      return JSON.parse(profile.profile_json);
    } catch (error) {
      console.error("Failed to parse user profile:", error);
      return {};
    }
  }

  /**
   * Save user profile
   */
  saveUserProfile(userId: number, profile: Record<string, ProfileFact>): void {
    this.initialize();
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO user_profiles (user_id, profile_json, updated_at) 
      VALUES (?, ?, datetime('now'))
    `
      )
      .run(userId, JSON.stringify(profile));
  }

  /**
   * Update a single profile fact
   */
  updateProfileFact(userId: number, key: string, fact: ProfileFact): void {
    this.initialize();
    const profile = this.loadUserProfile(userId);
    profile[key] = fact;
    this.saveUserProfile(userId, profile);
  }

  /**
   * Extract facts from conversation (placeholder for future AI enhancement)
   * This is a simple keyword-based extraction.
   * Future: Use LLM to extract preferences/facts
   */
  extractFacts(conversationId: number): ProfileFact[] {
    this.initialize();
    const facts: ProfileFact[] = [];
    const messages = this.getMessages(conversationId);

    // Simple pattern matching for demonstration
    const patterns = [
      { pattern: /my name is (\w+)/i, key: "name" },
      { pattern: /I (like|love|prefer) (\w+)/i, key: "preference" },
      { pattern: /I (work|am) (as |a )?(.+?)(?:\.|$)/i, key: "occupation" },
    ];

    for (const message of messages) {
      if (message.role === "user") {
        for (const { pattern, key } of patterns) {
          const match = message.content.match(pattern);
          if (match) {
            facts.push({
              key: key + "_" + Date.now(),
              value: match[match.length - 1],
              confidence: 0.7,
              source: `conversation-${conversationId}`,
            });
          }
        }
      }
    }

    return facts;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    dbSizeKB: number;
  } {
    this.initialize();

    const stats = {
      totalUsers: (
        this.db.prepare("SELECT COUNT(*) as count FROM users").get() as {
          count: number;
        }
      ).count,
      totalConversations: (
        this.db
          .prepare("SELECT COUNT(*) as count FROM conversations")
          .get() as { count: number }
      ).count,
      totalMessages: (
        this.db.prepare("SELECT COUNT(*) as count FROM messages").get() as {
          count: number;
        }
      ).count,
      dbSizeKB: 0,
    };

    // Get database size
    try {
      const pageCount = this.db.pragma("page_count", {
        simple: true,
      }) as number;
      const pageSize = this.db.pragma("page_size", { simple: true }) as number;
      stats.dbSizeKB = Math.round((pageCount * pageSize) / 1024);
    } catch (error) {
      // Ignore if cannot get size
    }

    return stats;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Vacuum database to reclaim space
   */
  vacuum(): void {
    this.db.exec("VACUUM");
  }
}

// Singleton instance
let memoryInstance: MemoryManager | null = null;

/**
 * Get the singleton memory manager instance
 */
export function getMemoryManager(): MemoryManager {
  if (!memoryInstance) {
    memoryInstance = new MemoryManager();
    memoryInstance.initialize();
  }
  return memoryInstance;
}

/**
 * Close the memory manager (for graceful shutdown)
 */
export function closeMemoryManager(): void {
  if (memoryInstance) {
    memoryInstance.close();
    memoryInstance = null;
  }
}
