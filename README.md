# Testing - unit tests - e2e tests - Demo Shop app

<p align="center">
  <a href="http://nestjs.com/">
    <img src="https://nestjs.com/img/logo-small.svg" alt="Nest Logo" width="200px"/>
  </a>
</p>

## After clone

1. **Clone the project**

2. `npm install`

3. **Clone the `.env.template` file and rename it to `.env`**

4. **Change the environment variables**

5. **Bring up the database**

   ```bash
   docker-compose up -d
   ```

6. **Start the application**: `npm start:dev`

---

## Specific Topics

In the first section, we'll be setting up and working on a real backend Nest. The idea is to have a complete backend with decorators, a database, and Nest-specific functionalities to test all possible cases.

Specifically, in this section, I want to focus on:

- **Mocks**
- **DTOs**
- **Requests**
- **Custom Decorators**
- **Entities**
- **Guards**
- **Spies**
- **Returning Partial Implementations**

---

In the second section, we'll work with services, modules, controllers, and the `bootstrap` function, but additionally, we'll need to **simulate everything related to our users' authentication process**.

Specifically, we'll cover:

- **Spies**
- **Mocks**
- **Exceptions**
- **Bcrypt**
- **Configurations and Mock Return values**
- **MockReturnThis**, for using the builder pattern
- etc.

---

This section es the final unit testing section before moving on to E2E. It's relatively complex because we'll be testing objects with many dependencies. While these come in as injections, we still need to prepare mock objects that let us simulate various scenarios.

Specifically, we'll cover:

- **Products Service Tests**
  - (This involves multiple repositories and DB transactions)
- **UUID Tests**
- **QueryRunner, Commit, and Rollback Tests**
- **File Upload Methods**
- **FilesService Tests**

---

## Required config for e2e testing

To ensure a clear distinction and accurate reporting, you **must separate the coverage reports** for your unit tests and end-to-end (e2e) tests. This is crucial because unit tests cover isolated logic, while e2e tests validate full application flows and integrations. Mixing their coverage can give a misleading view of your application's tested surface.

To achieve this separation, you'll need a dedicated Jest configuration file for your e2e tests, typically named `jest-e2e.json`. Your `package.json` scripts should then point to this specific configuration:

```json
// build after pass all unit tests ant e2e tests
  "build": "npm run test && npm run test:e2e && nest build",
// ...other scripts
  "test:e2e": "jest --config ./jest-e2e.json",
  "test:e2e:watch": "jest --config ./jest-e2e.json --watch",
  "test:e2e:cov": "jest --config ./jest-e2e.json --coverage"
// ...rest of scripts
```

After config, we recommend move the e2e testing files to `./test/e2e`.
