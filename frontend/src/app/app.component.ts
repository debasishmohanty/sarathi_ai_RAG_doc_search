import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChatApiService,
  LoadWebsiteResponse,
  ChatResponse,
  UploadDocumentResponse,
  SummaryResponse,
} from "./services/chat-api.service";

interface Message {
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  urlInput = "";
  questionInput = "";
  sessionId: string | null = null;
  contentLoaded = false;
  contentType: "website" | "document" | null = null;
  hostname = "";
  filename = "";
  messages: Message[] = [];
  isLoading = false;
  serverConnected = false;
  summary = "";
  showSummary = false;
  ragModeEnabled = false;
  ragModeActive = false;

  constructor(private apiService: ChatApiService) {}

  ngOnInit(): void {
    this.checkServerConnection();
  }

  checkServerConnection(): void {
    this.apiService.checkHealth().subscribe({
      next: () => {
        this.serverConnected = true;
        this.addSystemMessage("✓ Connected to backend server");
      },
      error: () => {
        this.serverConnected = false;
        this.addSystemMessage(
          "✗ Cannot connect to backend. Make sure the server is running on port 5000"
        );
      },
    });
  }

  loadWebsite(): void {
    if (!this.urlInput.trim()) {
      this.addSystemMessage("Please enter a valid URL");
      return;
    }

    if (!this.serverConnected) {
      this.addSystemMessage("Server is not connected. Cannot load website.");
      return;
    }

    this.isLoading = true;
    this.addSystemMessage(`📡 Loading website: ${this.urlInput}...`);

    this.apiService.loadWebsite(this.urlInput).subscribe({
      next: (response: LoadWebsiteResponse) => {
        this.sessionId = response.sessionId;
        this.contentLoaded = true;
        this.contentType = "website";
        this.hostname = response.hostname;
        this.ragModeEnabled = response.ragMode ?? false;
        this.isLoading = false;
        this.messages = [];
        this.showSummary = false;
        const ragStatus = this.ragModeEnabled ? "🔍 Using semantic search (RAG)" : "📋 Using simple context mode";
        this.addSystemMessage(
          `✓ ${response.message}\nContent: ${response.contentSize} chars | Chunks: ${response.chunksCount}\n${ragStatus}`
        );
      },
      error: (error) => {
        this.isLoading = false;
        this.addSystemMessage(`✗ Error: ${error.error?.error || error.message}`);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadDocument(file);
  }

  uploadDocument(file: File): void {
    if (!this.serverConnected) {
      this.addSystemMessage("Server is not connected. Cannot upload document.");
      return;
    }

    // Validate file type
    const validTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".pdf") && !file.name.endsWith(".doc") && !file.name.endsWith(".docx")) {
      this.addSystemMessage("⚠ Only .txt, .pdf, and .doc/.docx files are supported");
      return;
    }

    this.isLoading = true;
    this.addSystemMessage(`📄 Uploading document: ${file.name}...`);

    this.apiService.uploadDocument(file).subscribe({
      next: (response: UploadDocumentResponse) => {
        this.sessionId = response.sessionId;
        this.contentLoaded = true;
        this.contentType = "document";
        this.filename = response.filename;
        this.ragModeEnabled = response.ragMode ?? false;
        this.isLoading = false;
        this.messages = [];
        this.showSummary = false;
        const ragStatus = this.ragModeEnabled ? "🔍 Using semantic search (RAG)" : "📋 Using simple context mode";
        this.addSystemMessage(
          `✓ ${response.message}\nContent: ${response.contentSize} chars | Chunks: ${response.chunksCount}\n${ragStatus}`
        );
      },
      error: (error) => {
        this.isLoading = false;
        this.addSystemMessage(`✗ Error: ${error.error?.error || error.message}`);
      },
    });

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }

  generateSummary(): void {
    if (!this.sessionId) {
      this.addSystemMessage("Load content first");
      return;
    }

    this.isLoading = true;
    this.addSystemMessage("📝 Generating summary...");

    this.apiService.getSummary(this.sessionId).subscribe({
      next: (response: SummaryResponse) => {
        this.isLoading = false;
        this.summary = response.summary;
        this.showSummary = true;
        this.addSystemMessage("✓ Summary generated!");
      },
      error: (error) => {
        this.isLoading = false;
        this.addSystemMessage(`✗ Error: ${error.error?.error || error.message}`);
      },
    });
  }

  sendQuestion(): void {
    if (!this.questionInput.trim()) {
      return;
    }

    if (!this.sessionId) {
      this.addSystemMessage("Load website or document first");
      return;
    }

    const question = this.questionInput;
    this.questionInput = "";
    this.isLoading = true;

    this.addMessage("user", question);

    this.apiService.sendQuestion(this.sessionId, question).subscribe({
      next: (response: ChatResponse) => {
        this.ragModeActive = response.ragMode ?? false;
        const ragBadge = response.ragMode ? " 🔍 [Semantic Search]" : "";
        this.isLoading = false;
        this.addMessage("bot", response.answer + ragBadge);
      },
      error: (error) => {
        this.isLoading = false;
        this.addSystemMessage(`✗ Error: ${error.error?.error || error.message}`);
      },
    });
  }

  addMessage(type: "user" | "bot", content: string): void {
    this.messages.push({
      type,
      content,
      timestamp: new Date(),
    });
  }

  addSystemMessage(content: string): void {
    this.messages.push({
      type: "system",
      content,
      timestamp: new Date(),
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendQuestion();
    }
  }
}
