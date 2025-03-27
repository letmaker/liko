import type { Node } from "../../nodes/node";
import type { Filter } from "./filter";

export class FilterManager {
  private static _instance: FilterManager;
  static get instance() {
    FilterManager._instance ??= new FilterManager();
    return FilterManager._instance;
  }

  render(root: Node, filters: Filter[]) {
    const rootDirty = root.pp.dirty;

    // 渲染节点
    let outputTarget = filters[0].renderNode(root);

    // 使用滤镜渲染器渲染滤镜
    for (const filter of filters) {
      if (rootDirty || filter._dirty) {
        outputTarget = filter.render(outputTarget);
        outputTarget.label = root.label;
      } else {
        outputTarget = filter.renderTarget;
      }
    }

    outputTarget.pp.transform = root.getTransform();
    outputTarget.pos = root.pos;
    outputTarget.width = root.width;
    outputTarget.height = root.height;
    return outputTarget!;
  }
}
