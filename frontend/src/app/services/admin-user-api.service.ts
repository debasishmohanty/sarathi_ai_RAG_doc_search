import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

// Admin API types
export interface AdminUploadResponse {
  success: boolean;
  message: string;
  docId: string;
  category: string;
  filename: string;
  contentSize: number;
  chunksCount: number;
  ragMode: boolean;
}

export interface CategoriesResponse {
  categories: string[];
}

export interface DocumentInfo {
  id: string;
  filename: string;
  uploadedAt: string;
  contentSize: number;
  chunksCount: number;
  ragMode: boolean;
}

export interface DocumentsResponse {
  category: string;
  documents: DocumentInfo[];
}

// User API types
export interface UserSessionResponse {
  sessionId: string;
  category: string;
  documentCount: number;
  message: string;
}

export interface UserChatRequest {
  sessionId: string;
  question: string;
}

export interface UserChatResponse {
  question: string;
  answer: string;
  category: string;
  ragMode: boolean;
  sourcesUsed: number;
}

@Injectable({
  providedIn: "root",
})
export class AdminApiService {
  private apiUrl = "/api/admin";

  constructor(private http: HttpClient) {}

  uploadDocument(file: File, category: string): Observable<AdminUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    return this.http.post<AdminUploadResponse>(
      `${this.apiUrl}/upload-document`,
      formData
    );
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`);
  }

  getDocuments(category: string): Observable<DocumentsResponse> {
    return this.http.get<DocumentsResponse>(
      `${this.apiUrl}/documents?category=${encodeURIComponent(category)}`
    );
  }

  deleteDocument(docId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/documents/${docId}`
    );
  }

  checkHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(
      "http://localhost:5000/api/health"
    );
  }
}

@Injectable({
  providedIn: "root",
})
export class UserApiService {
  private apiUrl = "/api/user";

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`);
  }

  createSession(
    userId: string,
    category: string
  ): Observable<UserSessionResponse> {
    return this.http.post<UserSessionResponse>(`${this.apiUrl}/session`, {
      userId,
      category,
    });
  }

  sendQuestion(
    sessionId: string,
    question: string
  ): Observable<UserChatResponse> {
    return this.http.post<UserChatResponse>(`${this.apiUrl}/chat`, {
      sessionId,
      question,
    });
  }

  checkHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(
      "/api/health"
    );
  }
}
