import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Network } from '@capacitor/network';
import { Platform } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { AutoSendService } from '../autoSend/auto-send.service';
import { ServicesService } from '../services.service';

@Injectable({ providedIn: 'root' })
export class BackgroundSyncService {
  private started = false;
  private syncing = false;
  private readonly intervalMs = 15 * 60 * 1000; // 15 minutes, aligns with WorkManager minimum
  private timerId?: ReturnType<typeof setInterval>;
  // Tablas a sincronizar en segundo plano (IDs de tableKeyMap en synchronization.component)
  private readonly backgroundTableIds = [64, 65, 66, 25];

  private autoSend = inject(AutoSendService);
  private services = inject(ServicesService);

  constructor(
    private http: HttpClient,
    private router: Router,
    private platform: Platform,
    private zone: NgZone
  ) {}

  async start() {
    if (this.started) return;
    this.started = true;

    await this.platform.ready();

    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        this.trySync('network-recovered');
      }
    });

    this.timerId = setInterval(() => this.trySync('interval'), this.intervalMs);
    this.trySync('startup');
  }

  async stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
    this.started = false;
  }

  private async trySync(reason: string) {
    if (this.syncing) return;
    this.syncing = true;

    try {
      const status = await Network.getStatus();
      if (!status.connected) return;

      await this.autoSend.runPendingQueue();

      const hasChanges = await this.checkServerDelta();
      if (hasChanges) {
        const tablesParam = this.backgroundTableIds.length ? `?tables=${this.backgroundTableIds.join(',')}` : '';
        this.zone.run(() => {
          this.router.navigateByUrl(`/synchronization/sincronizar${tablesParam}`).catch(() => {});
        });
      }
    } catch (error: any) {
      if (error?.status === 401) {
        localStorage.setItem('tokenExpired', 'true');
      }
      // swallow errors to avoid crashing the scheduler
      console.warn('[BackgroundSync] skipped run', reason, error?.message ?? error);
    } finally {
      this.syncing = false;
    }
  }

  private async checkServerDelta(): Promise<boolean> {
    const idUser = localStorage.getItem('idUser');
    if (!idUser) return false;

    const lastSync = localStorage.getItem('lastUpdate') || '2000-01-01 00:00:00.000';
    const url = `${this.services.getURLService()}syncservice/sync-check`;
    const payload: Record<string, any> = {
      userId: Number(idUser),
      lastSyncDate: lastSync
    };
    if (this.backgroundTableIds.length) {
      payload['tableIds'] = this.backgroundTableIds;
    }

    const response = await firstValueFrom(
      this.http.post<{ changes?: boolean; hasChanges?: boolean; syncRequired?: boolean }>(
        url,
        payload,
        this.services.getHttpOptionsAuthorization()
      )
    );

    return Boolean(response?.changes ?? response?.hasChanges ?? response?.syncRequired);
  }
}
