import type { Node } from "../nodes/node";
import type { Filter } from "../render/filter/filter";
import type { ScriptBase } from "../scripts/script-base";

/**
 * 注册器相关工具函数
 */

/** 脚本映射 */
const scriptMap: Record<string, typeof ScriptBase> = {};
/** 节点映射 */
const nodeMap: Record<string, typeof Node> = {};
/** 滤镜映射 */
const filterMap: Record<string, typeof Filter> = {};

/**
 * 注册脚本
 * @param name 脚本名称
 * @param script 脚本类
 */
export function regScript(name: string, script: typeof ScriptBase): void {
  scriptMap[name] = script;
}

/**
 * 根据名称获得脚本类
 * @param name 脚本名称
 * @returns 脚本类
 */
export function getRegScript(name: string): ScriptBase | undefined {
  const Class: any = scriptMap[name];
  if (Class === undefined) {
    console.error(`can not create script: ${name}`);
    return undefined;
  }
  return new Class() as ScriptBase;
}

/**
 * 注册节点
 * @param name 节点名称
 * @param node 节点类
 */
export function regNode(name: string, node: typeof Node): void {
  nodeMap[name] = node;
}

/**
 * 根据名称获得节点实例
 * @param name 节点名称
 * @returns 节点实例
 */
export function getRegNode(name: string): Node | undefined {
  const Class: any = nodeMap[name];
  if (Class === undefined) {
    console.error(`can not create node: ${name}`);
    return undefined;
  }
  return new Class();
}

/**
 * 注册滤镜
 * @param name 滤镜名称
 * @param node 滤镜类
 */
export function regFilter(name: string, node: typeof Filter): void {
  filterMap[name] = node;
}

/**
 * 根据名称获得滤镜实例
 * @param name 滤镜名称
 * @returns 滤镜实例
 */
export function getRegFilter(name: string): Filter | undefined {
  const Class: any = filterMap[name];
  if (Class === undefined) {
    console.error(`can not create filter: ${name}`);
    return undefined;
  }
  return new Class();
}
