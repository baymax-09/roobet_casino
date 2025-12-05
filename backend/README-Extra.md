# Extra

## Useful Commands

### Tilt and Docker Compose for local development

A `docker-compose.yml` exists at the project root to provide a reference environment.

For active development on the api, it is recommended to run the dev server as per Bare Metal above.

- `npm run dev:docker:node` - run ALL containers via `docker compose`
  - Builds images if none available
  - Uses `.env` and `local/node.Dockerfile` by default
- `docker stop roobet-backend|roobet-crash|roobet-mongo|etc.`
- `docker compose build` - situational flags: `--no-cache`, `--pull`
  - Build images
  - You will need to run this if `package.json` dependencies change
- `docker ps` - verify `atlanta-[api|crash|specificworker|allworkers]` are `RUNNING`

You can also accomplish most docker commands via Docker Desktop -> `Containers/Apps`
