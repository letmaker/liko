import { Matrix } from "../../math/matrix";
import type { LikoNode } from "../../nodes/node";
import type { Texture } from "../../resource/texture";
import { getUID } from "../../utils/utils";
import { CameraBuffer } from "../buffer/camera-buffer";
import { RenderTarget } from "../render/render-target";
import { WebGpuRender } from "../render/webgpu-render";
import { FilterRender } from "./filter-render";
import type { UniformGroup } from "./uniform-group";

export type FilterResource = Record<string, UniformGroup | Texture>;
/**
 * 滤镜基类
 */
export class Filter {
  private _inputTarget?: RenderTarget;
  private _camera?: CameraBuffer;
  private _matrix?: Matrix;

  /** @private */
  _dirty = true;

  id = getUID();
  label = "";
  shader = "";
  filterRender: FilterRender;
  renderTarget = new RenderTarget();
  resources: FilterResource = {};

  constructor(options: { shader: string; resources?: FilterResource }) {
    this.shader = options.shader;
    if (options.resources) this.resources = options.resources;

    this.filterRender = new FilterRender(this);
  }

  destroy() {
    this._inputTarget?.destroy();
    this._camera?.destroy();
    this.renderTarget.destroy();
    this.filterRender.destroy();
  }

  renderNode(root: LikoNode) {
    this._inputTarget ??= new RenderTarget();

    if (root.pp.dirty) {
      this._camera ??= new CameraBuffer();
      this._matrix ??= new Matrix();

      // 设置逆矩阵给 filter 的子对象渲染
      this._matrix.copyFrom(root.localMatrix).invert();
      this._camera.resize(root.width, root.height);
      this._camera.rootMatrix = this._matrix;

      const inputTexture = this._inputTarget.createTexture(root.width, root.height);

      // 使用节点渲染器渲染节点对象
      WebGpuRender.instance.render(root, this._matrix, this._camera, inputTexture);
    }

    return this._inputTarget;
  }

  render(input: RenderTarget) {
    const outputTexture = this.renderTarget.createTexture(input.width, input.height);
    this.filterRender.render(input, outputTexture);
    this._dirty = false;
    return this.renderTarget;
  }

  setProps(props?: Record<string, unknown>): void {
    if (props) {
      const keys = Object.keys(props);
      for (const key of keys) {
        if (key in this) (this as Record<string, unknown>)[key] = props[key];
      }
    }
  }
}
