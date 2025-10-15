#!/usr/bin/env bun

/**
 * Development server to serve test HTML files
 * Serves v1.html on port 3000 and v2.html on port 3001
 */

const PORT1 = 3000;
const PORT2 = 3001;

// Server for v1.html on port 3000
const server1 = Bun.serve({
  port: PORT1,
  async fetch(req) {
    const file = Bun.file("./test/v1.html");
    return new Response(await file.text(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  },
});

// Server for v2.html on port 3001
const server2 = Bun.serve({
  port: PORT2,
  async fetch(req) {
    const file = Bun.file("./test/v2.html");
    return new Response(await file.text(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  },
});

console.log(`Server 1 (v1.html) running at http://localhost:${PORT1}`);
console.log(`Server 2 (v2.html) running at http://localhost:${PORT2}`);
console.log("\nPress Ctrl+C to stop servers");
