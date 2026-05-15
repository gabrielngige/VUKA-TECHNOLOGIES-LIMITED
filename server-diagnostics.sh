#!/bin/bash
# Server Diagnostic Script
# Run with: bash server-diagnostics.sh

echo "🔍 Vuka Cereals Server Diagnostics"
echo "===================================="
echo ""

# 1. Check Node.js
echo "1️⃣  Node.js & NPM:"
node --version
npm --version
echo ""

# 2. Check .env file
echo "2️⃣  Environment Configuration:"
if [ -f server/.env ]; then
    echo "✓ .env file exists"
    echo "  Required variables:"
    grep "^[A-Z]" server/.env | head -5
    if grep -q "JWT_SECRET" server/.env; then
        echo "  ✓ JWT_SECRET set"
    else
        echo "  ✗ JWT_SECRET missing - add to server/.env"
    fi
else
    echo "✗ .env file missing - copy from .env.example"
    echo "  cp server/.env.example server/.env"
fi
echo ""

# 3. Check database files
echo "3️⃣  Database Files:"
for file in users.json orders.json; do
    if [ -f "server/db/$file" ]; then
        echo "✓ $file exists ($(wc -c < server/db/$file) bytes)"
    else
        echo "✗ $file missing"
    fi
done
echo ""

# 4. Check uploads directory
echo "4️⃣  Uploads Directory:"
if [ -d "server/uploads" ]; then
    echo "✓ Directory exists"
else
    echo "✗ Directory missing - creating it..."
    mkdir -p server/uploads
    echo "  Created server/uploads"
fi
echo ""

# 5. Check dependencies
echo "5️⃣  Dependencies:"
echo "Checking critical packages..."
npm list express cors bcryptjs jsonwebtoken axios multer 2>/dev/null | grep -E "^├|^└" | head -10
echo ""

# 6. Check if database is valid JSON
echo "6️⃣  Database Validation:"
for file in server/db/*.json; do
    if [ -f "$file" ]; then
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            echo "✓ $(basename $file) is valid JSON"
        else
            echo "✗ $(basename $file) has INVALID JSON - fix or reset"
        fi
    fi
done
echo ""

# 7. Port check
echo "7️⃣  Port Availability:"
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠ Port 4000 is already in use"
    echo "  Process: $(lsof -i :4000 -t)"
else
    echo "✓ Port 4000 is available"
fi
echo ""

# 8. Git status (if in repo)
echo "8️⃣  Changes:"
if [ -d ".git" ]; then
    changed=$(git status --porcelain | wc -l)
    if [ $changed -gt 0 ]; then
        echo "⚠ $changed files have uncommitted changes"
    else
        echo "✓ No uncommitted changes"
    fi
fi
echo ""

echo "===================================="
echo "Diagnostics complete! ✓"
echo ""
echo "Next steps:"
echo "1. Fix any missing files (✗)"
echo "2. Set environment variables in .env"
echo "3. Run: npm run dev"
echo "4. Check server logs for errors"
