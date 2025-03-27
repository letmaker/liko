import { Filter } from "../filter";
import { UniformGroup } from "../uniform-group";
import shader from "./alpha.wgsl?raw";

export class AlphaFilter extends Filter {
  constructor(options?: { alpha: number }) {
    const filterUniforms = new UniformGroup({
      uAlpha: { value: options?.alpha ?? 1, type: "f32" },
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
