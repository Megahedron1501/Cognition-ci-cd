# Cognition Infra (AWS CDK)

Deploys the built React app (`../build`) to S3, served through CloudFront over HTTPS.

## Prerequisites

- The React app must be built first: `cd .. && npm run build`
- AWS credentials configured for the target account/sandbox (`aws configure` or SSO login)

## Commands

```
npm install          # install CDK dependencies (first time / after changes)
npx cdk bootstrap    # one-time per account/region - sets up CDK's deployment assets
npx cdk diff         # preview changes against what's currently deployed
npx cdk deploy       # deploy/update the stack
npx cdk destroy      # tear down everything this stack created
```

## Sandbox workflow

Because the target AWS sandbox is ephemeral (fully reset periodically), treat every deploy as
if it's starting from a blank account:

1. `cdk bootstrap` — required again after any account reset, before the first `deploy`.
2. `cdk deploy` — recreates the S3 bucket + CloudFront distribution from scratch.
3. When done, `cdk destroy` (or just let the sandbox reset) — the stack is defined with
   `RemovalPolicy.DESTROY` and `autoDeleteObjects: true` specifically so nothing has to be
   cleaned up by hand.

Never make changes via the AWS Console — anything not captured in `lib/infra-stack.ts` is lost
on the next sandbox reset and can't be reproduced.
