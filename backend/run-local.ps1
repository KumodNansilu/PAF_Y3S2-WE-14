# Load environment variables from .env.local
$envFile = Join-Path -Path $PSScriptRoot -ChildPath ".env.local"

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ([string]::IsNullOrWhiteSpace($_) -or $_.Trim().StartsWith("#")) {
            return
        }

        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()

            # Support quoted values in .env.local
            if ($value -match '^[''\"](.+)[''\"]$') {
                $value = $Matches[1]
            }

            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  Set: $key" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host ".env.local not found. Using environment defaults." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Spring Boot backend..." -ForegroundColor Green
Write-Host "API will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Authenticated endpoints require Google OAuth login." -ForegroundColor Cyan
Write-Host ""

$localMavenRepo = Join-Path -Path $PSScriptRoot -ChildPath ".m2\repository"
if (-not (Test-Path $localMavenRepo)) {
    New-Item -Path $localMavenRepo -ItemType Directory -Force | Out-Null
}

& .\mvnw.cmd "-Dmaven.repo.local=$localMavenRepo" spring-boot:run
