@echo off
cd /d "%~dp0"
echo Instalando Node.js...
powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi' -OutFile 'nodejs.msi'}"
start /wait nodejs.msi /quiet /norestart
echo Instalando dependencias...
npm install
echo Instalación completa.
pause