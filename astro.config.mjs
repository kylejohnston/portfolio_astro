// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://kylewjohnston.com',
  integrations: [mdx()],
  fonts: [
    {
      provider: fontProviders.local(),
      name: "At Textual",
      cssVariable: "--at-textual",
      options: {
        variants: [{
          weight: '60 150',
          style: 'normal',
          src: ['./src/assets/fonts/AtTextualVAR.woff2'],
        }],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Untitled Sans",
      cssVariable: "--font-untitled",
      options: {
        variants: [
          {
          weight: '60',
          style: 'normal',
          src: ['./src/assets/fonts/UntitledSans-Regular.woff2'],
          },
          {
          weight: '120',
          style: 'normal',
          src: ['./src/assets/fonts/UntitledSans-Medium.woff2'],
          },
          {
          weight: '700',
          style: 'normal',
          src: ['./src/assets/fonts/UntitledSans-Bold.woff2'],
          }
        ],
      },
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",
      cssVariable: "--font-mono",
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Sans",
      weights: [400, 500],
      cssVariable: "--at-sans",
    },
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});