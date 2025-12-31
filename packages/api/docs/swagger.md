# API Documentation

well, api document sounds easy, just use swagger, correct?

but when it comes to implementation, there are tons of details to consider.

First, how to minimize (or even sync) from the source code?

Ideally, we don't need to write swagger code.

I use zod for schema definition.

---

The first thing is to create a registry:

```ts
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';

export const registry = new OpenAPIRegistry();
```

We use this `registry` object everywhere.

The last step is to generate the document by running the `OpenApiGenerator.generateDocument()` function.

```ts
export function generateOpenAPIDoc() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Papyrus API',
      version: '1.0.0',
      description: 'papyrus api for journal management and more',
    },
    servers: [{ url: '/api', description: 'API base path' }],
  });
}
```

---

register path. You can call `registry.registerPath()` to add a path to the swagger doc.

```ts
registry.registerPath({
  method: 'post',
  path: '/auth/signup',
  summary: 'Create a new user account',
  description:
    'Register a new user with email and password. Send a verification email',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: SignupSchema,
        },
      },
    },
  },
  responses: {},
});
```

---

You can also use `.openapi()` in the `zod`.
This function comes from the [zod-openapi](https://www.npmjs.com/package/zod-openapi) package, and it allows you to bind your zod schema to openapi doc!

Before using this `.openapi()` function though,you should use the extension method:

```ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);
```

Then don't forget to register this schema to the registry object that we exposed above.

Example:

```ts
export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }),
  })
  .openapi('ErrorResponse');
```

Note:

> this is important! I realized that with `openapi()`, the schema is registered automatically, so you don't need to call the following line:

```ts
registry.register('ErrorResponse', ErrorResponseSchema);
```

> But, the path has to be invoked for this `.openapi()` call to be used.
> using the `registry.register()` function explicitly will register the schema whether it is in the schema route or not.

You can also use the `.openapi()` to attach examples to the swagger doc:

```ts
export const signupSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .openapi({ example: 'user@example.com' }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .openapi({ example: 'securePassword123' }),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
      .openapi({ example: 'securePassword123' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .openapi('SignupRequest');
```

---

This is how you serve the doc in the main app:

```ts
const openApiDoc = generateOpenAPIDoc();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
```

---

To avoid repeatative response object: https://swagger.io/docs/specification/v3_0/describing-responses/

We can define components that are common, like NOT_FOUND, UNAUTHORIZED, then we can refer them everywhere in the response body.
