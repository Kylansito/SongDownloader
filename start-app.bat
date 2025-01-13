@echo off
cd /d "%~dp0"
start cmd /k "node ./src/Backend/server.js"
start cmd /k "npm run dev"
start http://localhost:3000