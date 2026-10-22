import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import {vercel} from './lib/hydrogen-vercel';

export default defineConfig(({command}) => ({
  plugins: [
    hydrogen(),
    command === 'serve' ? oxygen() : null,
    // Vercel's SSR entry override conflicts with Hydrogen's Oxygen worker build.
    // Vercel sets VERCEL=1 for its builds, so enable that adapter only there.
    process.env.VERCEL === '1' ? vercel() : null,
    reactRouter(),
    tsconfigPaths(),
  ].filter(Boolean),
  build: {
    // Allow a strict Content-Security-Policy
    // withtout inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * For example, for the following error:
       *
       * > ReferenceError: module is not defined
       * >   at /Users/.../node_modules/example-dep/index.js:1:1
       *
       * Include 'example-dep' in the array below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: [
        '@vercel/functions',
        'set-cookie-parser',
        'cookie',
        'react-router',
      ],
    },
  },
  server: {
    allowedHosts: [
      '.tryhydrogen.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
    ],
  },
}));
