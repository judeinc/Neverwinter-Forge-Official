@echo off
setlocal EnableExtensions

title Neverwinter Forge - Depth Model Installer
echo.
echo Neverwinter Forge depth/normal workflow installer
echo ------------------------------------------------
echo.
echo This installs/checks the Lotus depth/normal models, VAE, Real-ESRGAN
echo upscale model, and required ComfyUI custom nodes.
echo.
echo Model downloads are large. Expect about 10 GB total if nothing is installed.
echo.

call :resolve_comfy_root
if not defined COMFY_ROOT goto no_comfy
if not exist "%COMFY_ROOT%" goto no_comfy
call :resolve_models_root
call :resolve_custom_nodes_root
call :resolve_comfy_python
if not defined MODELS_ROOT goto no_comfy
if not defined CUSTOM_NODES_ROOT goto no_comfy

echo ComfyUI root:
echo   %COMFY_ROOT%
echo.
echo ComfyUI models root:
echo   %MODELS_ROOT%
echo.
echo ComfyUI custom nodes root:
echo   %CUSTOM_NODES_ROOT%
echo.
if defined COMFY_PYTHON (
  echo ComfyUI Python:
  echo   %COMFY_PYTHON%
  echo.
) else (
  echo ComfyUI Python:
  echo   Not found. Custom node Python packages will not be installed automatically.
  echo.
)
echo Override paths, if needed:
echo   set NEVERWINTER_COMFYUI_ROOT=C:\Path\To\ComfyUI
echo   set NEVERWINTER_COMFYUI_MODELS_ROOT=C:\Path\To\ComfyUI\models
echo   set NEVERWINTER_COMFYUI_CUSTOM_NODES_ROOT=C:\Path\To\ComfyUI\custom_nodes
echo.

choice /C YN /M "Download/install missing models and custom nodes now"
if errorlevel 2 goto check_only

echo.
echo Installing custom nodes...
call :install_node "ComfyUI-Lotus" "https://github.com/kijai/ComfyUI-Lotus.git" "https://github.com/kijai/ComfyUI-Lotus/archive/refs/heads/main.zip"
call :install_node "ComfyUI_essentials" "https://github.com/cubiq/ComfyUI_essentials.git" "https://github.com/cubiq/ComfyUI_essentials/archive/refs/heads/main.zip"
call :install_node "ComfyUI-WJNodes" "https://github.com/807502278/ComfyUI-WJNodes.git" "https://github.com/807502278/ComfyUI-WJNodes/archive/refs/heads/main.zip"

echo.
echo Installing custom node Python requirements...
call :install_requirements "%CUSTOM_NODES_ROOT%\ComfyUI-Lotus\requirements.txt"
call :install_requirements "%CUSTOM_NODES_ROOT%\ComfyUI_essentials\requirements.txt"
call :install_requirements "%CUSTOM_NODES_ROOT%\ComfyUI-WJNodes\requirements.txt"

echo.
echo Installing model files...
call :download_model "diffusion_models" "lotus-depth-g-v2-1-disparity-fp16.safetensors" "https://huggingface.co/Kijai/lotus-comfyui/resolve/main/lotus-depth-g-v2-1-disparity-fp16.safetensors?download=true"
call :download_model "diffusion_models" "lotus-depth-g-v1-0.safetensors" "https://huggingface.co/Kijai/lotus-comfyui/resolve/main/lotus-depth-g-v1-0.safetensors?download=true"
call :download_model "diffusion_models" "lotus-depth-g-v1-0-fp16.safetensors" "https://huggingface.co/Kijai/lotus-comfyui/resolve/main/lotus-depth-g-v1-0-fp16.safetensors?download=true"
call :download_model "diffusion_models" "lotus-depth-d-v-1-1-fp16.safetensors" "https://huggingface.co/Kijai/lotus-comfyui/resolve/main/lotus-depth-d-v-1-1-fp16.safetensors?download=true"
call :download_model "diffusion_models" "lotus-normal-g-v1-1-fp16.safetensors" "https://huggingface.co/Kijai/lotus-comfyui/resolve/main/lotus-normal-g-v1-1-fp16.safetensors?download=true"
call :download_model "vae" "vae-ft-mse-840000-ema-pruned.safetensors" "https://huggingface.co/stabilityai/sd-vae-ft-mse-original/resolve/main/vae-ft-mse-840000-ema-pruned.safetensors?download=true"
call :install_realesrgan

