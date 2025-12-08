#!/bin/bash

# L2C Database Backup & Recovery Drill Script
# Usage: ./backup-drill.sh [prod_db_url]

set -e

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# Check for Docker (required for local Supabase)
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install it first."
    exit 1
fi

DB_URL=$1

if [ -z "$DB_URL" ]; then
    echo "⚠️  No production DB URL provided. Skipping production dump."
    echo "ℹ️  Usage: ./backup-drill.sh [postgres://user:pass@host:port/db]"
    echo "ℹ️  Will proceed with local-only drill simulation."
else
    echo "🚀 Starting Backup Drill from Production..."
    
    # 1. Dump Production Data
    echo "📦 Dumping production database..."
    supabase db dump --db-url "$DB_URL" -f backup_drill.sql
    echo "✅ Dump complete: backup_drill.sql"
fi

# 2. Start Local Supabase (if not running)
echo "🔄 Starting local Supabase instance..."
supabase start || echo "ℹ️  Supabase might already be running"

# 3. Reset Local Database (Simulate Disaster)
echo "🔥 Simulating disaster: Resetting local database..."
supabase db reset

# 4. Restore Data (Simulate Recovery)
if [ -f "backup_drill.sql" ]; then
    echo "🚑 Restoring from backup..."
    # Note: Using PGPASSWORD to avoid prompt if possible, or rely on .pgpass
    # Ideally use supabase db reset --db-url but here we want to test the SQL file import
    
    # Get local DB config
    LOCAL_DB_PORT=$(supabase status -o json | grep -o '"port": [0-9]*' | head -1 | awk '{print $2}')
    if [ -z "$LOCAL_DB_PORT" ]; then
        LOCAL_DB_PORT=54322 # Default fallback
    fi
    
    echo "ℹ️  Targeting local DB on port $LOCAL_DB_PORT"
    
    # Import using psql inside docker or local psql if available
    # Using supabase db query is safer for local env
    # But 'supabase db dump' creates a file meant for psql. 
    # Let's try to use psql directly if installed, otherwise warn.
    
    if command -v psql &> /dev/null; then
        PGPASSWORD=postgres psql -h localhost -p "$LOCAL_DB_PORT" -U postgres -f backup_drill.sql postgres
        echo "✅ Restoration complete!"
    else
        echo "⚠️  'psql' command not found. Cannot automatically restore SQL file."
        echo "ℹ️  Please manually run: psql -h localhost -p $LOCAL_DB_PORT -U postgres -f backup_drill.sql postgres"
    fi
else
    echo "⚠️  No backup file found to restore. (Did you provide a DB URL?)"
    echo "ℹ️  Creating a dummy backup for testing..."
    echo "CREATE TABLE IF NOT EXISTS drill_test (id serial primary key, drill_time timestamp default now());" > dummy_backup.sql
    echo "INSERT INTO drill_test DEFAULT VALUES;" >> dummy_backup.sql
    
    LOCAL_DB_PORT=54322
    if command -v psql &> /dev/null; then
        PGPASSWORD=postgres psql -h localhost -p "$LOCAL_DB_PORT" -U postgres -f dummy_backup.sql postgres
        echo "✅ Dummy restoration complete!"
    fi
fi

# 5. Verify
echo "🔍 Verification:"
echo "   Please check the local dashboard (http://localhost:54323) to verify data integrity."

echo "🎉 Drill Script Finished."
