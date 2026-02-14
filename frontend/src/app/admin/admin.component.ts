import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminApiService, DocumentInfo } from "../services/admin-user-api.service";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <h1>Admin Dashboard - Document Management</h1>

      <!-- Upload Section -->
      <div class="upload-section">
        <h2>Upload Document</h2>
        <div class="form-group">
          <label for="category">Category:</label>
          <select id="category" [(ngModel)]="selectedCategory" class="input-field">
            <option value="1">HR policy</option>
            <option value="2">Legal Policy</option>
            <option value="3">Ethics</option>
          </select>
        </div>

        <div class="form-group">
          <label for="file">Choose File:</label>
          <input
            id="file"
            type="file"
            (change)="onFileSelected($event)"
            accept=".pdf,.docx,.txt"
            class="input-field"
          />
          <p class="file-info">{{ selectedFile?.name || "No file selected" }}</p>
        </div>

        <button
          (click)="uploadDocument()"
          [disabled]="!selectedFile || !selectedCategory || uploading"
          class="upload-btn"
        >
          {{ uploading ? "Uploading..." : "Upload Document" }}
        </button>

        <div *ngIf="uploadMessage" [ngClass]="uploadMessageType" class="message">
          {{ uploadMessage }}
        </div>
      </div>

      <!-- Category Management Section -->
      <div class="category-section">
        <h2>Manage Categories</h2>
        <div class="categories-list">
          <div
            *ngFor="let cat of categories"
            (click)="selectCategoryView(cat)"
            [class.active]="selectedCategoryView === cat"
            class="category-item"
          >
            {{ cat }}
            <span class="count"
              >({{ getDocumentCountForCategory(cat) }} docs)</span
            >
          </div>
        </div>
      </div>

      <!-- Documents Section -->
      <div class="documents-section">
        <h2>
          Documents
          <span *ngIf="selectedCategoryView">in {{ selectedCategoryView }}</span>
        </h2>

        <div *ngIf="!selectedCategoryView" class="placeholder">
          Select a category to view documents
        </div>

        <div *ngIf="selectedCategoryView && documents.length === 0" class="placeholder">
          No documents in {{ selectedCategoryView }}
        </div>

        <div *ngIf="documents.length > 0" class="documents-grid">
          <div *ngFor="let doc of documents" class="document-card">
            <div class="doc-header">
              <h3>{{ doc.filename }}</h3>
              <button
                (click)="deleteDocument(doc.id)"
                [disabled]="deleting"
                class="delete-btn"
              >
                × Delete
              </button>
            </div>
            <div class="doc-info">
              <p><strong>Size:</strong> {{ formatSize(doc.contentSize) }}</p>
              <p><strong>Chunks:</strong> {{ doc.chunksCount }}</p>
              <p><strong>RAG Mode:</strong> {{ doc.ragMode ? "Yes" : "No" }}</p>
              <p><strong>Uploaded:</strong> {{ formatDate(doc.uploadedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 30px;
    }

    h2 {
      color: #555;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }

    .upload-section,
    .category-section,
    .documents-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
    }

    .input-field {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .file-info {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }

    .upload-btn {
      background-color: #28a745;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
    }

    .upload-btn:hover:not(:disabled) {
      background-color: #218838;
    }

    .upload-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .message {
      margin-top: 10px;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
    }

    .message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .categories-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .category-item {
      background: white;
      border: 2px solid #ddd;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .category-item:hover {
      border-color: #007bff;
      background: #f0f7ff;
    }

    .category-item.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .count {
      font-size: 12px;
      opacity: 0.8;
      margin-left: 5px;
    }

    .placeholder {
      padding: 20px;
      text-align: center;
      color: #999;
      background: white;
      border-radius: 4px;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }

    .document-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .doc-header h3 {
      margin: 0;
      color: #333;
      word-break: break-word;
      flex: 1;
    }

    .delete-btn {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
      margin-left: 10px;
    }

    .delete-btn:hover:not(:disabled) {
      background-color: #c82333;
    }

    .delete-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .doc-info {
      font-size: 13px;
      color: #666;
    }

    .doc-info p {
      margin: 5px 0;
    }
  `,
})
export class AdminComponent implements OnInit {
  selectedFile: File | null = null;
  // store numeric selection; map to label before sending to backend
  selectedCategory: string = "1";
  selectedCategoryView: string = "";
  categories: string[] = [];
  documents: DocumentInfo[] = [];
  uploading: boolean = false;
  deleting: boolean = false;
  uploadMessage: string = "";
  uploadMessageType: string = "";
  categoryDocuments: Map<string, DocumentInfo[]> = new Map();

  constructor(private adminApi: AdminApiService) {}

  ngOnInit() {
    this.loadCategories();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    if (!this.selectedFile || !this.selectedCategory) {
      this.showMessage("Please select file and category", "error");
      return;
    }

    this.uploading = true;
    const categoryLabel = this.mapCategoryValue(this.selectedCategory);
    this.adminApi.uploadDocument(this.selectedFile, categoryLabel).subscribe({
      next: (response) => {
        this.showMessage(
          `Document uploaded successfully! (${response.chunksCount} chunks)`,
          "success"
        );
        this.selectedFile = null;
        this.selectedCategory = "1";
        this.loadCategories();
        if (this.selectedCategoryView === response.category) {
          this.selectCategoryView(response.category);
        }
      },
      error: (err) => {
        this.showMessage(
          `Upload failed: ${err.error?.message || err.message}`,
          "error"
        );
      },
      complete: () => {
        this.uploading = false;
      },
    });
  }

  mapCategoryValue(value: string): string {
    const map: Record<string, string> = {
      "1": "HR policy",
      "2": "Legal Policy",
      "3": "Ethics",
    };
    return map[value] || value;
  }

  loadCategories() {
    this.adminApi.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
        if (this.selectedCategoryView && this.categories.includes(this.selectedCategoryView)) {
          this.selectCategoryView(this.selectedCategoryView);
        }
      },
      error: (err) => {
        console.error("Failed to load categories", err);
      },
    });
  }

  selectCategoryView(category: string) {
    this.selectedCategoryView = category;
    this.adminApi.getDocuments(category).subscribe({
      next: (response) => {
        this.documents = response.documents;
        this.categoryDocuments.set(category, response.documents);
      },
      error: (err) => {
        console.error("Failed to load documents", err);
        this.documents = [];
      },
    });
  }

  deleteDocument(docId: string) {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    this.deleting = true;
    this.adminApi.deleteDocument(docId).subscribe({
      next: (response) => {
        this.showMessage("Document deleted successfully", "success");
        if (this.selectedCategoryView) {
          this.selectCategoryView(this.selectedCategoryView);
        }
      },
      error: (err) => {
        this.showMessage(`Delete failed: ${err.error?.message || err.message}`, "error");
      },
      complete: () => {
        this.deleting = false;
      },
    });
  }

  getDocumentCountForCategory(category: string): number {
    return this.categoryDocuments.get(category)?.length || 0;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  showMessage(message: string, type: string) {
    this.uploadMessage = message;
    this.uploadMessageType = type;
    setTimeout(() => {
      this.uploadMessage = "";
    }, 5000);
  }
}