:check_only
echo.
echo Checking installed files...
if exist "%MODELS_ROOT%\diffusion_models\lotus-depth-g-v2-1-disparity-fp16.safetensors" (echo [FOUND]   diffusion_models\lotus-depth-g-v2-1-disparity-fp16.safetensors) else (echo [MISSING] diffusion_models\lotus-depth-g-v2-1-disparity-fp16.safetensors)
if exist "%MODELS_ROOT%\diffusion_models\lotus-depth-g-v1-0.safetensors" (echo [FOUND]   diffusion_models\lotus-depth-g-v1-0.safetensors) else (echo [MISSING] diffusion_models\lotus-depth-g-v1-0.safetensors)
if exist "%MODELS_ROOT%\diffusion_models\lotus-depth-g-v1-0-fp16.safetensors" (echo [FOUND]   diffusion_models\lotus-depth-g-v1-0-fp16.safetensors) else (echo [MISSING] diffusion_models\lotus-depth-g-v1-0-fp16.safetensors)
if exist "%MODELS_ROOT%\diffusion_models\lotus-depth-d-v-1-1-fp16.safetensors" (echo [FOUND]   diffusion_models\lotus-depth-d-v-1-1-fp16.safetensors) else (echo [MISSING] diffusion_models\lotus-depth-d-v-1-1-fp16.safetensors)
if exist "%MODELS_ROOT%\diffusion_models\lotus-normal-g-v1-1-fp16.safetensors" (echo [FOUND]   diffusion_models\lotus-normal-g-v1-1-fp16.safetensors) else (echo [MISSING] diffusion_models\lotus-normal-g-v1-1-fp16.safetensors)
if exist "%MODELS_ROOT%\vae\vae-ft-mse-840000-ema-pruned.safetensors" (echo [FOUND]   vae\vae-ft-mse-840000-ema-pruned.safetensors) else (echo [MISSING] vae\vae-ft-mse-840000-ema-pruned.safetensors)
if exist "%MODELS_ROOT%\upscale_models\RealESRGAN_x4plus.pth" (echo [FOUND]   upscale_models\RealESRGAN_x4plus.pth) else (echo [MISSING] upscale_models\RealESRGAN_x4plus.pth)
if exist "%CUSTOM_NODES_ROOT%\ComfyUI-Lotus" (echo [FOUND]   custom_nodes\ComfyUI-Lotus) else (echo [MISSING] custom_nodes\ComfyUI-Lotus)
if exist "%CUSTOM_NODES_ROOT%\ComfyUI_essentials" (echo [FOUND]   custom_nodes\ComfyUI_essentials) else (echo [MISSING] custom_nodes\ComfyUI_essentials)
if exist "%CUSTOM_NODES_ROOT%\ComfyUI-WJNodes" (echo [FOUND]   custom_nodes\ComfyUI-WJNodes) else (echo [MISSING] custom_nodes\ComfyUI-WJNodes)

echo.
echo Done. Restart ComfyUI after installing or updating models/custom nodes.
echo.
pause
exit /b 0

:no_comfy
echo.
echo ComfyUI was not found.
echo.
echo Install ComfyUI Desktop first, launch it once, and choose its install/data folder.
echo Then run this installer again.
echo.
echo If ComfyUI is already installed in a custom location, copy depth_paths.example.json
echo to depth_paths.json and set comfyRoot, modelsRoot, and customNodesRoot.
echo.
pause
exit /b 1

:resolve_comfy_root
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%~dp0depth_paths.json'; if (Test-Path -LiteralPath $p) { $j = Get-Content -LiteralPath $p -Raw | ConvertFrom-Json; if ($j.comfyRoot) { Write-Output $j.comfyRoot } }"`) do set "COMFY_ROOT=%%I"
if defined COMFY_ROOT exit /b 0
if defined NEVERWINTER_COMFYUI_ROOT (
  set "COMFY_ROOT=%NEVERWINTER_COMFYUI_ROOT%"
  exit /b 0
)
if defined COMFYUI_ROOT (
  set "COMFY_ROOT=%COMFYUI_ROOT%"
  exit /b 0
)
if exist "%~dp0ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%~dp0ComfyUI"
  exit /b 0
)
if exist "%~dp0ComfyUI-Easy-Install\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%~dp0ComfyUI-Easy-Install\ComfyUI"
  exit /b 0
)
if exist "%~dp0ComfyUI_windows_portable\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%~dp0ComfyUI_windows_portable\ComfyUI"
  exit /b 0
)
if exist "%USERPROFILE%\Documents\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%USERPROFILE%\Documents\ComfyUI"
  exit /b 0
)
if exist "%USERPROFILE%\Documents\ComfyUI\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%USERPROFILE%\Documents\ComfyUI\ComfyUI"
  exit /b 0
)
if exist "%LOCALAPPDATA%\Programs\ComfyUI\resources\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%LOCALAPPDATA%\Programs\ComfyUI\resources\ComfyUI"
  exit /b 0
)
if exist "%LOCALAPPDATA%\Programs\@comfyorgcomfyui-electron\resources\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%LOCALAPPDATA%\Programs\@comfyorgcomfyui-electron\resources\ComfyUI"
  exit /b 0
)
if exist "%SystemDrive%\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%SystemDrive%\ComfyUI"
  exit /b 0
)
if exist "%SystemDrive%\ComfyUI\ComfyUI\custom_nodes" (
  set "COMFY_ROOT=%SystemDrive%\ComfyUI\ComfyUI"
  exit /b 0
)
exit /b 0

