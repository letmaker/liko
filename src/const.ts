/** Math.PI * 2 的常量值 */
export const PI2 = Math.PI * 2;
/** Math.PI / 2 的常量值 */
export const PI_2 = Math.PI / 2;
/** 180 / Math.PI 弧度转角度的转换系数 */
export const RAD_TO_DEG = 180 / Math.PI;
/** Math.PI / 180 角度转弧度的转换系数 */
export const DEG_TO_RAD = Math.PI / 180;

/** 节点脏标记类型，用于标识节点需要更新的属性 */
export enum DirtyType {
  /** 位置、缩放或旋转发生变化 */
  transform = 1,
  /** 宽度或高度发生变化 */
  size = 2,
  /** 纹理发生变化 */
  texture = 4,
  /** 透明度或颜色发生变化 */
  color = 8,
  /** 滤镜发生变化 */
  filter = 16,
  /** 添加删除子节点 */
  child = 32,
  /** 子节点变化影响父节点 */
  parent = 64,
}

/**
 * 事件类型枚举
 */
export enum EventType {
  /** 节点被添加到节点树后，由 node 派发 */
  added = "added",
  /** 节点被添加到舞台时，这时可以获取 stage，由 node 派发  */
  addToStage = "addToStage",
  /** 节点从节点树移除后，由 node 派发 */
  removed = "removed",
  /** 节点被销毁时，由 node 派发 */
  destroyed = "destroyed",

  /** 节点更改大小时，由 node 派发 */
  resize = "resize",
  /** 节点旋转、缩放、位移时，由 node 派发，由于 transform 派发比较频繁（任何pos,scale,rotation改变都会触发），使用的时候，注意性能 */
  transform = "transform",

  /** 指针按下时，由 node 派发 */
  pointerdown = "pointerdown",
  /** 指针抬起时，由 node 派发 */
  pointerup = "pointerup",
  /** 指针移动时，由 node 派发 */
  pointermove = "pointermove",
  /** 指针进入节点时，由 node 派发 */
  pointerover = "pointerover",
  /** 指针离开节点时，由 node 派发 */
  pointerout = "pointerout",
  /** 指针在 canvas 外抬起时，由 node 派发 */
  pointerupoutside = "pointerupoutside",
  /** 点击事件，由 node 派发 */
  click = "click",

  /** 自定义信号，由 node 派发 */
  signal = "signal",
  /** 物理碰撞开始时，由 node 派发 */
  collisionStart = "collisionStart",
  /** 物理碰撞结束时，由 node 派发 */
  collisionEnd = "collisionEnd",

  /** 场景帧更新时，由 scene 派发 */
  update = "update",

  /** 键盘按下时，由 stage 派发 */
  keydown = "keydown",
  /** 键盘抬起时，由 stage 派发 */
  keyup = "keyup",
  /** 鼠标滚轮滚动时，由 stage 派发 */
  wheel = "wheel",

  /** 动画开始播放时，由动画类派发 */
  played = "played",
  /** 动画停止播放时，由动画类派发 */
  stopped = "stopped",
  /** 动画播放完成时，由动画类派发 */
  ended = "ended",
  /** 动画暂停时，由动画类派发 */
  paused = "paused",
  /** 动画恢复播放时，由动画类派发 */
  resumed = "resumed",

  /** 单个资源加载完成时触发 */
  loaded = "loaded",
  /** 资源加载进度更新时触发 */
  progress = "progress",
  /** 所有资源加载完成时触发 */
  complete = "complete",
  /** 资源加载失败时触发 */
  error = "error",
}
