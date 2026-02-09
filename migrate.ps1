# migrate.ps1
# Script de migração de estrutura de pastas

Write-Host "🚀 Iniciando migração..." -ForegroundColor Cyan
Write-Host ""

# Função para mover diretórios
function Move-Directory {
    param(
        [string]$From,
        [string]$To
    )

    if (-Not (Test-Path $From)) {
        Write-Host "⚠️  Skipping: $From (não existe)" -ForegroundColor Yellow
        return
    }

    # Criar diretório de destino
    $toDir = Split-Path $To -Parent
    if (-Not (Test-Path $toDir)) {
        New-Item -ItemType Directory -Path $toDir -Force | Out-Null
    }

    # Verificar se destino já existe
    if (Test-Path $To) {
        Write-Host "⚠️  Destino já existe: $To" -ForegroundColor Yellow
        return
    }

    try {
        Move-Item -Path $From -Destination $To -Force
        Write-Host "✅ Movido: $From → $To" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao mover ${From}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Criar estrutura base de features
Write-Host "📁 Criando estrutura de features..." -ForegroundColor Cyan
$features = @("auth", "dashboard", "regions", "supply", "users", "transactions", "forms")
foreach ($feature in $features) {
    $dirs = @("api", "components", "hooks", "pages", "types")
    foreach ($dir in $dirs) {
        $path = "src\features\$feature\$dir"
        if (-Not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }
}

# Criar estrutura shared
Write-Host "📁 Criando estrutura shared..." -ForegroundColor Cyan
$sharedDirs = @(
    "src\shared\components\ui",
    "src\shared\components\layout",
    "src\shared\components\feedback",
    "src\shared\hooks",
    "src\shared\lib\api",
    "src\shared\lib\services",
    "src\shared\utils",
    "src\shared\types",
    "src\shared\constants"
)
foreach ($dir in $sharedDirs) {
    if (-Not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host ""
Write-Host "🔄 Movendo arquivos..." -ForegroundColor Cyan
Write-Host ""

# ========================================
# AUTH
# ========================================
Write-Host "📦 Migrando Auth..." -ForegroundColor Magenta
Move-Directory "src\components\auth" "src\features\auth\components\auth"
Move-Directory "src\pages\AuthPages" "src\features\auth\pages"

# ========================================
# DASHBOARD
# ========================================
Write-Host "📦 Migrando Dashboard..." -ForegroundColor Magenta
Move-Directory "src\components\charts" "src\features\dashboard\components\charts"
Move-Directory "src\components\ecommerce" "src\features\dashboard\components\ecommerce"
Move-Directory "src\pages\Dashboard" "src\features\dashboard\pages"
Move-Directory "src\pages\Charts" "src\features\dashboard\pages\charts"

# ========================================
# REGIONS
# ========================================
Write-Host "📦 Migrando Regions..." -ForegroundColor Magenta
Move-Directory "src\components\Regions" "src\features\regions\components\Regions"
Move-Directory "src\components\tables\RegionList" "src\features\regions\components\RegionList"

# ========================================
# SUPPLY
# ========================================
Write-Host "📦 Migrando Supply..." -ForegroundColor Magenta
Move-Directory "src\components\Supply" "src\features\supply\components\Supply"
Move-Directory "src\components\tables\SupplyList" "src\features\supply\components\SupplyList"

# ========================================
# USERS
# ========================================
Write-Host "📦 Migrando Users..." -ForegroundColor Magenta
Move-Directory "src\components\user" "src\features\users\components\user"
Move-Directory "src\components\UserProfile" "src\features\users\components\UserProfile"
Move-Directory "src\components\tables\UserList" "src\features\users\components\UserList"
Move-Directory "src\pages\Users" "src\features\users\pages"

# ========================================
# FORMS
# ========================================
Write-Host "📦 Migrando Forms..." -ForegroundColor Magenta
Move-Directory "src\components\form" "src\features\forms\components"
Move-Directory "src\pages\Forms" "src\features\forms\pages"

# ========================================
# SHARED - UI COMPONENTS
# ========================================
Write-Host "📦 Migrando Shared UI..." -ForegroundColor Magenta
Move-Directory "src\components\ui" "src\shared\components\ui\temp"
if (Test-Path "src\shared\components\ui\temp") {
    Get-ChildItem "src\shared\components\ui\temp" | Move-Item -Destination "src\shared\components\ui" -Force
    Remove-Item "src\shared\components\ui\temp" -Force
}
Move-Directory "src\components\common" "src\shared\components\ui\common"

# ========================================
# SHARED - LAYOUT
# ========================================
Write-Host "📦 Migrando Layout..." -ForegroundColor Magenta
Move-Directory "src\layout" "src\shared\components\layout\temp"
if (Test-Path "src\shared\components\layout\temp") {
    Get-ChildItem "src\shared\components\layout\temp" | Move-Item -Destination "src\shared\components\layout" -Force
    Remove-Item "src\shared\components\layout\temp" -Force
}
Move-Directory "src\components\header" "src\shared\components\layout\Header"

# ========================================
# SHARED - HOOKS
# ========================================
Write-Host "📦 Migrando Hooks..." -ForegroundColor Magenta
if (Test-Path "src\hooks") {
    Get-ChildItem "src\hooks\*" | Move-Item -Destination "src\shared\hooks" -Force
}

# ========================================
# SHARED - TYPES
# ========================================
Write-Host "📦 Migrando Types..." -ForegroundColor Magenta
if (Test-Path "src\types") {
    Get-ChildItem "src\types\*" | Move-Item -Destination "src\shared\types" -Force
}

# ========================================
# SHARED - API/SERVICES
# ========================================
Write-Host "📦 Migrando API e Services..." -ForegroundColor Magenta
if (Test-Path "src\api") {
    Get-ChildItem "src\api\*" | Move-Item -Destination "src\shared\lib\api" -Force
}
if (Test-Path "src\service") {
    Get-ChildItem "src\service\*" | Move-Item -Destination "src\shared\lib\services" -Force
}

# ========================================
# ASSETS - ICONS
# ========================================
Write-Host "📦 Migrando Icons..." -ForegroundColor Magenta
if (Test-Path "src\icons") {
    Get-ChildItem "src\icons\*" | Move-Item -Destination "src\assets\icons" -Force
}

Write-Host ""
Write-Host "✨ Migração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Executar: .\cleanup.ps1 (para remover pastas vazias)"
Write-Host "2. Atualizar imports nos arquivos"
Write-Host "3. Testar a aplicação"
Write-Host "4. Commit das mudanças"