:resolve_models_root
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%~dp0depth_paths.json'; if (Test-Path -LiteralPath $p) { $j = Get-Content -LiteralPath $p -Raw | ConvertFrom-Json; if ($j.modelsRoot) { Write-Output $j.modelsRoot } }"`) do set "MODELS_ROOT=%%I"
if defined MODELS_ROOT exit /b 0
if defined NEVERWINTER_COMFYUI_MODELS_ROOT (
  set "MODELS_ROOT=%NEVERWINTER_COMFYUI_MODELS_ROOT%"
  exit /b 0
)
if defined COMFYUI_MODELS_ROOT (
  set "MODELS_ROOT=%COMFYUI_MODELS_ROOT%"
  exit /b 0
)
if exist "%COMFY_ROOT%\models" (
  set "MODELS_ROOT=%COMFY_ROOT%\models"
  exit /b 0
)
exit /b 0

:resolve_custom_nodes_root
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%~dp0depth_paths.json'; if (Test-Path -LiteralPath $p) { $j = Get-Content -LiteralPath $p -Raw | ConvertFrom-Json; if ($j.customNodesRoot) { Write-Output $j.customNodesRoot } }"`) do set "CUSTOM_NODES_ROOT=%%I"
if defined CUSTOM_NODES_ROOT exit /b 0
if defined NEVERWINTER_COMFYUI_CUSTOM_NODES_ROOT (
  set "CUSTOM_NODES_ROOT=%NEVERWINTER_COMFYUI_CUSTOM_NODES_ROOT%"
  exit /b 0
)
if exist "%COMFY_ROOT%\custom_nodes" (
  set "CUSTOM_NODES_ROOT=%COMFY_ROOT%\custom_nodes"
  exit /b 0
)
exit /b 0

:resolve_comfy_python
if exist "%COMFY_ROOT%\.venv\Scripts\python.exe" (
  set "COMFY_PYTHON=%COMFY_ROOT%\.venv\Scripts\python.exe"
  exit /b 0
)
if exist "%COMFY_ROOT%\python_embeded\python.exe" (
  set "COMFY_PYTHON=%COMFY_ROOT%\python_embeded\python.exe"
  exit /b 0
)
if exist "%COMFY_ROOT%\..\python_embeded\python.exe" (
  for %%I in ("%COMFY_ROOT%\..\python_embeded\python.exe") do set "COMFY_PYTHON=%%~fI"
  exit /b 0
)
where python.exe >nul 2>nul
if not errorlevel 1 (
  set "COMFY_PYTHON=python.exe"
  exit /b 0
)
exit /b 0

:install_node
set "NODE_NAME=%~1"
set "NODE_GIT=%~2"
set "NODE_ZIP=%~3"
set "NODE_TARGET=%CUSTOM_NODES_ROOT%\%NODE_NAME%"
if exist "%NODE_TARGET%" (
  echo [FOUND]   %NODE_NAME%
  exit /b 0
)
mkdir "%CUSTOM_NODES_ROOT%" >nul 2>nul
where git >nul 2>nul
if not errorlevel 1 (
  echo [CLONE]   %NODE_NAME%
  git clone --depth 1 "%NODE_GIT%" "%NODE_TARGET%"
  if not errorlevel 1 exit /b 0
)
echo [ZIP]     %NODE_NAME%
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $target=$env:NODE_TARGET; $url=$env:NODE_ZIP; $tmp=Join-Path $env:TEMP ('nwf_node_' + [guid]::NewGuid()); New-Item -ItemType Directory -Path $tmp -Force | Out-Null; $zip=Join-Path $tmp 'node.zip'; Invoke-WebRequest -Uri $url -OutFile $zip; Expand-Archive -LiteralPath $zip -DestinationPath $tmp -Force; $root=Get-ChildItem -LiteralPath $tmp -Directory | Where-Object { $_.Name -ne '__MACOSX' } | Select-Object -First 1; New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null; Move-Item -LiteralPath $root.FullName -Destination $target; Remove-Item -LiteralPath $tmp -Recurse -Force"
if errorlevel 1 echo [ERROR]   Could not install %NODE_NAME%
exit /b 0

