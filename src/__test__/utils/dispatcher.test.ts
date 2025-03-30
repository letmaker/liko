import { describe, it, expect, vi, beforeEach } from "vitest";
import { Handler, Dispatcher } from "../../utils/dispatcher";

describe("Handler", () => {
  it("应该正确创建一个Handler实例", () => {
    const callback = vi.fn();
    const caller = {};
    const handler = new Handler(callback, caller, false);

    expect(handler.callback).toBe(callback);
    expect(handler.caller).toBe(caller);
    expect(handler.once).toBe(false);
    expect(handler.destroyed).toBe(false);
  });

  it("应该正确执行回调函数", () => {
    const callback = vi.fn();
    const caller = { name: "test" };
    const handler = new Handler(callback, caller);

    handler.run();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith();
  });

  it("应该正确传递参数给回调函数", () => {
    const callback = vi.fn();
    const handler = new Handler(callback);
    const args = [1, "test", { key: "value" }];

    handler.run(args);
    expect(callback).toHaveBeenCalledWith(...args);
  });

  it("应该在once为true时执行一次后销毁", () => {
    const callback = vi.fn();
    const handler = new Handler(callback, null, true);

    handler.run();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(handler.destroyed).toBe(true);

    // 再次调用不应执行回调
    handler.run();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("应该正确销毁Handler", () => {
    const callback = vi.fn();
    const caller = {};
    const handler = new Handler(callback, caller);

    handler.destroy();
    expect(handler.destroyed).toBe(true);
    expect(handler.callback).toBeUndefined();
    expect(handler.caller).toBeUndefined();

    // 销毁后调用不应执行回调
    handler.run();
    expect(callback).not.toHaveBeenCalled();
  });

  it("重复销毁应该是安全的", () => {
    const handler = new Handler(() => {});

    handler.destroy();
    expect(handler.destroyed).toBe(true);

    // 不应抛出错误
    expect(() => handler.destroy()).not.toThrow();
    expect(handler.destroyed).toBe(true);
  });
});

describe("Dispatcher", () => {
  let dispatcher: Dispatcher;
  let listener: ReturnType<typeof vi.fn>;
  let context: { value: number };

  beforeEach(() => {
    dispatcher = new Dispatcher();
    listener = vi.fn();
    context = { value: 42 };
  });

  it("应该正确注册和触发事件", () => {
    dispatcher.on("test", listener);

    dispatcher.emit("test", 1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1, 2, 3);
  });

  it("事件类型应该不区分大小写", () => {
    dispatcher.on("TEST", listener);

    dispatcher.emit("test");
    expect(listener).toHaveBeenCalledTimes(1);

    dispatcher.emit("Test");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("应该正确使用调用上下文", () => {
    const contextListener = vi.fn(function (this: typeof context) {
      return this.value;
    });

    dispatcher.on("test", contextListener, context);

    dispatcher.emit("test");
    expect(contextListener).toHaveBeenCalledTimes(1);
    expect(contextListener.mock.results[0].value).toBe(42);
  });

  it("once方法应该只执行一次", () => {
    dispatcher.once("test", listener);

    dispatcher.emit("test");
    expect(listener).toHaveBeenCalledTimes(1);

    dispatcher.emit("test");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("应该正确移除特定事件监听器", () => {
    const listener2 = vi.fn();

    dispatcher.on("test", listener);
    dispatcher.on("test", listener2);

    dispatcher.off("test", listener);

    dispatcher.emit("test");
    expect(listener).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("应该正确移除特定上下文的事件监听器", () => {
    const context2 = { value: 100 };

    dispatcher.on("test", listener, context);
    dispatcher.on("test2", listener, context);
    dispatcher.on("test", listener, context2);

    dispatcher.off("test", listener, context);

    dispatcher.emit("test");
    expect(listener).toHaveBeenCalledTimes(1); // 只有context2的被调用

    dispatcher.emit("test2");
    expect(listener).toHaveBeenCalledTimes(2); // test2事件未被移除
  });

  it("不提供listener时应该移除所有该类型的事件监听器", () => {
    const listener2 = vi.fn();

    dispatcher.on("test", listener);
    dispatcher.on("test", listener2);
    dispatcher.on("test2", listener);

    dispatcher.off("test");

    dispatcher.emit("test");
    expect(listener).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();

    dispatcher.emit("test2");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("offAll应该移除特定上下文的所有事件监听器", () => {
    const context2 = {};
    const listener2 = vi.fn();

    dispatcher.on("test", listener, context);
    dispatcher.on("test2", listener, context);
    dispatcher.on("test", listener2, context2);

    dispatcher.offAll(context);

    dispatcher.emit("test");
    expect(listener).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);

    dispatcher.emit("test2");
    expect(listener).not.toHaveBeenCalled();
  });

  it("不提供参数时offAll应该移除所有事件监听器", () => {
    dispatcher.on("test", listener);
    dispatcher.on("test2", listener);

    dispatcher.offAll();

    dispatcher.emit("test");
    dispatcher.emit("test2");
    expect(listener).not.toHaveBeenCalled();
  });

  it("hasListener应该正确检测事件监听器", () => {
    expect(dispatcher.hasListener("test")).toBe(false);

    dispatcher.on("test", listener);
    expect(dispatcher.hasListener("test")).toBe(true);
    expect(dispatcher.hasListener("TEST")).toBe(true); // 不区分大小写

    dispatcher.off("test", listener);
    expect(dispatcher.hasListener("test")).toBe(false);
  });

  it("destroy应该移除所有事件监听器", () => {
    dispatcher.on("test", listener);
    dispatcher.on("test2", listener);

    dispatcher.destroy();

    dispatcher.emit("test");
    dispatcher.emit("test2");
    expect(listener).not.toHaveBeenCalled();
  });

  it("重复注册同一个监听器应该只保留最后一次", () => {
    dispatcher.on("test", listener, context);
    dispatcher.on("test", listener, context); // 重复注册

    dispatcher.emit("test");
    expect(listener).toHaveBeenCalledTimes(1); // 只应该被调用一次
  });

  it("在事件触发过程中移除的监听器应影响当前循环", () => {
    const removeListener = vi.fn(() => {
      dispatcher.off("test", listener2);
    });
    const listener2 = vi.fn();

    dispatcher.on("test", removeListener);
    dispatcher.on("test", listener2);

    dispatcher.emit("test");

    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(0);
  });

  it("在事件触发过程中添加的监听器不应在当前循环中被触发", () => {
    const addListener = vi.fn(() => {
      dispatcher.on("test", listener);
    });

    dispatcher.on("test", addListener);

    dispatcher.emit("test");

    expect(addListener).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();

    dispatcher.emit("test");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
