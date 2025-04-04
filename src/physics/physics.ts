import * as planck from "planck";
import type { RigidBody } from "./rigidBody";
import type { IPoint } from "../math/point";
import { Timer } from "../utils/timer";

/** 像素点到物理世界的比率 */
const pixelRatio = 50;

/** planck 物理 */
export const pl = planck;
/** 物理世界 */
export const world = planck.World({ gravity: pl.Vec2(0, 20) });

/** 2D 物理 */
export const physics = {
  /** 物理启用状态 */
  enabled: false,

  /**
   * 设置重力，默认 y=20
   */
  setGravity: function (x = 0, y = 20) {
    world.setGravity(pl.Vec2(x, y));
    return this;
  },

  /**
   * 是否允许休眠
   */
  allowSleeping: function (value: boolean) {
    world.setAllowSleeping(value);
    return this;
  },

  /**
   * 清理世界内的所有施加的力
   */
  clearForces: function () {
    world.clearForces();
    return this;
  },

  /**
   * 移动世界的原点，对于大场景移动比较有用，不过也不推荐
   */
  shiftOrigin: function (x = 0, y = 10) {
    world.shiftOrigin(pl.Vec2(x, y));
    return this;
  },

  /**
   * 开启或者禁用物理
   */
  enable: function (value = true) {
    if (this.enabled !== value) {
      this.enabled = value;
      if (value) Timer.system.frameLoop(1, update);
      else Timer.system.clear(update);
    }
    return this;
  },

  /**
   * 启动物理调试
   */
  debug: function () {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/planck/dist/planck-with-testbed.min.js";
    script.onload = () => {
      const Testbed = (window as any).planck.Testbed;

      const div1 = document.createElement("div");
      div1.id = "testbed-play";
      document.body.appendChild(div1);

      const div2 = document.createElement("div");
      div2.id = "testbed-status";
      document.body.appendChild(div2);

      const div3 = document.createElement("div");
      div3.id = "testbed-info";
      document.body.appendChild(div3);

      const testbed = Testbed.start(world);
      testbed.step = () => {};

      document.body.getElementsByTagName("canvas")[0].style.background = "";
    };
    document.body.appendChild(script);
    return this;
  },
};

let count = 1;
const categoryMap: Record<string, number> = {};

/**
 * 根据分类字符串获得分类的 bit 码
 */
export function getCategoryBit(category?: string): number {
  if (!category) return 1;
  if (!categoryMap[category]) {
    categoryMap[category] = 2 ** count;
    count++;
  }
  return categoryMap[category];
}

/**
 * 根据碰撞列表，返回碰撞掩码
 */
export function getCategoryMask(masks?: string[]): number {
  if (!masks || masks.length === 0) return 65535;
  let num = 0;
  for (const name of masks) {
    num |= getCategoryBit(name);
  }
  return num;
}

/**
 * 转换游戏坐标到物理世界坐标
 */
export function toPhy(value: number) {
  return value / pixelRatio;
}

/**
 * 转换物理坐标到游戏坐标
 */
export function to2D(value: number) {
  return value * pixelRatio;
}

/**
 * 转换游戏坐标到物理世界坐标
 */
export function toPhyPos(pos: IPoint) {
  return pl.Vec2(pos.x / pixelRatio, pos.y / pixelRatio);
}

/**
 * 转换物理坐标到游戏坐标
 */
export function to2DPos(pos: IPoint) {
  return { x: pos.x * pixelRatio, y: pos.y * pixelRatio };
}

/**
 * 处理碰撞穿透
 */
world.on("pre-solve", (contact: planck.Contact) => {
  const data = contact.getFixtureA().getUserData() as any;
  if (data?.crossSide) {
    const normal = contact.getManifold().localNormal;
    switch (data.crossSide) {
      case "left":
        if (normal.x < -0.5) contact.setEnabled(false);
        break;
      case "right":
        if (normal.x > 0.5) contact.setEnabled(false);
        break;
      case "top":
        if (normal.y < -0.5) contact.setEnabled(false);
        break;
      case "bottom":
        if (normal.y > 0.5) contact.setEnabled(false);
        break;
    }
  }
});

// 处理碰撞
world.on("begin-contact", (contact) => onContact(0, contact));
world.on("end-contact", (contact) => onContact(1, contact));

const contacts: any[] = [];
function onContact(type: number, contact: planck.Contact): void {
  contacts.push(type, contact);
}

/**
 * 物理循环
 */
function update(): void {
  world.step(Timer.system.delta);
  for (let i = 0; i < contacts.length; i += 2) {
    const type = contacts[i] ? "collisionEnd" : "collisionStart";
    const contact = contacts[i + 1] as planck.Contact;

    const rigidBodyA = contact.getFixtureA()?.getBody().getUserData() as RigidBody;
    const rigidBodyB = contact.getFixtureB()?.getBody().getUserData() as RigidBody;
    // console.log(type, rigidBodyA.name, rigidBodyB.name, contacts, contact.getManifold());

    if (!rigidBodyA?.destroyed && rigidBodyA?.target.hasListener(type)) {
      rigidBodyA.target.emit(type, {
        other: rigidBodyB,
        contact: { normal: contact.getManifold().localNormal },
      });
    }

    if (!rigidBodyB?.destroyed && rigidBodyB?.target.hasListener(type)) {
      rigidBodyB.target.emit(type, {
        other: rigidBodyA,
        contact: { normal: contact.getManifold().localNormal },
      });
    }
  }
  contacts.length = 0;
}
