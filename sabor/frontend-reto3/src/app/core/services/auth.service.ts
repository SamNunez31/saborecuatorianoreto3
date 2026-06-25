// ── AUTH SERVICE ─────────────────────────────────────────
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario } from '../models';

import { CartService } from './cart.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY  = 'se_token';
  private readonly USER_KEY   = 'se_user';
  private readonly COOKIE_NAME = 'sabor_token';

  currentUser = signal<Usuario | null>(this._loadUser());

  constructor(private http: HttpClient, private router: Router, private cart: CartService) {
    this.loadUserFromCookie();
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data).pipe(tap(r => this._save(r)));
  }
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(tap(r => this._save(r)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._deleteCookie(this.COOKIE_NAME);
    this.cart.clear();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) ?? this._getCookie(this.COOKIE_NAME);
  }
  isLoggedIn(): boolean { return !!this.getToken(); }
  isAdmin(): boolean    { const u = this.currentUser(); return !!u && ['admin','cajero'].includes(u.rol); }

  /** Si localStorage fue limpiado pero la cookie sigue activa, restaura el token */
  loadUserFromCookie(): void {
    if (!localStorage.getItem(this.TOKEN_KEY)) {
      const token = this._getCookie(this.COOKIE_NAME);
      if (token) localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private _save(r: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, r.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(r.usuario));
    this._setCookie(this.COOKIE_NAME, r.token, 7);
    this.currentUser.set(r.usuario);
  }
  private _loadUser(): Usuario | null {
    try { const u = localStorage.getItem(this.USER_KEY); return u ? JSON.parse(u) : null; } catch { return null; }
  }

  // ── Cookie helpers ────────────────────────────────────
  private _setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
  private _getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  private _deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
