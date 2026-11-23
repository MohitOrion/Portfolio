import { defineConfig } from "vite";
import { resolve } from "node:path";

// The site has two pages:
//   /        the portfolio            (index.html)
//   /inbox   the private message inbox (inbox/index.html)
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        inbox: resolve(import.meta.dirname, "inbox/index.html"),
      },
    },
  },
});
