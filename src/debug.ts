// 这是一个示例程序，展示如何使用 liko 游戏引擎来加载和显示一个场景
// liko 是一个 2D 游戏引擎，可以帮助开发者快速创建游戏
import { App, Scene, Script, register } from './';

async function test() {
  // 创建一个新的游戏应用程序
  const app = new App();
  // 设置游戏窗口的基本属性：
  // - 窗口大小为 800x800 像素
  // - 背景色设置为深灰色（十六进制颜色值：0x333333）
  await app.init({ width: 800, height: 800, bgColor: 0x333333 });

  // 向游戏引擎注册我们自定义的脚本组件
  // 注册后，我们就可以在场景配置文件（JSON）中使用这个脚本了
  register.regScript('TestScript', TestScript);

  // 创建一个新的游戏场景
  // 场景是游戏中的一个独立空间，比如游戏的某个关卡
  const scene = new Scene();
  // 将创建的场景添加到游戏的主舞台中
  // 舞台是显示所有游戏内容的容器
  app.stage.addChild(scene);
  // 加载场景的配置文件
  // 配置文件中定义了场景中的所有对象、位置、属性等信息
  scene.load('scenes/test-scene.json');
}
// 运行测试函数
test();

/**
 * 这是一个自定义的游戏脚本类
 * 通过继承 Script 基类，我们可以为游戏对象添加自定义的行为
 * 比如这个脚本会让游戏对象不断旋转
 */
class TestScript extends Script {
  /**
   * onAwake 是一个特殊的函数，它会在游戏对.象被创建后立即调用
   * 可以在这里进行一些初始化工作
   */
  override onAwake(): void {
    console.log('awake'); // 在控制台打印消息，表示对象已经被创建
  }

  /**
   * onUpdate 函数会在每一帧画面更新时被调用
   * 游戏通常每秒会更新 60 次画面，所以这个函数每秒会被调用 60 次
   * 这里的代码会让游戏对象每帧旋转 1 度，形成持续旋转的效果
   */
  override onUpdate(): void {
    this.target.angle++; // this.target 表示当前脚本所附加的游戏对象
  }
}
