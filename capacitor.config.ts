import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.grove.reader',
  appName: 'Grove',
  webDir: 'dist',
  // The app is fully offline (LocalProvider/IndexedDB); no server config needed.
};

export default config;
