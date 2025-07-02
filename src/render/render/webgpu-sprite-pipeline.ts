import type { Batch } from '../batch/batch';
import { Device } from '../device/device';
import type { WebGPUDevice } from '../device/webgpu-device';
import shader from './sprite.wgsl?raw';
import type { IRenderPipe } from './webgpu-render';

export class WebGPUSpritePipeline implements IRenderPipe {
  pipeline: GPURenderPipeline;

  constructor() {
    const cameraLayout = this.createCameraLayout();
    const textureLayout = this.createTexturesLayout();
    this.pipeline = this.createRenderPipeline([cameraLayout, textureLayout], shader);
  }

  createCameraLayout() {
    const binds = [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }];
    return this.createLayout('camera', binds);
  }

  createTexturesLayout() {
    const binds = [];
    for (let i = 0; i < 32; i += 2) {
      binds.push({
        binding: i,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      });
      binds.push({
        binding: i + 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      });
    }
    return this.createLayout('texture', binds);
  }

  createRenderPipeline(layouts: GPUBindGroupLayout[], shader: string) {
    const { device, format } = Device as unknown as WebGPUDevice;
    return device.createRenderPipeline({
      label: 'spriteRenderPipe',
      layout: device.createPipelineLayout({ bindGroupLayouts: layouts }),
      vertex: {
        module: device.createShaderModule({ code: shader }),
        entryPoint: 'vert_main',
        buffers: [
          {
            arrayStride: 2 * 4,
            stepMode: 'vertex',
            attributes: [{ shaderLocation: 0, format: 'float32x2', offset: 0 }],
          },
          {
            arrayStride: 1 * 4,
            stepMode: 'vertex',
            attributes: [{ shaderLocation: 1, format: 'unorm8x4', offset: 0 }],
          },
          {
            arrayStride: 3 * 4,
            stepMode: 'vertex',
            attributes: [
              { shaderLocation: 2, format: 'float32x2', offset: 0 },
              { shaderLocation: 3, format: 'uint32', offset: 2 * 4 },
            ],
          },
        ],
      },
      fragment: {
        module: device.createShaderModule({ code: shader }),
        entryPoint: 'frag_main',
        targets: [
          {
            format: format,
            blend: {
              alpha: {
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
                srcFactor: 'src-alpha',
              },
              color: {
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
                srcFactor: 'src-alpha',
              },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createLayout(label: string, entries: GPUBindGroupLayoutEntry[]) {
    const { device } = Device as unknown as WebGPUDevice;
    const layout = device.createBindGroupLayout({
      label: `${label}-layout`,
      entries: entries,
    });
    return layout;
  }

  render(batch: Batch, renderPass: GPURenderPassEncoder): void {
    // 避免绘制空批次（索引数量为0的情况）
    if (batch.size <= 0) {
      return;
    }

    const { posBuffer, colorBuffer, uvBuffer, indexBuffer, camera } = batch.batchGroup;
    renderPass.setPipeline(this.pipeline);
    renderPass.setVertexBuffer(0, posBuffer.buffer);
    renderPass.setVertexBuffer(1, colorBuffer.buffer);
    renderPass.setVertexBuffer(2, uvBuffer.buffer);
    renderPass.setIndexBuffer(indexBuffer.buffer, 'uint32');
    renderPass.setBindGroup(0, camera.group);
    renderPass.setBindGroup(1, batch.textureGroup.group);
    renderPass.drawIndexed(batch.size, 1, batch.startIndex);
  }
}
