import { regNode, regScript } from "./register";

/** 注册节点 */
export const RegNode = (className: string) => (target: any) => {
  regNode(className, target);
  return target;
};

/** 注册脚本 */
export const RegScript = (className: string) => (target: any) => {
  regScript(className, target);
  return target;
};
