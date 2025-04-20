import type { LikoNode } from "../../nodes/node";
import type { Filter } from "./filter";

export class FilterManager {
  private static _instance: FilterManager;
  static get instance() {
    FilterManager._instance ??= new FilterManager();
    return FilterManager._instance;
  }

  render(root: LikoNode, filters: Filter[]) {
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

    // TODO 这里需要直接调用 transform 吗，没法复用吗
    outputTarget.pp.transform = root.transform;
    outputTarget.pos = root.pos;
    outputTarget.width = root.width;
    outputTarget.height = root.height;
    return outputTarget!;
  }
}
