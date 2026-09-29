import page from "./index.html";

const port = Number(process.env.PORT ?? 5890);
Bun.serve({ port, routes: { "/": page }, development: true });
console.log(`http://localhost:${port}`);
