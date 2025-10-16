# Setup for rotten-fountains (Postgres + seed)

This file documents the exact steps to get the project running with a local Postgres database. Use these steps when you clone the repo on a new machine.

## Prerequisites
- Node.js 18+ (we used Node 23 in dev; Node 18+ should be fine)
- npm
- Either Docker (recommended) or Postgres installed locally, or a hosted Postgres (Supabase, Railway, ElephantSQL)

## Steps (Docker - recommended)
1. Install Docker Desktop / Docker Engine for your OS.
2. From the project root, run:

```bash
docker run --name rotten-pg \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=restapi \
  -p 5432:5432 -d postgres:15
```

3. Wait a few seconds for the DB to initialize, then create a `.env` file (or set environment variables):

```bash
cat > .env <<'EOF'
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=admin
PGDATABASE=restapi
EOF
```

4. Install dependencies and run the seed:

```bash
npm install
npm run seed
npm run test:db
npm run dev
```

## Steps (Install Postgres locally)
1. On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
```

2. Set a password for `postgres` and create the `restapi` DB:

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'admin';"
sudo -u postgres psql -c "CREATE DATABASE restapi OWNER postgres;"
```

3. Create `.env` with matching credentials (see Docker steps), then run:

```bash
npm install
npm run seed
npm run test:db
npm run dev
```

## Steps (Hosted Postgres)
1. Create a database on Supabase / Railway / ElephantSQL.
2. Copy connection details into a `.env` file (or set environment variables):

```
PGHOST=<host>
PGPORT=<port>
PGUSER=<user>
PGPASSWORD=<password>
PGDATABASE=<database>
```

3. Install deps and run seed:

```bash
npm install
npm run seed
npm run test:db
npm run dev
```

## Notes
- The project uses `src/utils/postgres.js` which reads connection settings from env vars. Do not commit `.env` to git.
- If you see Node ESM warnings when running `npm run seed` or `npm run test:db`, you can add `"type": "module"` to `package.json` or ignore the warning. The scripts run fine under ESM.
- To reset or re-seed the database, re-run `npm run seed`.

If you want, I can create a small `Makefile` or npm task to automate `docker run`, `.env` creation, and seeding.
