# Gera o app-debug.apk a partir do código em Frontend/.
#
# Por que este script existe: a pasta do projeto fica dentro de
# "OneDrive\Área de Trabalho" (tem acento) e o Android Gradle Plugin se
# recusa a compilar num caminho assim no Windows. O jeito mais simples de
# contornar é copiar só o necessário para um caminho sem acento (C:\abuild),
# compilar lá, e trazer o .apk de volta.
#
# Pré-requisitos (instalados uma vez, já feitos nesta máquina):
#   - JDK 21 em C:\Users\vitor\jdks\jdk-21.0.12+8 (o Gradle usado aqui não
#     suporta JDK mais novo que 24; a instalação padrão da máquina é JDK 25)
#   - Android SDK (cmdline-tools + platform 36 + build-tools 35) em
#     C:\Users\vitor\Android\Sdk
#
# Uso: abra PowerShell na pasta Frontend e rode  .\build-android.ps1

$ErrorActionPreference = "Stop"

$env:ANDROID_HOME = "C:\Users\vitor\Android\Sdk"
$env:JAVA_HOME = "C:\Users\vitor\jdks\jdk-21.0.12+8"

$frontendDir = $PSScriptRoot
$buildDir = "C:\abuild"
$capacitorAndroidSrc = Join-Path $frontendDir "node_modules\@capacitor\android"
$capacitorAndroidDst = "C:\node_modules\@capacitor\android"

Write-Host "1/5 - Build do site (vite build)..."
Set-Location $frontendDir
npm run build

Write-Host "2/5 - Sincronizando com o projeto Android (cap sync)..."
npx cap sync android

Write-Host "3/5 - Copiando projeto Android para caminho sem acento ($buildDir)..."
if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path $buildDir | Out-Null
Copy-Item "$frontendDir\android\*" $buildDir -Recurse -Force

# local.properties usa barra invertida como escape em arquivo .properties;
# reescreve com barra normal + ":" escapado, que é o formato correto.
"sdk.dir=C\:/Users/vitor/Android/Sdk" | Out-File -Encoding ascii "$buildDir\local.properties"

Write-Host "4/5 - Copiando @capacitor/android (dependencia local referenciada por caminho relativo)..."
if (-not (Test-Path $capacitorAndroidDst)) {
    New-Item -ItemType Directory -Path (Split-Path $capacitorAndroidDst) -Force | Out-Null
}
Copy-Item $capacitorAndroidSrc $capacitorAndroidDst -Recurse -Force

Write-Host "5/5 - Compilando com Gradle..."
Set-Location $buildDir
& ".\gradlew.bat" assembleDebug

$apk = Join-Path $buildDir "app\build\outputs\apk\debug\app-debug.apk"
$projetoRoot = Split-Path $frontendDir -Parent
$desktop = Split-Path $projetoRoot -Parent
$destino = Join-Path $desktop "Cafe_Estoque.apk"
Copy-Item $apk $destino -Force

Write-Host ""
Write-Host "APK gerado em: $destino"
