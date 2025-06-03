import { Texture } from '../../resource/texture';
import { CameraBuffer } from '../buffer/camera-buffer';
// @ts-nocheck  TODO: 待实现
import { Device } from '../device/device';
import type { IBindResource } from '../device/webgpu-device';
import type { RenderTarget } from '../render/render-target';
import { getPipelineFromCache } from '../utils/cache-manager';
import type { Filter } from './filter';
import type { FilterResource } from './filter';
import { UniformGroup } from './uniform-group';

const clearColor = { r: 0, g: 0, b: 0, a: 0 };
/**
 * 滤镜渲染器
 */
export class FilterRender {
  private _pipeline?: GPURenderPipeline;

  camera: CameraBuffer = new CameraBuffer();
  groups: GPUBindGroup[] = [];

  constructor(public filter: Filter) { }

  getPipeline(input: RenderTarget) {
    this._pipeline ??= getPipelineFromCache(this.filter.shader, () => {
      const groups = [];
      const layouts = [];
      const { group, layout } = Device.createGroup('filter-camera', [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          type: 'Buffer',
          resource: this.camera.buffer,
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          type: 'TextureView',
          resource: input.buffer.view,
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          type: 'Sampler',
          resource: input.buffer.sampler,
        },
      ]);
      groups.push(group);
      layouts.push(layout);

      if (Object.keys(this.filter.resources).length > 0) {
        const { group, layout } = this._createResourceGroup(this.filter.resources);
        groups.push(group);
        layouts.push(layout);
      }

      this.groups = groups;

      return Device.createFilterPipeline('filter', layouts, this.filter.shader);
    });
    return this._pipeline;
  }

  private _createResourceGroup(resources: FilterResource) {
    let index = 0;
    const res: IBindResource[] = [];
    const keys = Object.keys(resources);
    for (const key of keys) {
      const value = resources[key];
      if (value instanceof UniformGroup) {
        res.push({
          binding: index,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          type: 'Buffer',
          resource: value.buffer.buffer,
        });
      } else if (value instanceof Texture) {
        res.push({
          binding: index,
          visibility: GPUShaderStage.FRAGMENT,
          type: 'TextureView',
          resource: value.buffer.view,
        });
        index++;
        res.push({
          binding: index,
          visibility: GPUShaderStage.FRAGMENT,
          type: 'Sampler',
          resource: value.buffer.sampler,
        });
        value.buffer.upload();
      }
      index++;
    }
    return Device.createGroup('filter-resource', res);
  }

  destroy() {
    this.camera.destroy();
  }

  /**
   * 搜集 Filter 渲染数据
   */
  render(input: RenderTarget, texture: GPUTexture) {
    this.camera.resize(texture.width, texture.height);

    const { width, height } = input;
    // biome-ignore format:
    const vertexData = new Float32Array([
      // x,y,u,v 
      0, 0, 0, 0,
      width, 0, 1, 0,
      0, height, 0, 1,
      width, height, 1, 1,
    ]);
    const vertexBuffer = Device.createVertexBuffer('filter', vertexData);
    Device.uploadBuffer(vertexBuffer, vertexData);

    const command = Device.device.createCommandEncoder();
    const renderPass = command.beginRenderPass({
      colorAttachments: [
        {
          view: texture.createView(),
          clearValue: clearColor,
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.getPipeline(input));
    renderPass.setVertexBuffer(0, vertexBuffer);

    for (let i = 0; i < this.groups.length; i++) {
      const group = this.groups[i];
      renderPass.setBindGroup(i, group);
    }

    renderPass.draw(4, 1);
    renderPass.end();
    Device.device.queue.submit([command.finish()]);
  }
}
