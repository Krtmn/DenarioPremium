import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

function loadGoogleMapsScript(apiKey: string | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const key = apiKey?.trim();
    if (!key) {
      resolve();
      return;
    }

    if ((window as Window & { google?: { maps?: unknown } }).google?.maps) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-google-maps]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
}

async function loadEnv(): Promise<void> {
  try {
    const tryFetch = async (url: string) => {
      const response = await fetch(url, { cache: 'no-store' });
      return response.ok ? response.text() : null;
    };

    let text = await tryFetch('/claves.env');
    if (!text) {
      text = await tryFetch('claves.env');
    }

    if (!text) {
      console.warn('No se pudo cargar claves.env');
      return;
    }
    const env: Record<string, string> = {};

    text.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      const index = trimmed.indexOf('=');
      if (index === -1) {
        return;
      }
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    });

    (window as Window & { __env?: Record<string, string> }).__env = env;
  } catch (error) {
    console.log(error);
  }
}

async function bootstrap(): Promise<void> {
  if (environment.production) {
    enableProdMode();
  }

  await loadEnv();

  const env = (window as Window & { __env?: Record<string, string> }).__env || {};
  const apiKey = env['API_KEY_GOOGLE_MAPS'];
  if (!apiKey) {
    console.warn('API_KEY_GOOGLE_MAPS no está definida en claves.env');
  }
  await loadGoogleMapsScript(apiKey);

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
}

bootstrap();
