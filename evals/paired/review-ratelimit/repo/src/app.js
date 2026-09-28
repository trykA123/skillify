import { authenticate } from "./auth.js";

export function createApp(routes, middleware = []) {
  const chain = [authenticate, ...middleware];
  return async function handle(req) {
    const res = { statusCode: 200, headers: {}, body: null };
    res.status = (code) => ((res.statusCode = code), res);
    res.set = (name, value) => ((res.headers[name] = value), res);
    res.json = (body) => ((res.body = body), res);
    let i = 0;
    const next = async () => {
      const fn = chain[i++];
      if (fn) return fn(req, res, next);
      const route = routes[`${req.method} ${req.path}`];
      if (!route) return res.status(404).json({ error: "not found" });
      return route(req, res);
    };
    await next();
    return res;
  };
}
