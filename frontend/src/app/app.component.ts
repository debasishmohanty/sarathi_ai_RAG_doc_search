import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminComponent } from "./admin/admin.component";
import { UserComponent } from "./user/user.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, AdminComponent, UserComponent],
  template: `
    <div class="app-wrapper">
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="logo">Document Q&A System</h1>
          <div class="nav-buttons">
            <button
              (click)="switchView('admin')"
              [class.active]="currentView === 'admin'"
              class="nav-btn admin-btn"
            >
              👤 Admin Dashboard
            </button>
            <button
              (click)="switchView('user')"
              [class.active]="currentView === 'user'"
              class="nav-btn user-btn"
            >
              💬 User Chat
            </button>
          </div>
        </div>
      </nav>

      <div class="view-container">
        <div *ngIf="currentView === 'admin'" class="view">
          <app-admin></app-admin>
        </div>
        <div *ngIf="currentView === 'user'" class="view">
          <app-user></app-user>
        </div>
      </div>
    </div>
  `,
  styles: `
    .app-wrapper {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .navbar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .logo {
      color: white;
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }

    .nav-buttons {
      display: flex;
      gap: 10px;
    }

    .nav-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid transparent;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .nav-btn.active {
      background: white;
      color: #1a1a2e;
      border-color: white;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .admin-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: white;
    }

    .user-btn.active {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border-color: white;
    }

    .view-container {
      flex: 1;
      overflow: hidden;
      display: flex;
    }

    .view {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    @media (max-width: 768px) {
      .nav-container {
        flex-direction: column;
        gap: 12px;
      }

      .nav-buttons {
        width: 100%;
      }

      .nav-btn {
        flex: 1;
      }

      .logo {
        width: 100%;
        text-align: center;
      }
    }
  `,
})
export class AppComponent {
  currentView: "admin" | "user" = "user";

  switchView(view: "admin" | "user") {
    this.currentView = view;
  }
}
