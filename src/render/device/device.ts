import { WebGLDevice } from "./webgl-device";
import { WebGPUDevice } from "./webgpu-device";

export let Device!: WebGLDevice | WebGPUDevice;

export const useWebGpu = true;

export function initDevice() {
  if (useWebGpu) {
    Device = new WebGPUDevice();
  } else {
    Device = new WebGLDevice();
  }
}
