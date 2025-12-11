import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from "vite-plugin-svgr";
import * as fs from 'fs';
import * as path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      }
    }),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  server: {
    port: 6083,
    strictPort: true,
    https: {
			key: fs.readFileSync(path.resolve('./ssl/private.key')),
			cert: fs.readFileSync(path.resolve('./ssl/certificate.crt'))
		},
    host: true,
    allowedHosts: ['.ngrok.io', '.sita.cloud', "localhost", ".local"]
  },
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
    }
  }
})
