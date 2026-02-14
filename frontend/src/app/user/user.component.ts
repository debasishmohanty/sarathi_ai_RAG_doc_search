import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { UserApiService, UserChatResponse } from "../services/admin-user-api.service";

interface ChatMessage {
  type: "user" | "bot";
  text: string;
  timestamp: Date;
  sourcesUsed?: number;
  ragMode?: boolean;
}

@Component({
  selector: "app-user",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-container">
      <div class="chat-layout">
        <!-- Left Sidebar: Categories -->
        <div class="sidebar">
          <div class="sidebar-header">
            <h2>Categories</h2>
          </div>
          <div *ngIf="categories.length === 0" class="placeholder">
            Loading categories...
          </div>
          <div *ngIf="categories.length > 0" class="categories-list">
            <button
              *ngFor="let cat of categories"
              (click)="selectCategory(cat)"
              [class.active]="selectedCategory === cat"
              class="category-btn"
              [disabled]="sessionCreating"
            >
              <span class="cat-icon">📁</span>
              <span class="cat-name">{{ cat }}</span>
            </button>
          </div>
          <div *ngIf="sessionMessage" [ngClass]="sessionMessageType" class="message">
            {{ sessionMessage }}
          </div>
        </div>

        <!-- Right Side: Chat Window -->
        <div class="chat-window">
          <!-- Welcome State -->
          <div *ngIf="!sessionId" class="welcome-state">
            <div class="welcome-card">
              <h2>💬 Document Q&A Chat</h2>
              <p>Select a category from the left to start your chat session.</p>
              <div *ngIf="selectedCategory" class="selected-info">
                <p><strong>📂 Category:</strong> {{ selectedCategory }}</p>
                <p *ngIf="documentCount > 0"><strong>📚 Documents:</strong> {{ documentCount }}</p>
              </div>
            </div>
          </div>

          <!-- Active Chat Session -->
          <div *ngIf="sessionId" class="chat-session">
            <!-- Header -->
            <div class="chat-header">
              <div class="header-info">
                <h3>{{ selectedCategory }}</h3>
                <p class="doc-count">{{ documentCount }} document(s)</p>
              </div>
              <button (click)="endSession()" class="end-session-btn" title="End chat session">
                ✕
              </button>
            </div>

            <!-- Messages Area -->
            <div class="messages-container">
              <div *ngFor="let msg of chatMessages" [ngClass]="['message', msg.type]">
                <div class="message-wrapper">
                  <div class="bubble" [ngClass]="msg.type">
                    <p class="text">{{ msg.text }}</p>
                    <div *ngIf="msg.sourcesUsed !== undefined" class="meta">
                      <span class="sources">📚 {{ msg.sourcesUsed }} source(s)</span>
                      <span *ngIf="msg.ragMode" class="rag-badge">🔍 RAG</span>
                    </div>
                  </div>
                  <span class="time">{{ formatTime(msg.timestamp) }}</span>
                </div>
              </div>
              <div #messagesEnd></div>
            </div>

            <!-- Input Area -->
            <div class="chat-input-area">
              <input
                type="text"
                [(ngModel)]="userQuestion"
                (keyup.enter)="sendQuestion()"
                [disabled]="sending"
                placeholder="Type your question..."
                class="input-field"
              />
              <button
                (click)="sendQuestion()"
                [disabled]="!userQuestion || sending"
                class="send-button"
              >
                <span *ngIf="!sending">Send</span>
                <span *ngIf="sending">⏳</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .user-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f0f2f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .chat-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
      gap: 0;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #e5e5e5;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .sidebar-header h2 {
      margin: 0;
      color: white;
      font-size: 18px;
      font-weight: 600;
    }

    .categories-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f5f5f5;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      transition: all 0.2s;
      text-align: left;
    }

    .category-btn:hover:not(:disabled) {
      background: #e8e8e8;
      border-color: #667eea;
    }

    .category-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
      font-weight: 600;
    }

    .category-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .cat-icon {
      font-size: 16px;
    }

    .cat-name {
      flex: 1;
    }

    .placeholder {
      padding: 40px 20px;
      text-align: center;
      color: #999;
      font-size: 13px;
    }

    .message {
      margin-top: auto;
      padding: 12px 16px;
      margin: 8px;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
    }

    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    /* Chat Window */
    .chat-window {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f0f2f5;
    }

    .welcome-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .welcome-card {
      background: white;
      border-radius: 12px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      max-width: 400px;
    }

    .welcome-card h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 28px;
    }

    .welcome-card p {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }

    .selected-info {
      margin-top: 30px;
      text-align: left;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .selected-info p {
      margin: 8px 0;
      font-size: 13px;
    }

    /* Chat Session */
    .chat-session {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-header {
      background: white;
      border-bottom: 1px solid #e5e5e5;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .header-info h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
      font-weight: 600;
    }

    .doc-count {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #999;
    }

    .end-session-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #999;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .end-session-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    /* Messages Container */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      margin-bottom: 8px;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 70%;
    }

    .message.user .message-wrapper {
      align-self: flex-end;
      align-items: flex-end;
    }

    .message.bot .message-wrapper {
      align-self: flex-start;
      align-items: flex-start;
    }

    .bubble {
      padding: 12px 16px;
      border-radius: 12px;
      word-wrap: break-word;
    }

    .bubble.user {
      background: #667eea;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .bubble.bot {
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .text {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      margin-top: 8px;
      flex-wrap: wrap;
      opacity: 0.8;
    }

    .bubble.user .meta {
      color: rgba(255, 255, 255, 0.8);
    }

    .bubble.bot .meta {
      color: #999;
    }

    .sources {
      display: inline-block;
    }

    .rag-badge {
      background: rgba(102, 126, 234, 0.2);
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 600;
    }

    .bubble.user .rag-badge {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }

    .time {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
      padding: 0 4px;
    }

    /* Input Area */
    .chat-input-area {
      background: white;
      border-top: 1px solid #e5e5e5;
      padding: 16px 24px;
      display: flex;
      gap: 12px;
      align-items: center;
      box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
    }

    .input-field {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e5e5e5;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
      background: #f9f9f9;
    }

    .input-field:focus {
      background: white;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .input-field:disabled {
      background: #f0f0f0;
      cursor: not-allowed;
    }

    .send-button {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
      min-width: 50px;
    }

    .send-button:hover:not(:disabled) {
      background: #764ba2;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* Scrollbar Styling */
    .categories-list::-webkit-scrollbar,
    .messages-container::-webkit-scrollbar {
      width: 6px;
    }

    .categories-list::-webkit-scrollbar-track,
    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .categories-list::-webkit-scrollbar-thumb,
    .messages-container::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;
    }

    .categories-list::-webkit-scrollbar-thumb:hover,
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #999;
    }
  `,
})
export class UserComponent implements OnInit {
  categories: string[] = [];
  selectedCategory: string = "";
  sessionId: string = "";
  documentCount: number = 0;
  chatMessages: ChatMessage[] = [];
  userQuestion: string = "";
  sending: boolean = false;
  sessionCreating: boolean = false;
  sessionMessage: string = "";
  sessionMessageType: string = "";

  constructor(private userApi: UserApiService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.userApi.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
      },
      error: (err) => {
        console.error("Failed to load categories", err);
      },
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.sessionCreating = true;
    this.sessionMessage = "";

    this.userApi.createSession(`user-${Date.now()}`, category).subscribe({
      next: (response) => {
        this.sessionId = response.sessionId;
        this.documentCount = response.documentCount;
        this.chatMessages = [];
        this.userQuestion = "";
        this.showSessionMessage(
          `Session started with ${response.documentCount} documents`,
          "success"
        );
      },
      error: (err) => {
        this.showSessionMessage(
          `Failed to create session: ${err.error?.message || err.message}`,
          "error"
        );
      },
      complete: () => {
        this.sessionCreating = false;
      },
    });
  }

  sendQuestion() {
    if (!this.userQuestion.trim() || !this.sessionId) {
      return;
    }

    const question = this.userQuestion.trim();
    this.userQuestion = "";
    this.sending = true;

    // Add user message to chat
    this.chatMessages.push({
      type: "user",
      text: question,
      timestamp: new Date(),
    });

    this.userApi.sendQuestion(this.sessionId, question).subscribe({
      next: (response: UserChatResponse) => {
        // Add bot response to chat
        this.chatMessages.push({
          type: "bot",
          text: response.answer,
          timestamp: new Date(),
          sourcesUsed: response.sourcesUsed,
          ragMode: response.ragMode,
        });
      },
      error: (err) => {
        this.chatMessages.push({
          type: "bot",
          text: `Error: ${err.error?.message || "Failed to get response"}`,
          timestamp: new Date(),
        });
      },
      complete: () => {
        this.sending = false;
      },
    });
  }

  endSession() {
    this.sessionId = "";
    this.chatMessages = [];
    this.userQuestion = "";
    this.selectedCategory = "";
    this.showSessionMessage("Session ended", "success");
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  showSessionMessage(message: string, type: string) {
    this.sessionMessage = message;
    this.sessionMessageType = type;
    setTimeout(() => {
      this.sessionMessage = "";
    }, 4000);
  }
}
