import { WebGpuRender } from '../render/webgpu-render';
import type { RenderOptions } from '../renderer';

export interface IBindResource {
  binding: number;
  visibility: number;
  type: 'Buffer' | 'Sampler' | 'TextureView';
  resource: GPUBuffer | GPUSampler | GPUTextureView;
}
/**
 * GPU 设备，方便隔离 webgl 和 webgpu
 */
export class WebGPUDevice {
  private debug = false;
  format!: GPUTextureFormat;
  device!: GPUDevice;
  defaultSampler!: GPUSampler;

  /**
   * 初始化 gpu 设备
   */
  async init(options: RenderOptions) {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Failed to initialize webgpu adapter');
    }

    this.device = (await adapter?.requestDevice()) as GPUDevice;
    if (!this.device) {
      throw new Error('Failed to initialize webgpu device');
    }

    this.format = navigator.gpu.getPreferredCanvasFormat();

    const context = options.canvas.getContext('webgpu') as GPUCanvasContext;
    context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    });

    this.defaultSampler = this.createSampler('default');
    return { context, gpuRender: new WebGpuRender(options.bgColor) };
  }

  setViewport(width: number, height: number) {
    if (this.debug) {
      console.log('setViewport', width, height);
    }
  }

  createProjectionMatrixBuffer(label: string, data: Float32Array) {
    const { device } = this;

    const buffer = device.createBuffer({
      label: `${label}-buffer`,
      size: data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, data);

    const layout = device.createBindGroupLayout({
      label: `${label}-layout`,
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }],
    });

    const group = device.createBindGroup({
      label: `${label}-group`,
      layout: layout,
      entries: [{ binding: 0, resource: { buffer: buffer } }],
    });

    if (this.debug) console.log('createUniformGroup', label);

    return { buffer, group };
  }

  createVertexBuffer(label: string, data: Float32Array | Uint32Array) {
    const { device } = this;

    const buffer = device.createBuffer({
      label: `${label}-buffer`,
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    if (this.debug) console.log('createBuffer', label);

    return buffer;
  }

  createIndexBuffer(label: string, data: Uint16Array | Uint32Array) {
    const { device } = this;

    const buffer = device.createBuffer({
      label: `${label}-buffer`,
      size: data.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    if (this.debug) console.log('createBuffer', label);

    return buffer;
  }

  createUniformBuffer(label: string, data: Float32Array | Uint16Array | Uint32Array) {
    const { device } = this;

    const buffer = device.createBuffer({
      label: `${label}-buffer`,
      size: data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    if (this.debug) console.log('createBuffer', label);

    return buffer;
  }

  uploadUniform(buffer: GPUBuffer, data: BufferSource | SharedArrayBuffer) {
    this.device.queue.writeBuffer(buffer, 0, data);
    if (this.debug) console.log('uploadUniform', buffer.label);
  }

  uploadBuffer(buffer: GPUBuffer, data: BufferSource | SharedArrayBuffer, _index = false) {
    this.device.queue.writeBuffer(buffer, 0, data);

    if (this.debug) console.log('uploadBuffer', buffer.label);
  }

  createGroup(label: string, entries: IBindResource[]) {
    const { device } = this;

    const layout = device.createBindGroupLayout({
      label: `${label}-layout`,
      entries: entries.map((item) => {
        // { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {}
        // { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        // { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        const { type } = item;
        const entry = {
          binding: item.binding,
          visibility: item.visibility,
          buffer: type === 'Buffer' ? {} : undefined,
          sampler: type === 'Sampler' ? {} : undefined,
          texture: type === 'TextureView' ? {} : undefined,
        };
        return entry;
      }),
    });

    const group = device.createBindGroup({
      label: `${label}-group`,
      layout: layout,
      entries: entries.map((item) => {
        // { binding, resource: { buffer: this.buffer } };
        // { binding: 0, resource: sampler },
        // { binding: 1, resource: this.texture.createView() },
        const { resource } = item;
        const entry = {
          binding: item.binding,
          resource: item.type === 'Buffer' ? { buffer: resource as GPUBuffer } : (resource as GPUSampler),
        };
        return entry;
      }),
    });

    if (this.debug) console.log('createGroup', label);

    return { layout, group };
  }

  createFilterPipeline(label: string, layouts: GPUBindGroupLayout[], shader: string) {
    if (this.debug) console.log('createFilterPipeline', label);

    const { device } = this;
    return device.createRenderPipeline({
      label: `${label}-renderPipe`,
      layout: device.createPipelineLayout({ bindGroupLayouts: layouts }),
      vertex: {
        module: device.createShaderModule({ code: shader }),
        entryPoint: 'vert_main',
        buffers: [
          {
            arrayStride: 4 * 4,
            stepMode: 'vertex',
            attributes: [
              { shaderLocation: 0, format: 'float32x2', offset: 0 },
              { shaderLocation: 1, format: 'float32x2', offset: 2 * 4 },
            ],
          },
        ],
      },
      fragment: {
        module: device.createShaderModule({ code: shader }),
        entryPoint: 'frag_main',
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: { topology: 'triangle-strip' },
    });
  }

  createTexture(label: string, width: number, height: number) {
    if (this.debug) console.log('createTexture', label);

    return this.device.createTexture({
      label: `${label}-texture`,
      format: this.format,
      size: [width, height],
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  createSampler(label: string, minFilter: GPUFilterMode = 'linear', magFilter: GPUFilterMode = 'linear') {
    if (this.debug) console.log('createSampler', label);

    return this.device.createSampler({
      label: `${label}-sampler`,
      minFilter,
      magFilter,
    });
  }

  uploadTexture(bitmap: ImageBitmap | HTMLCanvasElement, texture: GPUTexture) {
    if (this.debug) console.log('uploadTexture');
    // premultipliedAlpha: true
    this.device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [bitmap.width, bitmap.height]);
  }
}
