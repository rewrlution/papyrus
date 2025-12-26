# Understanding Middleware

**Middleware** is a function that has access to the request (req) and response (res) objects, and the `next()` function. Middleware can:

- Execute code
- Modify the request/response objects
- End the request-response cycle
- Call the next middleware in the stack

Think of middleware as a series of checkpoints that a request passes through:

```
Request
   ↓
[Logger Middleware]     ← Logs every request
   ↓
[CORS Middleware]       ← Adds CORS headers
   ↓
[JSON Parser]           ← Parses JSON body
   ↓
[Auth Middleware]       ← Checks authentication (optional)
   ↓
[Route Handler]         ← Your actual endpoint logic
   ↓
Response
```

Middleware can be:

- **Application-level**: Applied to all routes
- **Router-level**: Applied to specific route groups
- **Built-in**: Like `express.json()`
- **Third-party**: Like `cors`
- **Custom**: Your own middleware
