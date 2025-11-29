# Rotten Fountains — Quick Setup

Minimal steps to populate the database and run the app using Docker Postgres.

## 1) Start Postgres (Docker)
```bash
docker run --name rotten-pg \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=restapi \
  -p 5432:5432 -d postgres:15
```

## 2) Create environment file
```bash
cat > .env <<'EOF'
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=admin
PGDATABASE=restapi
EOF
```

## 3) Install dependencies
```bash
npm install
```

## 4) Seed or import data
- Seed sample data:
```bash
npm run seed
```
- Or import your spreadsheet (CSV/XLSX at repo root):
```bash
# Dry-run
node scripts/import-csv.js ./Rotten_Fountains.csv --dry-run
# Import
node scripts/import-csv.js ./Rotten_Fountains.csv
```

## 5) Optional: placeholders & videos
- Generate image placeholders to avoid 404s:
```bash
npm run placeholders
```
- Ensure videos are H.264 (if needed):
```bash
chmod +x scripts/reencode-videos.sh
./scripts/reencode-videos.sh
mv public/videos/reencoded/*.mp4 public/videos/
```

## 6) Run the app
```bash
npm run dev
```
Open `http://localhost:3000` and visit `/fountains/1`.

## 7) Reset & re-import (optional)
```bash
psql -c "TRUNCATE TABLE fountains RESTART IDENTITY;"
node scripts/import-csv.js ./Rotten_Fountains.csv
npm run placeholders
```
