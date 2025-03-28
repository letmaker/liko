// @ts-nocheck TODO: 待实现
import type { Matrix } from "../../math/matrix";
import type { Node } from "../../nodes/node";
import type { Batch } from "../batch/batch";
import { BatchGroup } from "../batch/batch-group";
import type { CameraBuffer } from "../buffer/camera-buffer";
import { Device } from "../device/device";
import { WebGLSpritePipeline } from "./webgl-sprite-pipeline";

export interface IWebGLRenderPipe {
  render: (batch: Batch) => void;
}

export class WebGLRender {
  private static _pipelines: Record<string, IWebGLRenderPipe> = {};
  private static _instance?: WebGLRender;

  static addPipeline(name: string, pipeline: IWebGLRenderPipe) {
    WebGLRender._pipelines[name] = pipeline;
  }
  static getPipeline(name: string) {
    return WebGLRender._pipelines[name];
  }

  static get instance() {
    WebGLRender._instance ??= new WebGLRender();
    return WebGLRender._instance;
  }

  constructor() {
    WebGLRender.addPipeline("batch", new WebGLSpritePipeline());
  }

  batchGroup = new BatchGroup();

  render(root: Node, worldMatrix: Matrix, texture: GPUTexture, camera: CameraBuffer) {
    // 使用黑色清除画布
    Device.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    const batchGroup = this.batchGroup.collect(root, worldMatrix, camera);
    if (batchGroup.batches.length) {
      this.flush(batchGroup);
    }
  }

  flush(group: BatchGroup) {
    const { batches } = group;
    const count = batches.length;
    // let batchCount = 0;
    for (let i = 0; i < count; i++) {
      const batch = batches[i];
      if ("textureGroup" in batch) {
        const pipeline = WebGLRender.getPipeline(batch.pipeline);
        console.assert(pipeline !== undefined, `pipeline ${batch.pipeline} is null`);
        pipeline.render(batch);
        // batchCount++;
      } else {
        this.flush(batch);
      }
    }
    // console.debug("batch", batchCount);
  }
}
