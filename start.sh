#!/bin/bash

cd frontend && npm i && npm run dev &
cd backend && python server.py &
