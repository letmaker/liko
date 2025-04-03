import type { WebGpuRender } from "./render/webgpu-render";
import type { Node } from "../nodes/node";
import { Device } from "./device/device";
import { CameraBuffer } from "./buffer/camera-buffer";

export interface RenderOptions {
  canvas: HTMLCanvasElement;
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
    const { context, gpuRender } = await Device.init(options.canvas);
    this.context = context;
    this.gpuRender = gpuRender;
    this.camera = new CameraBuffer();
  }

  render(root: Node) {
    if (root.pp.dirty === 0) return;
    this.gpuRender.render(root, root.worldMatrix, this.camera, this.context.getCurrentTexture());
  }

  resize(width: number, height: number) {
    this.camera.resize(width, height);
  }
}
