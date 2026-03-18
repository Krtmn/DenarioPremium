import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kiberno.denarioPremiumPro',
  appName: 'Denario Premium Movil',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true, 
    },
  },
  server: {
    androidScheme: 'http'
  },  

};

export default config;
