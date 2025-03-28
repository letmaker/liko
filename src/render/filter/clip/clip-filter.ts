import type { IRectangle } from "../../../math/rectangle";
import { Filter } from "../filter";
import { UniformGroup } from "../uniform-group";
import shader from "./clip.wgsl?raw";

export class ClipFilter extends Filter {
  constructor(options: { clipRect: IRectangle }) {
    const rect = options.clipRect;
    const filterUniforms = new UniformGroup({
      uClipRect: {
        value: [rect.x, rect.y, rect.width, rect.height],
        type: "f32",
        size: 4,
      },
    });

    super({
      shader,
      resources: { filterUniforms },
    });
  }

  get alpha() {
    return (this.resources.filterUniforms as UniformGroup).getValue("uAlpha");
  }
  set alpha(value: number) {
    this._dirty = true;
    (this.resources.filterUniforms as UniformGroup).setValue("uAlpha", value);
  }
}
