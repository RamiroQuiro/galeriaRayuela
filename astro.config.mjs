// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true, // Permitir acceso externo
      
      open: false // No abrir navegador automáticamente
    }
  },

  adapter: node({
    mode: 'standalone'
  }),

  // Configuración para desactivar barra de desarrollo
  devToolbar: {
    enabled: false
  }
});
