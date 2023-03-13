@echo off

start cmd /k "cd frontend && npm i && npm run dev"
start cmd /k "cd backend && python server.py"
