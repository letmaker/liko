import type { Texture } from "../../../resource/texture";
import { Filter } from "../filter";
import shader from "./mask.wgsl?raw";

export class MaskFilter extends Filter {
  constructor(options: { mapTexture: Texture }) {
    super({
      shader,
      resources: { mapTexture: options.mapTexture },
    });
  }
}
