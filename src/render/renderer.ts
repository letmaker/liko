import type { LikoNode } from '../nodes/node';
import type { ColorData } from '../utils/color';
import { CameraBuffer } from './buffer/camera-buffer';
import { Device } from './device/device';
import type { WebGpuRender } from './render/webgpu-render';

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  bgColor?: ColorData;
}

/**
 * 渲染器
 */
export class Renderer {
  canvas!: HTMLCanvasElement;
  context!: GPUCanvasContext;
  gpuRender!: WebGpuRender;
  camera!: CameraBuffer;

  destroy() {
    // TODO
    this.camera?.destroy();
  }

  async init(options: RenderOptions) {
    const { context, gpuRender } = await Device.init(options);
    this.context = context;
    this.gpuRender = gpuRender;
    this.camera = new CameraBuffer();
  }

  render(root: LikoNode) {
    if (root.pp.dirty === 0) return;
    this.gpuRender.render(root, root.worldMatrix, this.camera, this.context.getCurrentTexture());
  }

  resize(width: number, height: number) {
    this.camera.resize(width, height);
  }
}
