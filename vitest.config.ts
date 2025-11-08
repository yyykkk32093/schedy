import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ['test/**/*.test.ts'], // ✅ 自動で拾う
    environment: 'node',
  },
});
