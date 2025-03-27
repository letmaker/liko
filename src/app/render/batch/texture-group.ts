import { RenderTarget } from "../render/render-target";
import { Device } from "../device/device";
import type { Texture } from "../../resource/texture";
import type { ITextureBuffer } from "../buffer/interface";
import type { IBindResource } from "../device/webgpu-device";

const max = 16;
const defaultTexture: RenderTarget = new RenderTarget();

export class TextureGroup {
  private _group!: GPUBindGroup;
  private _binds: IBindResource[] = [];
  private _cacheKey = "";

  map: Map<string, number> = new Map();
  buffers: ITextureBuffer[] = [];
  count = 0;

  constructor() {
    defaultTexture.createTexture(1, 1).createView();
    const defaultView = defaultTexture.buffer.view;
    const defaultSampler = defaultTexture.buffer.sampler;

    for (let i = 0; i < 16; i++) {
      this._binds.push({
        binding: i * 2,
        visibility: GPUShaderStage.FRAGMENT,
        type: "TextureView",
        resource: defaultView,
      });
      this._binds.push({
        binding: i * 2 + 1,
        visibility: GPUShaderStage.FRAGMENT,
        type: "Sampler",
        resource: defaultSampler,
      });
    }
  }

  get group(): GPUBindGroup {
    const group = this._createTextureGroup(this.buffers);
    if (this._group !== group) {
      this._group = group;
      for (let i = 0, len = this.buffers.length; i < len; i++) {
        this.buffers[i].upload();
      }
    }
    return this._group;
  }

  reset() {
    this.count = 0;
    this.map.clear();
    this.buffers.length = 0;
  }

  private _createTextureGroup(buffers: ITextureBuffer[]) {
    const count = buffers.length;
    const binds = this._binds;

    let cacheKey = "";
    for (let i = 0; i < 16; i++) {
      const textureBind = this._binds[i * 2];
      const samplerBind = this._binds[i * 2 + 1];

      let buffer = defaultTexture.buffer;
      if (i < count) {
        buffer = buffers[i];
        cacheKey += buffer.uid;
      }

      textureBind.resource = buffer.view;
      samplerBind.resource = buffer.sampler;
    }

    if (cacheKey !== this._cacheKey) {
      this._cacheKey = cacheKey;
      const { group } = Device.createGroup("texture", binds);
      return group;
    }
    return this._group;
  }

  add(buffer: ITextureBuffer): number {
    const textureId = this.map.get(buffer.uid);
    if (textureId !== undefined) {
      return textureId;
    }
    const index = this.count;
    if (index < max) {
      this.buffers.push(buffer);
      this.map.set(buffer.uid, index);
      this.count++;
      return index;
    }
    return -1;
  }

  getTextureId(texture: Texture): number | undefined {
    return this.map.get(texture.buffer.uid);
  }
}
