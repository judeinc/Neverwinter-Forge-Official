Neverwinter Forge local ComfyUI model fallback

If Neverwinter Forge cannot auto-detect a ComfyUI model folder, it checks this folder:

models\comfyui\

Place depth/normal map model files in normal ComfyUI subfolders:

models\comfyui\diffusion_models\
models\comfyui\vae\
models\comfyui\upscale_models\

Required depth/normal map files:

diffusion_models\lotus-depth-g-v2-1-disparity-fp16.safetensors
diffusion_models\lotus-depth-g-v1-0.safetensors
diffusion_models\lotus-depth-g-v1-0-fp16.safetensors
diffusion_models\lotus-depth-d-v-1-1-fp16.safetensors
diffusion_models\lotus-normal-g-v1-1-fp16.safetensors
vae\vae-ft-mse-840000-ema-pruned.safetensors
upscale_models\RealESRGAN_x4plus.pth

Important:

Neverwinter Forge can check this folder, but ComfyUI must also know about it because ComfyUI is the process that loads the models.

If you keep models here instead of inside ComfyUI's own models folder, add this folder to ComfyUI's extra_model_paths.yaml. Use extra_model_paths_neverwinter.example.yaml as a starting point and replace the base_path with the full path to this folder.
