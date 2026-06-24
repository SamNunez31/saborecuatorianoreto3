import { Component, Input, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div #mapEl style="height:200px;width:100%;position:relative;z-index:0"></div>`
})
export class MapComponent implements AfterViewInit {
  @Input() address = '';
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;
  private http = inject(HttpClient);

  private readonly QUITO: [number, number] = [-0.1807, -78.4678];

  async ngAfterViewInit(): Promise<void> {
    const L = await import('leaflet');

    // Webpack/Angular rompe las rutas de los iconos por defecto; apuntamos a unpkg
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(this.mapEl.nativeElement, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    if (this.address?.trim()) {
      this.http.get<any[]>(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.address)}&format=json&limit=1&countrycodes=ec`
      ).subscribe({
        next: results => {
          const coords: [number, number] = results?.length
            ? [parseFloat(results[0].lat), parseFloat(results[0].lon)]
            : this.QUITO;
          map.setView(coords, 15);
          L.marker(coords).addTo(map).bindPopup(this.address).openPopup();
          setTimeout(() => map.invalidateSize(), 200);
        },
        error: () => { map.setView(this.QUITO, 13); L.marker(this.QUITO).addTo(map); setTimeout(() => map.invalidateSize(), 200); }
      });
    } else {
      map.setView(this.QUITO, 13);
      L.marker(this.QUITO).addTo(map).bindPopup('Quito, Ecuador').openPopup();
      setTimeout(() => map.invalidateSize(), 200);
    }
  }
}
