import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const saved = localStorage.getItem('sabor_theme');
    if (saved === 'dark') {
      this.setDark(true);
    } else {
      this.setDark(false);
    }
  }

  toggle(): void {
    this.setDark(!this.isDarkMode());
  }

  private setDark(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('sabor_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-bs-theme');
      localStorage.setItem('sabor_theme', 'light');
    }
  }
}
