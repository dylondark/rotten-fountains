# Project Setup: Importing Rotten_Fountains.csv

This guide walks you through configuring the environment, importing the dataset, generating image placeholders, and verifying everything locally.

## Prerequisites
- Node.js 18+
- A running PostgreSQL instance
- CSV or XLSX dataset: `Rotten_Fountains.csv` (or `.xlsx`)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure Postgres environment
Set environment variables so the app and scripts can connect to your database. Adjust values to your setup.

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=your_user
export PGPASSWORD=your_password
export PGDATABASE=your_database
```

Optionally, put these in `.env` or `.env.local`.

## 3) Verify DB connection

```bash
npm run test:db
```

## 4) Import the dataset (dry-run first)
Place your dataset in the repo root or `data/`. Example below assumes `./Rotten_Fountains.csv` at the repo root.

```bash
# Dry-run (parses and validates, no inserts)
node scripts/import-csv.js ./Rotten_Fountains.csv --dry-run

# Actual import
node scripts/import-csv.js ./Rotten_Fountains.csv
```

If using Excel:

```bash
node scripts/import-csv.js ./Rotten_Fountains.xlsx --dry-run
node scripts/import-csv.js ./Rotten_Fountains.xlsx
```

Notes:
- Flavor ratings are stored exactly as raw strings.
- Image paths are set to `/fountains/<id>_fountain.jpg` and `/fountains/<id>_cup.jpg` if your dataset doesn’t provide images.

## 5) Generate local image placeholders
The app references image paths under `public/fountains/`. If real images are not present, generate 1×1 JPEG placeholders so pages don’t 404.

```bash
npm run placeholders
```

This creates files for every fountain id:
- `public/fountains/<id>_fountain.jpg`
- `public/fountains/<id>_cup.jpg`

Alternatively, you can add your own real images to `public/fountains/` using the same naming scheme.

## 6) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`. Visit a detail page, e.g. `http://localhost:3000/fountains/1`.

## 7) Quick verification queries

```bash
# See first 10 rows
psql -c "SELECT id, number, location, flavorrating, images FROM fountains ORDER BY id LIMIT 10;"

# Count total imported rows
psql -c "SELECT COUNT(*) FROM fountains;"
```

## Re-import instructions (resetting ids)
If you need to start over and re-import:

```bash
psql -c "TRUNCATE TABLE fountains RESTART IDENTITY;"
node scripts/import-csv.js ./Rotten_Fountains.csv
npm run placeholders
```

## Troubleshooting
- 404 images: run `npm run placeholders` or add real files under `public/fountains/`.
- Reviews/users warnings: the page logs errors if a `users` table is missing. This doesn’t affect fountains display. We can add a simple `users` table later if needed.
- ESM warnings: `package.json` includes `"type":"module"` to avoid Node ESM warnings.

### Video playback issues ("No video with supported format")
Most mobile devices record in HEVC/H.265 (`codec_name=hevc` / `hvc1`). Chrome and some desktop browsers may not decode these files. Re-encode to baseline H.264 + AAC.

Quick check of a file:
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 public/videos/1.mp4
```
If output is `hevc`, re-encode:
```bash
ffmpeg -i public/videos/1.mp4 -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -movflags +faststart public/videos/1_h264.mp4
mv public/videos/1_h264.mp4 public/videos/1.mp4
```

Batch re-encode all videos:
```bash
chmod +x scripts/reencode-videos.sh
./scripts/reencode-videos.sh
mv public/videos/reencoded/*.mp4 public/videos/
```
The script skips files already in H.264. After replacing, refresh the fountain page.
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

## Importing data from a spreadsheet (CSV)

If your fountain data is in a spreadsheet (Excel or Google Sheets), export it as CSV and then import it into the database using the provided script.

Expected CSV headers (case-insensitive):
- number
- location
- description
- flavorDescription (or flavordescription)
- flavorRating
- images (optional) — can be a comma/pipe/semicolon-separated list of image paths or URLs

Example export and import:

1. In Google Sheets: File → Download → Comma-separated values (.csv, current sheet)
2. From the project root, run:

```bash
# create DB and .env as documented earlier, then:
# CSV or XLSX are supported. Example with the included file:
npm run import:csv Rotten_Fountains.csv

# Options:
#   --dry-run           parse + transform only, no DB writes
#   --batch-size 1000  change insert batch size (default 500)
node ./scripts/import-csv.js --dry-run Rotten_Fountains.csv
```

The script will parse the CSV and insert rows into the `fountains` table. If you need to transform columns, edit `scripts/import-csv.js` to map headers.

## Removing tables (DROP vs TRUNCATE)

- To remove all rows but keep a table and its identity sequence, use TRUNCATE:

```bash
psql "postgresql://postgres:admin@localhost:5432/restapi" -c "TRUNCATE TABLE fountains RESTART IDENTITY;"
```

- To delete a table entirely (and optionally its dependencies), use the new helper script:

```bash
# Drop one or more tables
npm run drop:tables -- fountains

# Drop with CASCADE (also drops dependent objects)
npm run drop:tables -- --cascade fountains

# Or multiple tables at once
npm run drop:tables -- fountains reviews
```

You can also run the equivalent SQL directly:

```bash
psql "postgresql://postgres:admin@localhost:5432/restapi" -c "DROP TABLE IF EXISTS fountains CASCADE;"
```

## Notes
- The project uses `src/utils/postgres.js` which reads connection settings from env vars. Do not commit `.env` to git.
- If you see Node ESM warnings when running `npm run seed` or `npm run test:db`, you can add `"type": "module"` to `package.json` or ignore the warning. The scripts run fine under ESM.
- To reset or re-seed the database, re-run `npm run seed`.


npm install
Env:
export PGHOST=localhost
export PGPORT=5432
export PGUSER=your_user
export PGPASSWORD=your_password
export PGDATABASE=your_database
Dry-run:
node [import-csv.js](http://_vscodecontentref_/3) [Rotten_Fountains.csv](http://_vscodecontentref_/4) --dry-run
Import:
node [import-csv.js](http://_vscodecontentref_/5) ./Rotten_Fountains.csv
Placeholders:
npm run placeholders
Dev:
npm run dev
