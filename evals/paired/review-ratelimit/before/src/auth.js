const keys = new Map([["k-alpha", { team: "alpha" }], ["k-beta", { team: "beta" }]]);

export function authenticate(req, res, next) {
  const key = req.headers["x-api-key"];
  const client = keys.get(key);
  if (!client) return res.status(401).json({ error: "invalid api key" });
  req.client = { key, ...client };
  return next();
}
