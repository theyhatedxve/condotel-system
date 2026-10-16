import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Compile React/JSX and enable the existing development refresh support.
export default defineConfig({
  plugins: [react()],
});
