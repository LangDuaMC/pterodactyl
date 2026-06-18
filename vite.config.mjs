import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';

const certPath = (file) => path.resolve(__dirname, '../../docker/certificates', file);
const useLocalCerts = process.env.USE_LOCAL_CERTS === 'true';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/scripts/index.tsx'],
            refresh: ['resources/views/**', 'routes/**'],
        }),
        react({
            babel: {
                plugins: ['babel-plugin-macros', 'babel-plugin-styled-components'],
            },
        }),
    ],
    define: {
        'process.env.DEBUG': JSON.stringify(process.env.NODE_ENV !== 'production'),
        'process.env.VITE_BUILD_HASH': JSON.stringify(Date.now().toString(16)),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/scripts'),
            '@definitions': path.resolve(__dirname, 'resources/scripts/api/definitions'),
            '@feature': path.resolve(__dirname, 'resources/scripts/components/server/features'),
            '@blueprint': path.resolve(__dirname, 'resources/scripts/blueprint'),
        },
        symlinks: false,
    },
    css: {
        modules: {
            generateScopedName:
                process.env.NODE_ENV === 'production' ? '[name]_[hash:base64:8]' : '[path][name]__[local]',
        },
    },
    server: {
        host: process.env.VITE_HOST || '0.0.0.0',
        port: Number(process.env.VITE_PORT || 5173),
        strictPort: true,
        https: useLocalCerts
            ? {
                  ca: fs.readFileSync(certPath('root_ca.pem')),
                  cert: fs.readFileSync(certPath('pterodactyl.test.pem')),
                  key: fs.readFileSync(certPath('pterodactyl.test-key.pem')),
              }
            : undefined,
        hmr: {
            host: process.env.VITE_HMR_HOST || 'pterodactyl.test',
            protocol: useLocalCerts ? 'wss' : 'ws',
        },
    },
});
