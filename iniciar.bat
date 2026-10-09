@echo off
cd /d "%~dp0"
echo Iniciando o servidor do Nocaute CT...
node server.js
echo.
echo Se houver um erro acima, confira se o Node.js esta instalado.
pause
