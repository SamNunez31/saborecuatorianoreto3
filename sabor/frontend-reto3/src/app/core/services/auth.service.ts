// ── AUTH SERVICE ─────────────────────────────────────────
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'se_token';
  private readonly USER_KEY  = 'se_user';
  currentUser = signal<Usuario | null>(this._loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data).pipe(tap(r => this._save(r)));
  }
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(tap(r => this._save(r)));
  }
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
  getToken(): string | null   { return localStorage.getItem(this.TOKEN_KEY); }
  isLoggedIn(): boolean       { return !!this.getToken(); }
  isAdmin(): boolean          { const u = this.currentUser(); return !!u && ['admin','cajero'].includes(u.rol); }
  private _save(r: AuthResponse): void { localStorage.setItem(this.TOKEN_KEY, r.token); localStorage.setItem(this.USER_KEY, JSON.stringify(r.usuario)); this.currentUser.set(r.usuario); }
  private _loadUser(): Usuario | null { try { const u = localStorage.getItem(this.USER_KEY); return u ? JSON.parse(u) : null; } catch { return null; } }
}
