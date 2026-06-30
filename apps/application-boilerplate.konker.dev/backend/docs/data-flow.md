# Data flow

How data moves through application-boilerplate, from the browser frontend to
Postgres and back. The app is a Zero-sync stack with three deployed surfaces plus
the database:

| Surface      | Dev URL                                                              | Role                                                                                                                     |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend SPA | `application-boilerplate.development.konker.dev`                     | Static SolidJS build (S3 + CloudFront). Holds the Zero client.                                                           |
| zero-cache   | `zero-sync.application-boilerplate.development.konker.dev` (`:4848`) | Sync engine. Verifies the user JWT, serves reads from a replica, relays mutations, replicates from Postgres.             |
| Backend API  | `api.application-boilerplate.development.konker.dev`                 | Hono app exposing `/zero/query` and `/zero/mutate` (plus `/`, `/foo`, `/ping`). Server-authoritative queries + mutators. |
| Postgres     | reached via `ssh-tunnel-proxy`                                       | Source of truth (`widgets` table). Logical-replication publication feeds zero-cache.                                     |

Two trust boundaries matter:

- **User auth** — an HS256 JWT (issuer `application-boilerplate-development`, minted
  out-of-band) is verified by zero-cache (`ZERO_AUTH_SECRET`) _and_ re-verified by the
  backend (`JWT_SIGNING_SECRET` / `JWT_ISSUER`). `sub` is the user id.
- **Service auth** — zero-cache calls the backend with `X-Api-Key`
  (`ZERO_QUERY_API_KEY` / `ZERO_MUTATE_API_KEY`), which the backend checks against
  `ZERO_BACKEND_SERVICE_TOKEN`, proving the request came from zero-cache and not a
  browser hitting `/zero/*` directly.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend SPA<br/>(SolidJS + Zero client)
    participant ZC as zero-cache<br/>(zero-sync :4848)
    participant API as Backend API<br/>(Hono /zero/*)
    participant DB as Postgres<br/>(widgets + replication)

    Note over FE,DB: Connect & authenticate
    User->>FE: Paste JWT (sub, issuer, HS256)
    FE->>ZC: Open WebSocket (cacheURL)<br/>auth = JWT, userID = sub
    ZC->>ZC: Verify JWT with ZERO_AUTH_SECRET<br/>(no/invalid token ⇒ anonymous)

    Note over FE,DB: Read path (queries)
    FE->>ZC: Subscribe to named query (useQuery)
    ZC->>API: POST /zero/query<br/>X-Api-Key + Authorization: Bearer JWT
    API->>API: Check X-Api-Key == ZERO_BACKEND_SERVICE_TOKEN<br/>verify user JWT ⇒ authData {sub}
    API-->>ZC: Resolved/authorized query
    ZC->>DB: Read from local replica<br/>(synced via logical replication)
    ZC-->>FE: Stream results over WebSocket
    FE-->>User: Render rows (reactive)

    Note over FE,DB: Write path (custom mutators)
    User->>FE: Create / update / delete widget
    FE->>FE: Run mutator optimistically<br/>update local store (IndexedDB)
    FE-->>User: Instant optimistic UI
    FE->>ZC: Push mutation over WebSocket
    ZC->>API: POST /zero/mutate<br/>X-Api-Key + Authorization: Bearer JWT
    API->>API: Check service key + verify JWT<br/>assertIsLoggedIn(authData)
    API->>DB: Run server mutator in a transaction<br/>(app user: write widgets,<br/>track client in application_boilerplate_0)
    DB-->>API: Commit
    API-->>ZC: Mutation result
    DB-->>ZC: Change via logical replication<br/>(publication application_boilerplate_zero_data)
    ZC->>ZC: Update replica
    ZC-->>FE: Poke + authoritative rows
    FE->>FE: Reconcile optimistic state
    FE-->>User: Confirmed UI
```

## Notes

- **Same-vs-cross origin.** The browser only talks to two origins directly: the
  WebSocket to zero-cache and (indirectly) the backend. The `/zero/query` and
  `/zero/mutate` calls are made **server-to-server by zero-cache**, not by the
  browser — so no backend CORS is needed. The only browser cross-origin lever is the
  CloudFront `connect-src` CSP allowing the zero-cache `https`/`wss` origin.
- **Optimistic then authoritative.** The same mutator function runs twice: instantly
  on the client against the local store, then authoritatively on the backend inside a
  DB transaction. zero-cache reconciles the two once the committed change replicates
  back, so a rejected mutation (e.g. `assertIsLoggedIn` failing) rolls the optimistic
  change back.
- **Replication, not direct writes from zero-cache.** zero-cache never writes app
  rows itself; the backend mutator owns writes. zero-cache learns about committed
  changes through Postgres logical replication and maintains its own replica + the
  `application_boilerplate_0` shard schema (client/mutation tracking).
