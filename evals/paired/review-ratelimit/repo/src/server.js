import { createApp } from "./app.js";
import { rateLimit } from "./rateLimit.js";

export const app = createApp(
  {
    "GET /ping": (req, res) => res.json({ ok: true, team: req.client.team }),
  },
  [rateLimit({ limit: 100 })],
);
