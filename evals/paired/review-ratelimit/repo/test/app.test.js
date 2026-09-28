import { expect, test } from "bun:test";
import { createApp } from "../src/app.js";

const app = createApp({ "GET /ping": (req, res) => res.json({ ok: true, team: req.client.team }) });

test("valid key reaches the route", async () => {
  const res = await app({ method: "GET", path: "/ping", headers: { "x-api-key": "k-alpha" }, ip: "10.0.0.1" });
  expect(res.body).toEqual({ ok: true, team: "alpha" });
});

test("missing key is rejected", async () => {
  const res = await app({ method: "GET", path: "/ping", headers: {}, ip: "10.0.0.1" });
  expect(res.statusCode).toBe(401);
});
