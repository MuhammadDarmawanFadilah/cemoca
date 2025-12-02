#!/bin/bash

# IKAFK Alumni Database Drop Script
# Script untuk menghapus database ikafk_alumni
# ⚠️  WARNING: This will permanently delete all data!

set -e  # Exit on any error

echo "⚠️  IKAFK Alumni Database Drop Script"
echo "=========================================="
echo "⚠️  WARNING: This will permanently delete ALL data in ikafk_alumni database!"
echo "⚠️  This action CANNOT be undone!"
echo ""

# Variables
DATABASE_NAME="ikafk_alumni"
MYSQL_USER="root"

# Function to check if database exists
check_database_exists() {
    local db_exists=$(mysql -u $MYSQL_USER -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DATABASE_NAME';" 2>/dev/null | grep -c "$DATABASE_NAME" || echo "0")
    echo $db_exists
}

# Function to get database size
get_database_size() {
    local size=$(mysql -u $MYSQL_USER -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='$DATABASE_NAME';" 2>/dev/null | tail -1)
    echo $size
}

# Function to get table count
get_table_count() {
    local count=$(mysql -u $MYSQL_USER -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DATABASE_NAME';" 2>/dev/null | tail -1)
    echo $count
}

# Step 1: Check if database exists
echo "🔍 Checking if database exists..."
if [ "$(check_database_exists)" -eq 0 ]; then
    echo "❌ Database '$DATABASE_NAME' does not exist!"
    echo "✅ Nothing to drop."
    exit 0
fi

echo "✅ Database '$DATABASE_NAME' found"

# Step 2: Show database information
echo ""
echo "📊 Database Information:"
echo "- Database Name: $DATABASE_NAME"
echo "- Size: $(get_database_size) MB"
echo "- Tables: $(get_table_count)"
echo ""

# Step 3: List all tables
echo "📋 Tables in database:"
mysql -u $MYSQL_USER -e "SHOW TABLES FROM $DATABASE_NAME;" 2>/dev/null || echo "No tables found"
echo ""

# Step 4: Confirmation prompt
echo "⚠️  FINAL WARNING: You are about to DROP the entire '$DATABASE_NAME' database!"
echo "⚠️  This will delete:"
echo "   - All user data"
echo "   - All payment records"
echo "   - All roles and permissions"
echo "   - All application data"
echo "   - ALL TABLES AND DATA"
echo ""
read -p "❓ Are you absolutely sure you want to continue? Type 'YES' to confirm: " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Operation cancelled by user"
    echo "✅ Database preserved"
    exit 0
fi

echo ""
echo "⏳ Proceeding with database drop..."

# Step 5: Stop related services (optional safety measure)
echo "⏹️  Stopping related services for safety..."
if systemctl is-active --quiet ikafk-frontend; then
    sudo systemctl stop ikafk-frontend
    echo "✅ Frontend service stopped"
fi

if systemctl is-active --quiet tomcat; then
    sudo systemctl stop tomcat
    echo "✅ Tomcat service stopped"
fi

# Step 6: Drop the database
echo "🗑️  Dropping database '$DATABASE_NAME'..."
mysql -u $MYSQL_USER -e "DROP DATABASE IF EXISTS $DATABASE_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database '$DATABASE_NAME' successfully dropped!"
else
    echo "❌ Failed to drop database '$DATABASE_NAME'"
    exit 1
fi

# Step 7: Verify deletion
echo "🔍 Verifying database deletion..."
if [ "$(check_database_exists)" -eq 0 ]; then
    echo "✅ Confirmed: Database '$DATABASE_NAME' no longer exists"
else
    echo "⚠️  Warning: Database '$DATABASE_NAME' still exists"
fi

# Step 8: Restart services
echo "▶️  Restarting services..."
sudo systemctl start tomcat
echo "✅ Tomcat service started"

sudo systemctl start ikafk-frontend
echo "✅ Frontend service started"

# Step 9: Show completion summary
echo ""
echo "🎉 DATABASE DROP COMPLETED!"
echo "========================================"
echo "✅ Database '$DATABASE_NAME' has been permanently deleted"
echo "✅ All data has been removed"
echo "✅ Services have been restarted"
echo "✅ Operation completed at: $(date)"
echo ""
echo "📝 Next Steps:"
echo "1. If you want to recreate the database, run the deployment script"
echo "2. The application will create a new empty database on next startup"
echo "3. You may need to re-seed initial data if required"
echo ""
echo "⚠️  Remember: This action was irreversible!"
echo "✅ Database drop operation completed successfully!"