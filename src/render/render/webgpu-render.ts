import type { Matrix } from "../../math/matrix";
import type { Node } from "../../nodes/node";
import { Color, type ColorData } from "../../utils/color";
import type { Batch } from "../batch/batch";
import { BatchGroup } from "../batch/batch-group";
import type { CameraBuffer } from "../buffer/camera-buffer";
import { Device } from "../device/device";
import type { WebGPUDevice } from "../device/webgpu-device";
import { WebGPUSpritePipeline } from "./webgpu-sprite-pipeline";

export interface IRenderPipe {
  render: (batch: Batch, renderPass: GPURenderPassEncoder) => void;
}

export class WebGpuRender {
  private static _pipelines: Record<string, IRenderPipe> = {};
  private static _instance?: WebGpuRender;

  static addPipeline(name: string, pipeline: IRenderPipe) {
    WebGpuRender._pipelines[name] = pipeline;
  }
  static getPipeline(name: string) {
    return WebGpuRender._pipelines[name];
  }

  static get instance() {
    WebGpuRender._instance ??= new WebGpuRender();
    return WebGpuRender._instance;
  }

  private _color: { r: number; g: number; b: number; a: number };

  constructor(bgColor?: ColorData) {
    const color = new Color(bgColor);
    this._color = { r: color.red, g: color.green, b: color.blue, a: color.alpha };

    WebGpuRender.addPipeline("batch", new WebGPUSpritePipeline());
  }

  batchGroup = new BatchGroup();

  render(root: Node, worldMatrix: Matrix, camera: CameraBuffer, texture: GPUTexture) {
    const { device } = Device as unknown as WebGPUDevice;
    const batchGroup = this.batchGroup.collect(root, worldMatrix, camera);
    if (batchGroup.batches.length) {
      const command = device.createCommandEncoder();
      const renderPass = command.beginRenderPass({
        colorAttachments: [
          {
            view: texture.createView(),
            clearValue: this._color,
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      this.flush(batchGroup, renderPass);
      renderPass.end();
      device.queue.submit([command.finish()]);
    }
  }

  flush(group: BatchGroup, renderPass: GPURenderPassEncoder) {
    const { batches } = group;
    const count = batches.length;
    // let batchCount = 0;
    for (let i = 0; i < count; i++) {
      const batch = batches[i];
      if ("textureGroup" in batch) {
        const pipeline = WebGpuRender.getPipeline(batch.pipeline);
        console.assert(pipeline !== undefined, `pipeline ${batch.pipeline} is null`);
        pipeline.render(batch, renderPass);
        // batchCount++;
      } else {
        this.flush(batch, renderPass);
      }
    }
    // console.debug("batch", batchCount);
  }
}
