import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

async function loadEnv(): Promise<void> {
  try {
    const response = await fetch('/claves.env', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const text = await response.text();
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

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
}

bootstrap();
