# API reference docs

Short, factual reference material. For architecture overview, endpoint catalog, and conventions see [`../CLAUDE.md`](../CLAUDE.md).

| Doc                                                  | What it covers                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| [`database.md`](./database.md)                       | Schema design, naming conventions, migrations, RLS              |
| [`deployment.md`](./deployment.md)                   | Render.com deployment in the monorepo                           |
| [`encryption_strategy.md`](./encryption_strategy.md) | AES-256-GCM journal encryption and key rotation                 |
| [`email.md`](./email.md)                             | Dual-provider (Resend + Nodemailer) verification email pipeline |
| [`logging.md`](./logging.md)                         | Winston logger conventions and levels                           |
| [`custom-domain.md`](./custom-domain.md)             | Porkbun + Render custom domain wiring                           |
| [`sync/`](./sync/)                                   | Full design + implementation plan for the journal sync system   |
