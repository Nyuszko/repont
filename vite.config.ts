/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// A játék GitHub Pages-en fut: https://nyuszko.github.io/repont/
export default defineConfig({
  base: '/repont/',
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
});
