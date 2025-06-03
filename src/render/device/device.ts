import { WebGPUDevice } from './webgpu-device';

export let Device!: WebGPUDevice;

export const useWebGpu = true;

export function initDevice() {
  // if (useWebGpu) {
  Device = new WebGPUDevice();
  // } else {
  //   Device = new WebGLDevice();
  // }
}
