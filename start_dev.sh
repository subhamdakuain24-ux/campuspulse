#!/bin/bash
# CampusPulse Full-Stack Development Server Launcher
set -e

# Ensure dependencies and database are prepared
python3 -c "import socket; s = socket.socket(); err = s.connect_ex(('127.0.0.1', 5000)); s.close(); exit(0 if err == 0 else 1)" 2>/dev/null || {
    echo "[CampusPulse] Launching Flask backend API on port 5000..."
    python3 backend/app.py >/dev/null 2>&1 &
    sleep 0.8
}

# Launch Vite Dev Server on port 3000
exec vite --port=3000 --host=0.0.0.0 "$@"
