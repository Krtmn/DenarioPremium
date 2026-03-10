import { Component, inject, OnInit } from '@angular/core';
import { VisitasService } from './visitas.service';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageComponent } from 'src/app/message/message.component';
import { GeolocationService } from '../services/geolocation/geolocation.service';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Visit } from '../modelos/tables/visit';
import { VISIT_STATUS_NOT_VISITED } from '../utils/appConstants';
import { DateServiceService } from '../services/dates/date-service.service';
import { AddresClient } from '../modelos/tables/addresClient';


@Component({
  selector: 'app-visitas',
  templateUrl: './visitas.component.html',
  styleUrls: ['./visitas.component.scss'],
  standalone: false
})
export class VisitasComponent implements OnInit {
  private service = inject(VisitasService);
  private router = inject(Router);
  private geoLoc = inject(GeolocationService);
  private message = inject(MessageService);
  private dateService = inject(DateServiceService);

  public rolTransportista: boolean = false;

  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
    //console.log('backButton was called!');
    this.router.navigate(['home']);
  });


  constructor(
    private platform: Platform,
  ) {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        let userTransportista = JSON.parse(userStr);
        if (userTransportista.transportista) {
          this.rolTransportista = true;
        }
      } catch (e) {
        this.rolTransportista = false;
      }
    }
    this.service.coordenadas = "";
    if (this.service.userMustActivateGPS) {
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.service.coordenadas = xy;
        }
      })
    }
  }

  ngOnInit() {
    this.service.getTags();
    this.service.getLists();
    this.service.getConfiguration();


  }

  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
  }

  getTag(tagName: string) {
    return this.service.getTag(tagName);
  }

  nuevaVisita() {
    //console.log("Nueva visita!");
    this.message.showLoading().then(() => {
      if (this.service.userMustActivateGPS ) {
        if(this.service.coordenadas &&this.service.coordenadas.length > 0){
            this.navigateToNuevaVisita();
        }else{
            this.geoLoc.getCurrentPosition().then(xy => {
          if (xy.length > 0) {
            this.service.coordenadas = xy;
            this.navigateToNuevaVisita();
          }else{
            this.message.hideLoading();
          }
        })
        }
      } else {
          this.navigateToNuevaVisita();
      }
    });


  }

  navigateToNuevaVisita(){
    this.service.visit = {} as Visit;
    this.service.visit.stVisit = VISIT_STATUS_NOT_VISITED;
    this.service.editVisit = false;
    this.router.navigate(['visita']);
  }

  verVisita() {
    //console.log("Vieja visita!");
    this.router.navigate(['listaVisitas']);
  }

  async verMejorRuta() {
    await this.message.showLoading();
    try {
      let origin = this.parseCoordinate(this.service.coordenadas || '');
      if (!origin) {
        const currentCoords = await this.geoLoc.getCurrentPosition();
        if (currentCoords && currentCoords.length > 0) {
          this.service.coordenadas = currentCoords;
          origin = this.parseCoordinate(currentCoords);
        }
      }

      if (!origin) {
        this.message.transaccionMsjModalNB('No se pudo obtener la coordenada actual.');
        return;
      }

      const visits = await this.service.getVisitList(this.dateService.onlyDateHoyISO() + '%');
      const pendingVisits = visits.filter(v => v.stVisit === VISIT_STATUS_NOT_VISITED);

      if (pendingVisits.length === 0) {
        this.message.transaccionMsjModalNB('No hay visitas pendientes para trazar ruta.');
        return;
      }

      const addressCache = new Map<number, AddresClient[]>();
      const stops: { lat: number; lng: number }[] = [];

      for (const visit of pendingVisits) {
        let addresses = addressCache.get(visit.idClient);
        if (!addresses) {
          addresses = await this.service.getAddressClient(visit.idClient);
          addressCache.set(visit.idClient, addresses);
        }

        const selectedAddress = addresses.find(a => a.idAddress === visit.idAddressClient) || addresses[0];
        if (!selectedAddress) {
          continue;
        }

        const point = this.parseCoordinate(selectedAddress.coordenada || '');
        if (point) {
          stops.push(point);
        }
      }

      if (stops.length === 0) {
        this.message.transaccionMsjModalNB('No hay coordenadas de destino validas para calcular la ruta.');
        return;
      }

      const orderedStops = this.orderByNearestNeighbor(origin, stops);
      const maxDestinations = 24; // 1 destino + hasta 23 waypoints en Google Maps
      const limitedStops = orderedStops.slice(0, maxDestinations);

      if (orderedStops.length > maxDestinations) {
        this.message.transaccionMsjModalNB('Se mostraran los primeros 24 destinos por limite de Google Maps.');
      }

      const destination = limitedStops[limitedStops.length - 1];
      const waypointList = limitedStops.slice(0, Math.max(0, limitedStops.length - 1));

      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;
      let url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}&travelmode=driving`;

      if (waypointList.length > 0) {
        const wp = waypointList.map(p => `${p.lat},${p.lng}`).join('|');
        url += `&waypoints=${encodeURIComponent(wp)}`;
      }

      window.open(url, '_blank');
    } catch (error) {
      console.error('[Visitas] error calculando mejor ruta:', error);
      this.message.transaccionMsjModalNB('Ocurrio un error al calcular la mejor ruta.');
    } finally {
      this.message.hideLoading();
    }
  }

  private parseCoordinate(value: string): { lat: number; lng: number } | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0 || trimmed === 'null' || trimmed === '0,0') {
      return null;
    }

    const parts = value.split(',');
    if (parts.length < 2) {
      return null;
    }

    const lat = Number(parts[0].trim());
    const lng = Number(parts[1].trim());
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  }

  private orderByNearestNeighbor(origin: { lat: number; lng: number }, points: { lat: number; lng: number }[]) {
    const remaining = [...points];
    const ordered: { lat: number; lng: number }[] = [];
    let current = origin;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Number.MAX_VALUE;

      for (let i = 0; i < remaining.length; i++) {
        const dist = this.haversineDistanceMeters(current, remaining[i]);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = i;
        }
      }

      const [nextPoint] = remaining.splice(nearestIndex, 1);
      ordered.push(nextPoint);
      current = nextPoint;
    }

    return ordered;
  }

  private haversineDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const earthRadius = 6371000;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return earthRadius * c;
  }

}
