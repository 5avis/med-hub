import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(() => {
  // Dynamically load Client ID from backend/.env
  let googleClientId = '310836221132-d72n0g28trt98pgeqc90hiou47631rb0.apps.googleusercontent.com';
  try {
    const envPath = path.resolve(__dirname, 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/VITE_GOOGLE_CLIENT_ID=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        googleClientId = match[1].trim();
      }
    }
  } catch (e) {
    console.warn('Vite config env parser warning:', e.message);
  }

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
