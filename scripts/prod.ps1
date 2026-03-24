# Production deployment script for Acquisition App
# This script starts the application in production mode with Neon Cloud Database

Write-Host "🚀 Starting Acquisition App in Production Mode"
Write-Host "==============================================="

# Check if .env.production exists
if (!(Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found!"
    Write-Host "   Please create .env.production with your production environment variables."
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
}
catch {
    Write-Host "❌ Error: Docker is not running!"
    Write-Host "   Please start Docker and try again."
    exit 1
}

Write-Host "📦 Building and starting production container..."
Write-Host "   - Using Neon Cloud Database (no local proxy)"
Write-Host "   - Running in optimized production mode"
Write-Host ""

# Start production environment
docker compose -f docker-compose.prod.yml up --build -d

# Wait for DB to be ready (basic delay)
Write-Host "⏳ Waiting for database to be ready..."
Start-Sleep -Seconds 5

# Run migrations with Drizzle
Write-Host "📜 Applying latest schema with Drizzle..."
npm run db:migrate

Write-Host ""
Write-Host "🎉 Production environment started!"
Write-Host "   Application: http://localhost:3000"
Write-Host "   Logs: docker logs acquisition-app-prod"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "   View logs: docker logs -f acquisition-app-prod"
Write-Host "   Stop app: docker compose -f docker-compose.prod.yml down"