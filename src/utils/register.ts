import type { LikoNode } from '../nodes/node';
import type { Filter } from '../render/filter/filter';
import type { Script } from '../scripts/script';

/** 存储已注册的脚本类型映射 */
const scriptMap: Record<string, typeof Script> = {};
/** 存储已注册的节点类型映射 */
const nodeMap: Record<string, typeof LikoNode> = {};
/** 存储已注册的滤镜类型映射 */
const filterMap: Record<string, typeof Filter> = {};

/**
 * 注册脚本类，将脚本类与唯一的字符串名称关联，用于后续通过名称创建实例。
 *
 * @param name - 脚本的唯一标识名称，建议使用有意义的命名（如 'player-controller', 'enemy-ai'）
 * @param script - 要注册的脚本类，必须继承自 Script
 */
export function regScript(name: string, script: typeof Script | (new () => Script)): void {
  scriptMap[name] = script as typeof Script;
}

/**
 * 根据名称创建脚本实例，通过之前注册的名称创建对应的脚本实例。
 *
 * @param name - 已注册的脚本名称，必须是通过 regScript 注册过的名称
 * @returns 创建的脚本实例，如果未找到对应名称则返回 undefined
 */
export function createScriptInstance(name: string): Script | undefined {
  const Class: any = scriptMap[name];
  if (Class === undefined) {
    console.error(`can not create script: ${name}`);
    return undefined;
  }
  return new Class() as Script;
}

/**
 * 注册节点类，将节点类与唯一的字符串名称关联，用于后续通过名称创建实例。
 *
 * @param name - 节点的唯一标识名称，建议使用有意义的命名（如 'sprite', 'camera', 'light'）
 * @param node - 要注册的节点类，必须继承自 LikoNode
 */
export function regNode(name: string, node: typeof LikoNode): void {
  nodeMap[name] = node;
}

/**
 * 根据名称创建节点实例，通过之前注册的名称创建对应的节点实例。
 *
 * @param name - 已注册的节点名称，必须是通过 regNode 注册过的名称
 * @returns 创建的节点实例，如果未找到对应名称则返回 undefined
 */
export function createNodeInstance(name: string): LikoNode | undefined {
  const Class: any = nodeMap[name];
  if (Class === undefined) {
    console.error(`can not create node: ${name}`);
    return undefined;
  }
  return new Class();
}

/**
 * 注册滤镜类，将滤镜类与唯一的字符串名称关联，用于后续通过名称创建实例。
 *
 * @param name - 滤镜的唯一标识名称，建议使用有意义的命名（如 'blur', 'bloom', 'color-adjust'）
 * @param node - 要注册的滤镜类，必须继承自 Filter
 */
export function regFilter(name: string, node: typeof Filter): void {
  filterMap[name] = node;
}

/**
 * 根据名称创建滤镜实例，通过之前注册的名称创建对应的滤镜实例。
 *
 * @param name - 已注册的滤镜名称，必须是通过 regFilter 注册过的名称
 * @returns 创建的滤镜实例，如果未找到对应名称则返回 undefined
 */
export function createFilterInstance(name: string): Filter | undefined {
  const Class: any = filterMap[name];
  if (Class === undefined) {
    console.error(`can not create filter: ${name}`);
    return undefined;
  }
  return new Class();
}
