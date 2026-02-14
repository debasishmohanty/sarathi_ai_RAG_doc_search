import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface LoadWebsiteResponse {
  sessionId: string;
  message: string;
  contentSize: number;
  chunksCount: number;
  hostname: string;
  ragMode?: boolean;
}

export interface UploadDocumentResponse {
  sessionId: string;
  message: string;
  filename: string;
  contentSize: number;
  chunksCount: number;
  ragMode?: boolean;
}

export interface ChatResponse {
  question: string;
  answer: string;
  website?: string;
  ragMode?: boolean;
}

export interface SummaryResponse {
  summary: string;
  sessionId: string;
}

export interface SessionInfo {
  url: string;
  hostname: string;
  contentSize: number;
  chunksCount: number;
}

@Injectable({
  providedIn: "root",
})
export class ChatApiService {
  private apiUrl = "/api";

  constructor(private http: HttpClient) {}

  loadWebsite(url: string): Observable<LoadWebsiteResponse> {
    return this.http.post<LoadWebsiteResponse>(`${this.apiUrl}/load-website`, {
      url,
    });
  }

  uploadDocument(file: File): Observable<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<UploadDocumentResponse>(
      `${this.apiUrl}/upload-document`,
      formData
    );
  }

  sendQuestion(sessionId: string, question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
      sessionId,
      question,
    });
  }

  getSummary(sessionId: string): Observable<SummaryResponse> {
    return this.http.post<SummaryResponse>(`${this.apiUrl}/summarize`, {
      sessionId,
    });
  }

  getSessionInfo(sessionId: string): Observable<SessionInfo> {
    return this.http.get<SessionInfo>(`${this.apiUrl}/session/${sessionId}`);
  }

  checkHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }
}
