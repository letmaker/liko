import { App, EventType, type LikoPointerEvent, ParticleSystem } from './';

/**
 * 粒子系统使用示例
 */
async function test() {
  // 初始化应用程序，创建800x800的画布，背景色为深灰色
  const app = new App();
  await app.init({
    width: 800,
    height: 800,
    bgColor: '#333333', // 深灰色背景便于观察粒子效果
  });

  // === 示例1: 使用 plist 配置文件创建粒子系统 ===
  // plist文件是Apple的属性列表格式，常用于存储粒子系统的完整配置
  console.log('=== 示例1: 通过plist文件创建火焰效果 ===');

  /**
   * 火焰粒子系统
   * - url: plist配置文件路径，包含了完整的粒子参数
   * - parent: 父容器，决定粒子在哪个显示对象中渲染
   * - position: 粒子发射器的初始位置
   * - autoPlay: 是否自动开始播放，true表示创建后立即开始发射粒子
   */
  const fireParticle = new ParticleSystem({
    url: 'assets/particle/fire.plist', // 火焰效果的预设配置
    parent: app.stage, // 添加到舞台根节点
    position: { x: 150, y: 300 }, // 屏幕左侧位置
    autoPlay: true, // 创建后自动播放
  });

  // 监听配置加载完成事件
  // 当plist文件加载并解析完成后触发此事件
  fireParticle.on(EventType.loaded, () => {
    console.log('火焰粒子配置加载完成');
    // 此时可以安全地访问粒子系统的所有属性和方法
  });

  /**
   * 烟雾粒子系统
   * 使用不同的plist文件创建另一种视觉效果
   */
  const smokeParticle = new ParticleSystem({
    url: 'assets/particle/smoke.plist', // 烟雾效果的预设配置
    parent: app.stage,
    position: { x: 150, y: 600 }, // 放在火焰下方，模拟真实的火焰+烟雾效果
    autoPlay: true,
  });

  // === 示例2: 简化的粒子系统（使用部分配置）===
  // 不使用plist文件，而是直接在代码中配置粒子参数
  console.log('=== 示例2: 简化的瀑布效果 ===');

  /**
   * 瀑布粒子系统 - 手动配置参数演示
   * config对象包含了粒子系统的各种物理和视觉参数
   */
  const waterfallParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 400, y: 100 }, // 屏幕上方，模拟瀑布从高处落下
    autoPlay: true,
    config: {
      // 重力设置：影响粒子的加速度
      gravityX: 0, // 水平重力为0，粒子不会左右偏移
      gravityY: 150, // 垂直重力150，粒子会加速向下落

      // 发射角度设置
      angle: 270, // 270度表示向下发射（0度为右，90度为下，180度为左，270度为上）
      angleVariance: 15, // 角度随机变化范围±15度，增加自然感

      // 颜色设置：RGBA格式，值范围0-1
      startColor: { r: 0.3, g: 0.6, b: 1.0, a: 1.0 }, // 开始时的蓝色（模拟水）
      finishColor: { r: 1, g: 0.3, b: 0.8, a: 0.0 }, // 结束时的粉色并逐渐透明

      // 粒子大小设置
      startParticleSize: 8, // 粒子初始大小
      finishParticleSize: 12, // 粒子结束时的大小（比初始大小大，模拟水滴扩散）

      // 发射速率：每秒发射的粒子数量
      emissionRate: 100,

      // 粒子生命周期设置
      particleLifespan: 3.0, // 每个粒子存活3秒
      particleLifespanVariance: 0.5, // 生命周期随机变化±0.5秒

      // 初始速度：粒子发射时的速度
      speed: 100, // 初始速度100像素/秒
    },
  });

  // === 示例3: 爆炸效果 ===
  // 演示高强度、短时间的粒子效果
  console.log('=== 示例3: 爆炸效果 动态控制 ===');

  /**
   * 爆炸粒子系统
   * 特点：高发射率、强烈的颜色对比、粒子从大到小
   */
  const explosionParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 650, y: 300 }, // 屏幕右侧
    autoPlay: true,
    config: {
      // 爆炸效果的典型颜色：从亮橙红色到透明黄色
      startColor: { r: 1.0, g: 0.3, b: 0.1, a: 1.0 }, // 明亮的橙红色
      finishColor: { r: 1.0, g: 0.8, b: 0.0, a: 0.0 }, // 透明的黄色

      // 粒子大小：从大到小，模拟爆炸碎片
      startParticleSize: 15, // 开始时较大
      finishParticleSize: 5, // 结束时变小

      // 高发射率产生密集的粒子群
      emissionRate: 300, // 每秒300个粒子，产生密集效果
    },
  });

  // === 示例4: 动态控制演示 ===
  // 演示如何程序化控制粒子系统的播放状态
  let controlDemoTime = 0;

  // 每2秒切换一次爆炸效果的播放状态，演示粒子系统的生命周期管理
  setInterval(() => {
    controlDemoTime += 2;

    // 循环演示四种状态：播放 -> 暂停 -> 恢复 -> 停止
    switch (controlDemoTime % 8) {
      case 0:
        console.log('启动爆炸效果');
        explosionParticle.play(); // 开始发射新粒子
        break;
      case 2:
        console.log('暂停爆炸效果');
        explosionParticle.pause(); // 停止发射新粒子，但已存在粒子继续运动
        break;
      case 4:
        console.log('恢复爆炸效果');
        explosionParticle.resume(); // 从暂停状态恢复，继续发射粒子
        break;
      case 6:
        console.log('停止爆炸效果');
        explosionParticle.stop(); // 完全停止，清除所有粒子
        break;
    }
  }, 2000);

  // === 示例5: 动态修改粒子属性 ===
  // 演示如何在运行时实时修改粒子系统的各种参数
  console.log('=== 示例5: 动态修改属性演示 ===');

  /**
   * 可动态修改的粒子系统
   * 注意：这里不设置autoPlay，而是先配置参数再手动播放
   */
  const dynamicParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 650, y: 600 }, // 屏幕右下角
  });

  // 使用setter方法逐一配置粒子参数
  // 这种方式比config对象更灵活，适合动态修改
  dynamicParticle.setGravity(0, -50); // 设置重力：无水平重力，向上的垂直重力
  dynamicParticle.setAngle(90, 30); // 设置发射角度：90度±30度（向上发射）
  dynamicParticle.setStartColor({ r: 1.0, g: 1.0, b: 1.0, a: 1.0 }); // 开始颜色：白色
  dynamicParticle.setEndColor({ r: 1.0, g: 1.0, b: 1.0, a: 0.0 }); // 结束颜色：透明白色
  dynamicParticle.setParticleSize(10, 5); // 设置粒子大小：从10像素到5像素
  dynamicParticle.setEmissionRate(50); // 设置发射率：每秒50个粒子
  dynamicParticle.setParticleLifespan(2.0); // 设置粒子生命周期：2秒
  dynamicParticle.play(); // 开始播放

  // 演示动态修改：每3秒改变一次颜色、大小和发射率
  let colorIndex = 0;
  const colors = [
    { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }, // 红色
    { r: 0.0, g: 1.0, b: 0.0, a: 1.0 }, // 绿色
    { r: 0.0, g: 0.0, b: 1.0, a: 1.0 }, // 蓝色
    { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }, // 黄色
    { r: 1.0, g: 0.0, b: 1.0, a: 1.0 }, // 紫色
  ];

  setInterval(() => {
    const color = colors[colorIndex % colors.length];
    console.log(`改变粒子颜色为: R:${color.r} G:${color.g} B:${color.b}`);

    // 动态修改颜色：保持不透明度，但改变RGB值
    dynamicParticle.setStartColor(color);
    dynamicParticle.setEndColor({ ...color, a: 0.0 }); // 结束时变透明

    // 动态修改大小：根据颜色索引计算不同的大小
    const size = 5 + (colorIndex % 3) * 5; // 5, 10, 15像素循环
    dynamicParticle.setParticleSize(size, size / 2);

    // 动态修改发射速率：在30-90之间变化
    const rate = 30 + (colorIndex % 4) * 20; // 30, 50, 70, 90循环
    dynamicParticle.setEmissionRate(rate);

    colorIndex++;
  }, 3000);

  // === 示例6: 性能监控和信息显示 ===
  // 粒子系统的性能监控对于调试和优化非常重要
  console.log('=== 示例6: 性能监控 ===');

  // 每5秒输出所有粒子系统的状态信息
  setInterval(() => {
    console.log('=== 粒子系统状态 ===');

    // particleCount: 当前活跃的粒子数量
    // isPlaying: 是否正在发射新粒子
    // isPaused: 是否处于暂停状态
    console.log(`火焰粒子数量: ${fireParticle.particleCount}, 播放中: ${fireParticle.isPlaying}`);
    console.log(`烟雾粒子数量: ${smokeParticle.particleCount}, 播放中: ${smokeParticle.isPlaying}`);
    console.log(`瀑布粒子数量: ${waterfallParticle.particleCount}, 播放中: ${waterfallParticle.isPlaying}`);
    console.log(
      `爆炸粒子数量: ${explosionParticle.particleCount}, 播放中: ${explosionParticle.isPlaying}, 暂停: ${explosionParticle.isPaused}`
    );
    console.log(`动态粒子数量: ${dynamicParticle.particleCount}, 播放中: ${dynamicParticle.isPlaying}`);

    // 计算总粒子数量，用于性能评估
    const totalParticles =
      fireParticle.particleCount +
      smokeParticle.particleCount +
      waterfallParticle.particleCount +
      explosionParticle.particleCount +
      dynamicParticle.particleCount;
    console.log(`总粒子数量: ${totalParticles}`);

    // 性能提示：一般情况下总粒子数量应控制在几千个以内
    // 如果粒子数量过多可能影响帧率
  }, 5000);

  // === 示例7: 事件监听演示 ===
  // 演示如何创建具有特定行为模式的粒子效果
  console.log('=== 示例7: 事件监听演示 ===');

  /**
   * 脉冲式粒子系统
   * 特点：周期性播放，模拟爆发式效果
   */
  const burstParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 400, y: 500 }, // 屏幕中下方
  });

  // 配置脉冲效果的视觉参数
  burstParticle.setStartColor({ r: 1.0, g: 0.8, b: 0.0, a: 1.0 }); // 金黄色开始
  burstParticle.setEndColor({ r: 1.0, g: 0.2, b: 0.0, a: 0.0 }); // 透明红色结束
  burstParticle.setParticleSize(12, 3); // 从大到小
  burstParticle.setEmissionRate(100); // 中等发射率
  burstParticle.setParticleLifespan(1.5); // 较短的生命周期

  /**
   * 脉冲效果控制函数
   * 实现：播放2秒 -> 停止2秒 -> 循环
   * 这种模式适合创建节奏感强的视觉效果
   */
  function startBurst() {
    burstParticle.play(); // 开始发射
    setTimeout(() => {
      burstParticle.stop(); // 停止发射并清除现有粒子
      setTimeout(startBurst, 2000); // 2秒后重新开始循环
    }, 2000); // 播放2秒
  }

  // 启动脉冲效果循环
  startBurst();

  // === 示例8: 鼠标交互粒子 ===
  // 演示如何创建响应用户输入的交互式粒子效果
  console.log('=== 示例8: 鼠标交互粒子 ===');

  /**
   * 跟随鼠标的粒子系统
   * 应用场景：鼠标轨迹效果、UI反馈、游戏特效等
   */
  const mouseParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 400, y: 400 }, // 初始位置在屏幕中央
  });

  // 配置彩色拖尾效果
  mouseParticle.setStartColor({ r: 0.8, g: 0.2, b: 0.8, a: 1.0 }); // 紫色开始
  mouseParticle.setEndColor({ r: 0.2, g: 0.8, b: 0.8, a: 0.0 }); // 透明青色结束
  mouseParticle.setParticleSize(6, 2); // 小粒子，适合拖尾效果
  mouseParticle.setEmissionRate(30); // 较低发射率，避免过于密集
  mouseParticle.setParticleLifespan(1.0); // 短生命周期，产生拖尾效果
  mouseParticle.setGravity(0, 20); // 轻微向下的重力，增加自然感
  mouseParticle.play();

  /**
   * 鼠标移动事件监听
   * 当鼠标在舞台上移动时，实时更新粒子发射器位置
   * 这创造了粒子跟随鼠标的效果
   */
  app.stage.on(EventType.pointerMove, (event: LikoPointerEvent) => {
    if (event.pointer) {
      // 将粒子发射器位置设置为鼠标当前位置
      mouseParticle.position.set(event.pointer.x, event.pointer.y);
    }
  });
}

// 执行测试函数，启动所有粒子系统演示
test();
