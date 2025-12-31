# Lessons Learned for Building API Applications

## Language & Framework

My conclusion:

- language: ts
- framework: express
- ORM: prisma
- DB: postgresql (hosting: `supabase`)

Reason:

I prefer to write API application in either ts or python.

`FastAPI` is another good framework, and I love it because it has the swagger docs by default.
However, there are two reasons why I finally chose typescript and express.

1. Auth. I am more familiar with developing auth endpoint in TS/JS
2. I prefer `prisma` over `SQLAlchemy`.

## Auth

Auth is difficult and this is the part that cannot be messed up.
I am fully aware of the effort it takes to do authorization, role and etc.
so, at first, I was looking for some 3rd party provider.
Initially, I chose `clerk` since it offers very graceful free tier.
I also set up a whole `webhook` service that does:

1. signature verification
2. use `ngrok` for forwarding webhook events to local dev server
3. sync user data with clerk user events

The effort to set up a webhook endpoint is a lot, the learning experience is not bad, but the thing that drove me away is that, there's no easy way to auth user if I just have an api application - well, there are ways, but not native.

I ended up writing my own auth endpoint anyways.
well, there's a reason here, and that's because all I need is simple email address sign-up mechanism.
Ideally, I won't bother do all the user and credential management on my own.

BTW, `bcrypt` has a way to generate salt automatically, and save it along side the password, which is a great learning for me. Originally, I thought I need to save the SALT.

## Deplopyment & CI/CD

### Azure

Now, eventually, we come to the deployment stage.
Originall, I use the following stack:

- azure service plan
- azure web app
- key vault for storing environment variables such as db password

The whole CI/CD experience requires a very step learning curve.

Creating service plan and webapp is quite straightforward (well, ideally we should use `bicep` to define the azure resources, so that makes the learning curve even steeper), but the configuration of permission, agian, sucks.

I know how to add role assignment to myself, so that I can grant KV list/get permission to the managed identity of the web app. But, even for me, who has these knowledge, it's requires some amount of error-trial.

Setting up environment variable in github dashboard, also requires some experience - there's Repository variable and Environment variable. The first one is global to the whole repo while the other is designed for staging.
Again, I need to write some custom script to make sure environment variables like DB password can be accessed by the pipeline, that debugging experience is not fun.

Obtaining the `publishing profile` is also a bummer.
Previously, we can run some azure command to output the XML payload of the publishing profile (which is used by the pipeline to upload artifacts to azure).

I did the same but got this error:

> Publish profile is invalid for app-name and slot-name provided. Provide correct publish profile credentials for app.

I then tried to create a different `slot` and download the profile and use that profile for uploading the artifact, not working.

After the security surge, basic auth is disabled, and the XML publishing profile tricks doesn't work any longer, I need to go to `configuration` and enable it.

Check out this link: https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions?tabs=applevel%2Caspnetcore

and there's the note:

> To use publish profile, you must enable [basic authentication](https://learn.microsoft.com/en-us/azure/app-service/configure-basic-auth-disable?tabs=portal).

After all the troubleshooting, yes, I managed to deploy the api application, but it didn't work - got 500 error.

### Vercel

Vercel is great. I love their taste.
The triangle looks like a piece of art.
It offers free tier.

However, there are some caveats.

First, you gonna follow the file based routing structure:

```txt
express-minimal/
├── api/
│   ├── index.ts          ← GET /
│   ├── hello.ts          ← GET /api/hello
│   └── users/
│       ├── index.ts      ← GET /api/users
│       └── [id].ts       ← GET /api/users/:id
├── package.json
└── vercel.json
```

and the middleware usage now becomes direct invocation, rather than passing functions in an array.

that means:

1. you don't use middleware in a nice way
2. you have very strong vendor-lockin, well, I guess this is okay, since `Azure Function` has its own way to run the serverless function. In fact, at a certain point, I like the way it defines the API since I have a plan to write a next.js application, and it just follows the same file-based routing stragety.

What makes me decide not to use it is that it's just not built that natively for API application, and I have some concern of it supporting `SSE events`, let alone `websocket`.

Sure, with the `edge function` (meaning, running serverless function closes to users location), the free-tier can keep the connection open for 10 sec, but this is not enough when the backend needs more time to generate the chat messages.

### Render

After so many evaluations, I finally chose [render](https://render.com/). Very simple configuration, have support for SSE events, and I can write my express api in any ways that I like.

Just import the project from github to render, and it takes care of CI/CD for you.
