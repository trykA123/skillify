import { expect, test } from "bun:test";
import { createApp } from "../src/app.js";
import { rateLimit } from "../src/rateLimit.js";

test("allows requests under the limit", async () => {
  const app = createApp({ "GET /ping": (req, res) => res.json({ ok: true }) }, [rateLimit({ limit: 5 })]);
  const res = await app({ method: "GET", path: "/ping", headers: { "x-api-key": "k-alpha" }, ip: "1.1.1.1" });
  expect(res.statusCode).toBe(200);
  expect(res.headers["X-RateLimit-Remaining"]).toBe("4");
});

test("blocks after the limit", async () => {
  const app = createApp({ "GET /ping": (req, res) => res.json({ ok: true }) }, [rateLimit({ limit: 2 })]);
  const req = { method: "GET", path: "/ping", headers: { "x-api-key": "k-alpha" }, ip: "1.1.1.1" };
  for (let i = 0; i < 5; i += 1) await app(req);
  expect((await app(req)).statusCode).toBe(429);
});
