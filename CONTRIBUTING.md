# Contributing to Langfuse

First off, thanks for taking the time to contribute! ❤️

The best ways to contribute to Langfuse:

- Submit and vote on [Ideas](https://github.com/orgs/langfuse/discussions/categories/ideas)
- Create and comment on [Issues](https://github.com/langfuse/langfuse/issues)
- Open a PR.

We welcome contributions through GitHub pull requests. This document outlines our conventions regarding development workflow, commit message formatting, contact points, and other resources. Our goal is to simplify the process and ensure that your contributions are easily accepted.

We gratefully welcome improvements to documentation ([docs repo](https://github.com/langfuse/langfuse-docs)), the core application (this repo) and the SDKs ([Python](https://github.com/langfuse/langfuse-python), [JS](https://github.com/langfuse/langfuse-js)).

The maintainers are available on [Discord](https://langfuse.com/discord) in case you have any questions.

> And if you like the project, but just don't have time to contribute code, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
>
> - Star the project;
> - Tweet about it;
> - Refer to this project in your project's readme;
> - Submit and vote on [Ideas](https://github.com/orgs/langfuse/discussions/categories/ideas);
> - Create and comment on [Issues](https://github.com/langfuse/langfuse/issues);
> - Mention the project at local meetups and tell your friends/colleagues.

## Making a change

_Before making any significant changes, please [open an issue](https://github.com/langfuse/langfuse/issues)._ Discussing your proposed changes ahead of time will make the contribution process smooth for everyone. Large changes that were not discussed in an issue may be rejected.

Once we've discussed your changes and you've got your code ready, make sure that tests are passing and open your pull request.

A good first step is to search for open [issues](https://github.com/langfuse/langfuse/issues). Issues are labeled, and some good issues to start with are labeled: [good first issue](https://github.com/langfuse/langfuse/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## Project Overview

### Technologies we use

- Application (this repository)
  - NextJS 14, pages router
  - NextAuth.js / Auth.js
  - tRPC: Frontend APIs
  - Prisma ORM
  - Zod
  - Tailwind CSS
  - shadcn/ui tailwind components (using Radix and tanstack)
  - Fern: generate OpenAPI spec and Pydantic models
- JS SDK ([langfuse/langfuse-js](https://github.com/langfuse/langfuse-js))
  - openapi-typescript to generated types based on OpenAPI spec
- Python SDK ([langfuse/langfuse-python](https://github.com/langfuse/langfuse-python))
  - Pydantic for input validation, models generated by fern

### Architecture Overview

```mermaid
flowchart TB
   subgraph s4["Clients"]
      subgraph s2["langfuse/langfuse-python"]
         Python["Python SDK"]
         OAI["OpenAI drop-in replacement"] -->|extends| Python
         LCPYTHON["Langchain Python Integration"] -->|extends| Python
         Langflow -->|uses| LCPYTHON
         LiteLLM -->|uses| Python
      end
      subgraph s3["langfuse/langfuse-js"]
         JS["JS SDK"]
         LCJS["Langchain JS Integration"]  -->|extends| JS
         Flowise -->|uses| LCJS
      end
   end

   DB[Postgres Database]
	subgraph s1["Application (langfuse/langfuse)"]
      API[Public HTTP API]
      G[TRPC API]
      I[NextAuth]
      H[React Frontend]
      Prisma[Prisma ORM]
      H --> G
      H --> I
      G --> I
      G --- Prisma
      API --- Prisma
      I --- Prisma
	end
   Prisma --- DB
   JS --- API
   Python --- API
```

### Database Overview

The diagram below may not show all relationships if the foreign key is not defined in the database schema. For instance, `trace_id` in the `observation` table is not defined as a foreign key to the `trace` table to allow unordered ingestion of these objects, but it is still a foreign key in the application code.

Full database schema: [web/prisma/schema.prisma](web/prisma/schema.prisma)

<img src="./web/prisma/database.svg">

### Infrastructure & Network Overview

```mermaid
flowchart LR
   Browser ---|Web UI & TRPC API| App
   Integrations/SDKs ---|Public HTTP API| App
   subgraph i1["Application Network"]
      App["Langfuse Application (Docker or Serverless)"]
   end
   subgraph i2["Database Network"]
      DB["Postgres Database"]
   end
   App --- DB
```

## Repository Structure

We built a monorepo using [pnpm](https://pnpm.io/motivation) and [turbo](https://turbo.build/repo/docs) to manage the dependencies and build process. The monorepo contains the following packages:
- `web`: is the main application package providing Frontend and Backend APIs for Langfuse.
- `worker` (no production yet): contains an application for asynchronous processing of tasks. This package is not yet used in production.
- `shared`: contains shared code between the above packages.
- `config-eslint`: contains eslint configurations which are shared between the above packages.
- `config-typescript`: contains typescript configurations which are shared between the above packages.

## Development Setup

Requirements

- Node.js 20 as specified in the [.nvmrc](.nvmrc)
- Docker to run the database locally

**Steps**

1. Fork the the repository and clone it locally
2. Run the development database

   ```bash
   pnpm run infra:dev:up
   ```

3. Create an env file

   ```bash
    cp .env.dev.example .env
   ```

4. Install dependencies

   ```bash
   pnpm install
   ```

6. Run the migrations

   All database migrations and configs are in the `shared` package.

   ```bash
   pnpm run db:migrate

   # Optional: seed the database
   # pnpm --filter=shared run db:seed
   # pnpm --filter=shared run db:seed:examples
   # pnpm --filter=shared run db:seed:load
   ```

7. Start the development server

   ```bash
    pnpm run dev
   ```

## Monorepo quickstart

- Available packages and their dependencies

  Packages are included in the monorepo according to the `pnpm-workspace.yaml` file. Each package maintains its own dependencies defined in the `package.json`. Internal dependencies can be added as well by adding them to the package dependencies: `"@langfuse/shared": "workspace:*"`.

- Global commands

   You can run commands in all packages at once. For example, to install all dependencies in all packages, you can execute:

   ```bash
   pnpm install
   ```

   In the root `package.json`, you can find scripts which are executed with turbo e.g. `turbo run dev`. These scripts are executed with the help of Turbo. Turbo executes the commands in all packages taking care of the correct order of execution. Task definitions can be found in the `turbo.config.js` file.

- Executing commands (adding dependencies, running scripts, etc.)
  
   From the root of the package, you can execute commands in the monorepo using `pnpm` with the `--filter` flag. For example:
   
   ```bash
   pnpm --filter=web run dev
   pnpm --filter=shared run db:migrate
   ```

   Commands that you want to execute in a specific workspace, need to be defined in its `package.json`. E.g. `pnpm --filter=web run dev` will run the `dev` script defined in the `web` `package.json`.



> [!NOTE]
> If you frequently switch branches, use `pnpm run dx` instead of `pnpm run dev`. This command will install dependencies, reset the database (wipe and apply all migrations), and run the database seeder with example data before starting the development server.

> [!NOTE]
> If you find yourself stuck and want to clean the repo, execute `pnpm run nuke`. It will remove all node_modules and build files.

## Commit messages

On the main branch, we adhere to the best practices of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). All pull requests and branches are squash-merged to maintain a clean and readable history. This approach ensures the addition of a conventional commit message when merging contributions.

## Test the public API

The API is tested using Jest. With the development server running, you can run the tests with:

Run all

```bash
npm run test
```

Run interactively in watch mode

```bash
npm run test:watch
```

These tests are also run in CI.

## CI/CD

We use GitHub Actions for CI/CD, the configuration is in [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml)

CI on `main` and `pull_request`

- Check Linting
- E2E test of API using Jest
- E2E tests of UI using Playwright

CD on `main`

- Publish Docker image to GitHub Packages if CI passes. Done on every push to `main` branch. Only released versions are tagged with `latest`.

## Staging environment

We run a staging environment at [https://staging.langfuse.com](https://staging.langfuse.com) that is automatically deployed on every push to `main` branch.

The same environment is also used for preview deployments of pull requests. Limitations:

- SSO is not available as dynamic domains are not supported by most SSO providers.
- When making changes to the database, migrations to the staging database need to be applied manually by a maintainer. If you want to interactively test database changes in the staging environment, please reach out.

You can use the staging environment end-to-end with the Langfuse integrations or SDKs (host: `https://staging.langfuse.com`). However, please note that the staging environment is not intended for production use and may be reset at any time.

## Production environment

When a new release is tagged on the `main` branch (excluding prereleases), it triggers a production deployment. The deployment process consists of two steps:

1. The Docker image is published to GitHub Packages with the version number and `latest` tag.
2. The deployment is carried out on Langfuse Cloud. This is done by force pushing the `main` branch to the `production` branch during every release, using the [`release.yml`](.github/workflows/release.yml) GitHub Action.

## License

Langfuse is MIT licensed, except for `ee/` folder. See [LICENSE](LICENSE) and [docs](https://langfuse.com/docs/open-source) for more details.

When contributing to the Langfuse codebase, you need to agree to the [Contributor License Agreement](https://cla-assistant.io/langfuse/langfuse). You only need to do this once and the CLA bot will remind you if you haven't signed it yet.
