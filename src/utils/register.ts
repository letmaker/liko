import type { LikoNode } from "../nodes/node";
import type { Filter } from "../render/filter/filter";
import type { ScriptBase } from "../scripts/script-base";

/**
 * 注册器相关工具函数，用于管理脚本、节点和滤镜的注册与实例化
 */

/** 存储已注册的脚本类型映射 */
const scriptMap: Record<string, typeof ScriptBase> = {};
/** 存储已注册的节点类型映射 */
const nodeMap: Record<string, typeof LikoNode> = {};
/** 存储已注册的滤镜类型映射 */
const filterMap: Record<string, typeof Filter> = {};

/**
 * 注册脚本类
 * @param name - 脚本的唯一标识名称
 * @param script - 要注册的脚本类
 */
export function regScript(name: string, script: typeof ScriptBase): void {
  scriptMap[name] = script;
}

/**
 * 根据名称创建脚本实例
 * @param name - 已注册的脚本名称
 * @returns 创建的脚本实例，如果未找到对应名称则返回 undefined
 */
export function createScriptInstance(name: string): ScriptBase | undefined {
  const Class: any = scriptMap[name];
  if (Class === undefined) {
    console.error(`can not create script: ${name}`);
    return undefined;
  }
  return new Class() as ScriptBase;
}

/**
 * 注册节点类
 * @param name - 节点的唯一标识名称
 * @param node - 要注册的节点类
 */
export function regNode(name: string, node: typeof LikoNode): void {
  nodeMap[name] = node;
}

/**
 * 根据名称创建节点实例
 * @param name - 已注册的节点名称
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
 * 注册滤镜类
 * @param name - 滤镜的唯一标识名称
 * @param node - 要注册的滤镜类
 */
export function regFilter(name: string, node: typeof Filter): void {
  filterMap[name] = node;
}

/**
 * 根据名称创建滤镜实例
 * @param name - 已注册的滤镜名称
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
