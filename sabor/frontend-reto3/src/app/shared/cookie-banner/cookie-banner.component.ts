import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (mostrar()) {
      <div class="position-fixed bottom-0 start-0 end-0 p-3"
           style="background:#1a1a1a;color:#fff;z-index:9999;border-top:2px solid #c9a84c"
           role="alertdialog" aria-labelledby="cookie-title" aria-describedby="cookie-desc">
        <div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div>
            <p class="mb-0 fw-semibold" id="cookie-title">🍪 Usamos cookies</p>
            <p class="mb-0 small" style="color:#ccc" id="cookie-desc">
              Usamos cookies para mantener tu sesión iniciada y recordar tus preferencias.
              Si rechazas, podrás usar el sitio pero no guardaremos tus datos entre visitas.
            </p>
          </div>
          <div class="d-flex gap-2 flex-shrink-0">
            <button class="btn btn-outline-light btn-sm" (click)="rechazar()">Rechazar</button>
            <button class="btn btn-sm fw-semibold"
                    style="background:#c9a84c;color:#000" (click)="aceptar()">Aceptar</button>
          </div>
        </div>
      </div>
    }
  `
})
export class CookieBannerComponent implements OnInit {
  mostrar = signal(false);

  ngOnInit() {
    if (localStorage.getItem('cookie_consent') === null) {
      this.mostrar.set(true);
    }
  }

  aceptar() {
    localStorage.setItem('cookie_consent', 'true');
    this.mostrar.set(false);
  }

  rechazar() {
    localStorage.setItem('cookie_consent', 'false');
    this.mostrar.set(false);
  }
}
