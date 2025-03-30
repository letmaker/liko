import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect } from "../scripts/effect/effect";
import { Ease } from "../scripts/effect/ease";

describe("Effect", () => {
  let effect: Effect;
  let target: { x: number; y: number; scale: { x: number; y: number } };

  beforeEach(() => {
    // 重置测试对象
    target = { x: 0, y: 0, scale: { x: 1, y: 1 } };
    effect = new Effect();
    effect.target = target;
    effect.duration = 1;
  });

  describe("基本属性设置", () => {
    it("应该正确设置和获取delay属性", () => {
      effect.delay = 0.5;
      expect(effect.delay).toBe(0.5);
    });

    it("应该正确设置和获取repeat属性", () => {
      effect.repeat = 3;
      expect(effect.repeat).toBe(3);
    });

    it("repeat设置为0时应该表示无限重复", () => {
      effect.repeat = 0;
      expect(effect.repeat).toBe(Number.POSITIVE_INFINITY);
    });

    it("应该正确设置和获取ease属性", () => {
      effect.ease = Ease.QuadIn;
      expect(effect.ease).toBe(Ease.QuadIn);
    });

    it("应该能通过字符串设置ease属性", () => {
      // 使用字符串设置ease属性
      effect.ease = "QuadIn";

      // 验证ease属性是否正确设置为对应的缓动函数
      expect(effect.ease).toBe(Ease.QuadIn);

      // 测试另一个缓动函数
      effect.ease = "BounceOut";
      expect(effect.ease).toBe(Ease.BounceOut);

      // 测试默认情况（无效的缓动名称应该返回Linear）
      effect.ease = "NonExistentEase";
      expect(effect.ease).toBe(Ease.Linear);
    });
  });

  describe("setProps 和 setProp 方法", () => {
    it("setProps应该批量设置多个属性", () => {
      effect.setProps({
        duration: 2,
        delay: 0.5,
        yoyo: true,
      });

      expect(effect.duration).toBe(2);
      expect(effect.delay).toBe(0.5);
      expect(effect.yoyo).toBe(true);
    });

    it("setProp应该设置单个属性", () => {
      effect.setProp("duration", 3);
      expect(effect.duration).toBe(3);
    });
  });

  describe("to属性动画", () => {
    it("应该从当前值过渡到目标值", () => {
      target.x = 0;
      effect.to = { x: 100 };

      // 模拟动画开始
      effect.update(0);
      expect(effect.started).toBe(true);
      expect(target.x).toBeCloseTo(0);

      // 模拟动画中间状态
      effect.update(0.5);
      expect(target.x).toBeCloseTo(50);

      // 模拟动画结束
      effect.update(1);
      expect(target.x).toBeCloseTo(100);
      expect(effect.ended).toBe(true);
    });

    it("应该支持对象属性的动画", () => {
      target.scale = { x: 1, y: 1 };
      effect.to = { scale: { x: 2, y: 3 } };

      effect.update(0);
      expect(target.scale.x).toBeCloseTo(1);
      expect(target.scale.y).toBeCloseTo(1);

      effect.update(0.5);
      expect(target.scale.x).toBeCloseTo(1.5);
      expect(target.scale.y).toBeCloseTo(2);

      effect.update(1);
      expect(target.scale.x).toBeCloseTo(2);
      expect(target.scale.y).toBeCloseTo(3);
    });

    it("应该支持相对值动画（字符串形式）", () => {
      target.x = 100;
      effect.to = { x: "+50" }; // 相对增加50

      effect.update(0);
      effect.update(1);
      expect(target.x).toBeCloseTo(150);

      // 测试乘法相对值
      effect.reset();
      target.y = 10;
      effect.to = { y: "*2" }; // 相对乘以2

      effect.update(0);
      effect.update(1);
      expect(target.y).toBeCloseTo(20);
    });
  });

  describe("from属性动画", () => {
    it("应该从指定起始值过渡到当前值", () => {
      target.x = 100;
      effect.from = { x: 0 };

      effect.update(0);
      expect(target.x).toBeCloseTo(0);

      effect.update(0.5);
      expect(target.x).toBeCloseTo(50);

      effect.update(1);
      expect(target.x).toBeCloseTo(100);
    });
  });

  describe("动画控制", () => {
    it("应该支持延迟开始", () => {
      target.x = 0;
      effect.to = { x: 100 };
      effect.delay = 0.5;

      effect.update(0.3);
      expect(effect.started).toBe(false);
      expect(target.x).toBe(0);

      effect.update(0.6);
      expect(effect.started).toBe(true);
      expect(target.x).toBeGreaterThan(0);
    });

    it("应该支持重复播放", () => {
      target.x = 0;
      effect.to = { x: 100 };
      effect.repeat = 2;

      // 第一次播放
      const onEndSpy = vi.spyOn(effect, "onEnd");
      effect.update(0);
      effect.update(1);
      expect(target.x).toBeCloseTo(100);
      expect(effect.ended).toBe(false);
      expect(onEndSpy).toHaveBeenCalled();

      // 第二次播放
      effect.update(2);
      expect(target.x).toBeCloseTo(100);
      expect(effect.ended).toBe(true);
    });

    it("应该支持yoyo模式", () => {
      target.x = 0;
      effect.to = { x: 100 };
      effect.repeat = 2;
      effect.yoyo = true;

      // 第一次播放（正向）
      effect.update(0);
      effect.update(1);
      expect(target.x).toBeCloseTo(100);

      // 第二次播放（反向）
      effect.update(1.001); // 触发onEnd
      effect.update(1.5); // 中间状态
      expect(target.x).toBeCloseTo(50);

      effect.update(2);
      expect(target.x).toBeCloseTo(0);
    });

    it("应该支持goto方法", () => {
      target.x = 0;
      effect.to = { x: 100 };
      effect.duration = 2;

      effect.goto(1);
      expect(target.x).toBeCloseTo(50);

      effect.goto(2);
      expect(target.x).toBeCloseTo(100);
    });
  });

  describe("回调函数", () => {
    it("应该正确触发onAwake回调", () => {
      const onAwakeSpy = vi.fn();
      effect.onAwake = onAwakeSpy;
      effect.to = { x: 100 };

      effect.update(0);
      expect(onAwakeSpy).toHaveBeenCalledWith(target);
      expect(onAwakeSpy).toHaveBeenCalledTimes(1);

      // 确保只触发一次
      effect.update(0.5);
      expect(onAwakeSpy).toHaveBeenCalledTimes(1);
    });

    it("应该正确触发onStart回调", () => {
      const onStartSpy = vi.fn();
      effect.onStart = onStartSpy;
      effect.to = { x: 100 };

      effect.update(0);
      expect(onStartSpy).toHaveBeenCalledWith(target);
    });

    it("应该正确触发onEnd回调", () => {
      const onEndSpy = vi.fn();
      effect.onEnd = onEndSpy;
      effect.to = { x: 100 };

      effect.update(0);
      effect.update(1);
      expect(onEndSpy).toHaveBeenCalledWith(target);
    });

    it("应该正确触发onComplete回调", () => {
      const onCompleteSpy = vi.fn();
      effect.onComplete = onCompleteSpy;
      effect.to = { x: 100 };

      effect.update(0);
      effect.update(1);
      expect(onCompleteSpy).toHaveBeenCalledWith(target);
    });

    it("重复播放时应该多次触发onStart和onEnd，但只触发一次onComplete", () => {
      const onStartSpy = vi.fn();
      const onEndSpy = vi.fn();
      const onCompleteSpy = vi.fn();

      effect.onStart = onStartSpy;
      effect.onEnd = onEndSpy;
      effect.onComplete = onCompleteSpy;

      effect.to = { x: 100 };
      effect.repeat = 2;

      // 第一次播放
      effect.update(0);
      effect.update(1);

      // 第二次播放
      effect.update(1.001);
      effect.update(2);

      expect(onStartSpy).toHaveBeenCalledTimes(2);
      expect(onEndSpy).toHaveBeenCalledTimes(2);
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("缓动函数", () => {
    it("应该使用指定的缓动函数", () => {
      target.x = 0;
      effect.to = { x: 100 };

      // 使用二次缓动
      effect.ease = Ease.QuadIn; // t => t * t

      effect.update(0);
      effect.update(0.5); // 使用QuadIn时，0.5的进度值应该是0.25
      expect(target.x).toBeCloseTo(25);

      effect.update(1);
      expect(target.x).toBeCloseTo(100);
    });
  });
});
