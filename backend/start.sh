#!/bin/bash
set -e

echo "Running Prisma DB Push..."
npx prisma db push --accept-data-loss

echo "Running seed to create default users..."
node scripts/seed-complete.js || echo "Seed failed or users already exist, continuing..."

echo "Starting server..."
npm start
