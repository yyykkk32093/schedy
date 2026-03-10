import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // 👇 ここ重要：明示的にどの tsconfig を見るか指定！
  plugins: [
    tsconfigPaths({
      projects: ['./tsconfig.test.json'],
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // E2Eテストが同一DBを共有するため、ファイル間の並列実行を無効化
    fileParallelism: false,
  },
})
