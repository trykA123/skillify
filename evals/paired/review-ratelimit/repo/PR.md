# Add per-key rate limiting

Closes #212.

Each API key may make at most 100 requests per minute. Request 101 within the window
gets `429 Too Many Requests` with a `Retry-After` header (seconds until the window
resets). Other keys are unaffected. The API runs behind our load balancer.