:install_requirements
set "REQ_FILE=%~1"
if not exist "%REQ_FILE%" (
  echo [SKIP]    requirements not found: %REQ_FILE%
  exit /b 0
)
if not defined COMFY_PYTHON (
  echo [WARN]    Python not found for requirements: %REQ_FILE%
  exit /b 0
)
echo [PIP]     %REQ_FILE%
"%COMFY_PYTHON%" -m pip install -r "%REQ_FILE%"
if errorlevel 1 echo [WARN]    Some Python packages failed to install from %REQ_FILE%
exit /b 0

:download_model
set "MODEL_SUBDIR=%~1"
set "MODEL_NAME=%~2"
set "MODEL_URL=%~3"
set "MODEL_TARGET=%MODELS_ROOT%\%MODEL_SUBDIR%\%MODEL_NAME%"
set "MODEL_PART=%MODEL_TARGET%.part"
if exist "%MODEL_TARGET%" (
  echo [FOUND]   %MODEL_SUBDIR%\%MODEL_NAME%
  exit /b 0
)
echo [GET]     %MODEL_SUBDIR%\%MODEL_NAME%
mkdir "%MODELS_ROOT%\%MODEL_SUBDIR%" >nul 2>nul
where curl.exe >nul 2>nul
if not errorlevel 1 (
  if exist "%MODEL_PART%" (
    echo [RESUME]  %MODEL_SUBDIR%\%MODEL_NAME%
    curl.exe -L --fail --progress-bar -C - -o "%MODEL_PART%" "%MODEL_URL%"
  ) else (
    curl.exe -L --fail --progress-bar -o "%MODEL_PART%" "%MODEL_URL%"
  )
  if not errorlevel 1 (
    move /Y "%MODEL_PART%" "%MODEL_TARGET%" >nul
    echo [DONE]    %MODEL_SUBDIR%\%MODEL_NAME%
    exit /b 0
  )
  echo [ERROR]   Curl download failed for %MODEL_NAME%.
  echo           Partial file kept for resume: %MODEL_PART%
  exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='Continue'; $url=$env:MODEL_URL; $out=$env:MODEL_PART; New-Item -ItemType Directory -Path (Split-Path -Parent $out) -Force | Out-Null; Invoke-WebRequest -Uri $url -OutFile $out"
if not errorlevel 1 (
  move /Y "%MODEL_PART%" "%MODEL_TARGET%" >nul
  echo [DONE]    %MODEL_SUBDIR%\%MODEL_NAME%
  exit /b 0
)
echo [ERROR]   Could not download %MODEL_NAME%
echo           Partial file kept for retry if present: %MODEL_PART%
exit /b 0

:install_realesrgan
set "BUNDLED_ESRGAN=%~dp0models\upscale\RealESRGAN_x4plus.pth"
set "TARGET_ESRGAN=%MODELS_ROOT%\upscale_models\RealESRGAN_x4plus.pth"
if exist "%TARGET_ESRGAN%" (
  echo [FOUND]   upscale_models\RealESRGAN_x4plus.pth
  exit /b 0
)
mkdir "%MODELS_ROOT%\upscale_models" >nul 2>nul
if exist "%BUNDLED_ESRGAN%" (
  echo [COPY]    upscale_models\RealESRGAN_x4plus.pth
  copy /Y "%BUNDLED_ESRGAN%" "%TARGET_ESRGAN%" >nul
  exit /b 0
)
call :download_model "upscale_models" "RealESRGAN_x4plus.pth" "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
exit /b 0

:check_model
if exist "%MODELS_ROOT%\%~1" (
  echo [FOUND]   %~1
) else (
  echo [MISSING] %~1
)
exit /b 0

:check_node
if exist "%CUSTOM_NODES_ROOT%\%~1" (
  echo [FOUND]   custom_nodes\%~1
) else (
  echo [MISSING] custom_nodes\%~1
)
exit /b 0
