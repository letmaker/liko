import { Register } from "./register";

/** 注册节点 */
export const RegNode = (className: string) => (target: any) => {
  Register.regNode(className, target);
  return target;
};

/** 注册加载器 */
export const RegLoader = () => (Target: any) => {
  Register.regLoader(new Target());
  return Target;
};

/** 注册脚本 */
export const RegScript = (className: string) => (target: any) => {
  Register.regScript(className, target);
  return target;
};
