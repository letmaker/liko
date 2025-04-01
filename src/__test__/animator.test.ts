import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Animator } from "../scripts/animator";
import { Effect } from "../scripts/effect/effect";

// 模拟依赖
vi.mock("../scripts/script-base");
vi.mock("../scripts/effect/effect");

describe("Animator", () => {
  let animator: Animator;
  let mockTarget: any;
  let mockChild: any;
  let mockEffect: any;
  let updateMock: any;
  let gotoMock: any;
  let setPropsMock: any;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();

    // 设置模拟函数
    updateMock = vi.fn();
    gotoMock = vi.fn();
    setPropsMock = vi.fn();

    // 模拟 Effect 构造函数
    (Effect as any).mockImplementation(() => {
      mockEffect = {
        target: null,
        onStart: null,
        onEnd: null,
        setProps: setPropsMock,
        goto: gotoMock,
        update: updateMock,
      };
      return mockEffect;
    });

    // 创建测试对象
    animator = new Animator();

    // 设置模拟对象
    mockChild = {};
    mockTarget = {
      getChild: vi.fn().mockReturnValue(mockChild),
    };
    animator.target = mockTarget;

    // 模拟 signal 方法
    animator.signal = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("基本属性", () => {
    it("应该有默认属性值", () => {
      expect(animator.duration).toBe(0);
      expect(animator.timeScale).toBe(1);
      expect(animator.currentTime).toBe(0);
      expect(animator.paused).toBe(false);
      expect(animator.repeat).toBe(1);
      expect(animator.effects).toEqual([]);
    });

    it("设置 repeat 应该正确处理边界情况", () => {
      animator.repeat = 0;
      expect(animator.repeat).toBe(Number.POSITIVE_INFINITY);

      animator.repeat = -1;
      expect(animator.repeat).toBe(Number.POSITIVE_INFINITY);

      animator.repeat = 5;
      expect(animator.repeat).toBe(5);
    });
  });

  describe("effects 属性", () => {
    it("设置 effects 应该创建相应的 Effect 实例", () => {
      const mockEffects = [
        { targetID: "target1", delay: 0, duration: 1 },
        { targetID: "target2", delay: 0.5, duration: 2 },
      ];

      animator.effects = mockEffects;

      expect(animator.effects).toBe(mockEffects);
      expect(mockTarget.getChild).toHaveBeenCalledTimes(2);
      expect(mockTarget.getChild).toHaveBeenCalledWith("target1", true);
      expect(mockTarget.getChild).toHaveBeenCalledWith("target2", true);
      expect(Effect).toHaveBeenCalledTimes(2);
      expect(setPropsMock).toHaveBeenCalledTimes(2);
    });

    it("设置 effects 时，如果目标不存在，不应创建 Effect 实例", () => {
      mockTarget.getChild.mockReturnValue(null);

      animator.effects = [{ targetID: "nonexistent", delay: 0, duration: 1 }];

      expect(Effect).not.toHaveBeenCalled();
    });

    it("设置 effects 时，应该为每个 Effect 设置回调", () => {
      animator.effects = [{ targetID: "target1", delay: 0, duration: 1 }];

      // 触发回调
      mockEffect.onStart();
      mockEffect.onEnd();

      expect(animator.signal).toHaveBeenCalledWith("animator.startEffect", mockEffect);
      expect(animator.signal).toHaveBeenCalledWith("animator.endEffect", mockEffect);
    });
  });

  describe("方法测试", () => {
    it("pause 方法应该将 paused 设置为 true", () => {
      animator.pause();
      expect(animator.paused).toBe(true);
    });

    it("resume 方法应该将 paused 设置为 false", () => {
      animator.pause();
      expect(animator.paused).toBe(true);

      animator.resume();
      expect(animator.paused).toBe(false);
    });

    it("goto 方法应该更新 currentTime 并调用所有 Effect 的 goto 方法", () => {
      // 设置 effects 以创建 Effect 实例
      animator.effects = [
        { targetID: "target1", delay: 0, duration: 1 },
        { targetID: "target2", delay: 0.5, duration: 2 },
      ];

      animator.goto(0.5);

      expect(animator.currentTime).toBe(0.5);
      expect(gotoMock).toHaveBeenCalledTimes(2);
      expect(gotoMock).toHaveBeenCalledWith(0.5);
    });

    it("onAwake 方法应该发出信号", () => {
      animator.onAwake();
      expect(animator.signal).toHaveBeenCalledWith("animator.awake");
    });

    it("destroy 方法应该清空 effects 并调用父类的 destroy", () => {
      animator.effects = [
        { targetID: "target1", delay: 0, duration: 1 },
        { targetID: "target2", delay: 0.5, duration: 2 },
      ];

      animator.destroy();

      expect(animator.effects.length).toBe(0);
    });
  });

  describe("onUpdate 方法", () => {
    beforeEach(() => {
      // 设置 effects 以创建 Effect 实例
      animator.effects = [{ targetID: "target1", delay: 0, duration: 1 }];
    });

    it("当 paused 为 true 时，不应更新动画", () => {
      animator.pause();
      animator.onUpdate(0.1);

      expect(animator.currentTime).toBe(0);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("当 duration 为 0 时，不应更新动画", () => {
      animator.duration = 0;
      animator.onUpdate(0.1);

      expect(animator.currentTime).toBe(0);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("当 currentTime 已超过 duration 时，不应更新动画", () => {
      animator.duration = 1;
      animator.currentTime = 1.5;
      animator.onUpdate(0.1);

      expect(animator.currentTime).toBe(1.5);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("应该根据 delta 和 timeScale 更新 currentTime", () => {
      animator.duration = 2;
      animator.timeScale = 2;
      animator.onUpdate(0.1);

      expect(animator.currentTime).toBe(0.2); // 0.1 * 2
      expect(updateMock).toHaveBeenCalledWith(0.2);
    });

    it("当 currentTime 达到 duration 时，应该发出结束信号", () => {
      animator.duration = 1;
      animator.currentTime = 0.9;
      animator.onUpdate(0.2);

      expect(animator.currentTime).toBe(1.1);
      expect(animator.signal).toHaveBeenCalledWith("animator.end");
    });

    it("当重复次数未达到限制时，应该重置 currentTime", () => {
      animator.duration = 1;
      animator.repeat = 2;
      animator.currentTime = 0.9;

      animator.onUpdate(0.2); // 第一次结束

      expect(animator.currentTime).toBeCloseTo(0.1); // 1.1 % 1
      expect(animator.signal).toHaveBeenCalledWith("animator.end");
      expect(animator.signal).not.toHaveBeenCalledWith("animator.complete");
    });

    it("当重复次数达到限制时，应该发出完成信号", () => {
      animator.duration = 1;
      animator.repeat = 1;
      animator.currentTime = 0.9;

      animator.onUpdate(0.2);

      expect(animator.currentTime).toBe(1.1);
      expect(animator.signal).toHaveBeenCalledWith("animator.end");
      expect(animator.signal).toHaveBeenCalledWith("animator.complete");
    });
  });
});
