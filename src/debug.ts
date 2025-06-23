import { App, EventType, type LikoPointerEvent, ParticleSystem } from './';

async function test() {
  const app = new App();
  await app.init({
    width: 800,
    height: 800,
    bgColor: '#333333',
  });

  // === 示例1: 使用 plist 配置文件创建粒子系统 ===
  console.log('=== 示例1: 通过plist文件创建火焰效果 ===');
  const fireParticle = new ParticleSystem({
    url: 'assets/particle/fire2.plist',
    parent: app.stage,
    position: { x: 150, y: 300 },
    autoPlay: true, // 自动播放
  });

  // 监听配置加载完成事件
  fireParticle.on(EventType.loaded, () => {
    console.log('火焰粒子配置加载完成');
  });

  const smokeParticle = new ParticleSystem({
    url: 'assets/particle/fire1.plist',
    parent: app.stage,
    position: { x: 150, y: 600 },
    autoPlay: true,
  });

  // === 示例2: 简化的粒子系统（使用部分配置）===
  console.log('=== 示例2: 简化的瀑布效果 ===');
  const waterfallParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 400, y: 100 },
    autoPlay: true,
    config: {
      gravityX: 0,
      gravityY: 150,

      angle: 270,
      angleVariance: 15,

      startColor: { r: 0.3, g: 0.6, b: 1.0, a: 1.0 },
      finishColor: { r: 1, g: 0.3, b: 0.8, a: 0.0 },

      startParticleSize: 8,
      finishParticleSize: 12,

      emissionRate: 100,

      particleLifespan: 3.0,
      particleLifespanVariance: 0.5,

      speed: 100,
    },
  });

  // === 示例3: 爆炸效果 ===
  console.log('=== 示例3: 爆炸效果 动态控制 ===');
  const explosionParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 650, y: 300 },
    autoPlay: true,
    config: {
      startColor: { r: 1.0, g: 0.3, b: 0.1, a: 1.0 },
      finishColor: { r: 1.0, g: 0.8, b: 0.0, a: 0.0 },
      startParticleSize: 15,
      finishParticleSize: 5,
      emissionRate: 300,
    },
  });

  // === 示例4: 动态控制演示 ===
  let controlDemoTime = 0;

  // 每2秒切换一次爆炸效果的播放状态
  setInterval(() => {
    controlDemoTime += 2;

    switch (controlDemoTime % 8) {
      case 0:
        console.log('启动爆炸效果');
        explosionParticle.play();
        break;
      case 2:
        console.log('暂停爆炸效果');
        explosionParticle.pause();
        break;
      case 4:
        console.log('恢复爆炸效果');
        explosionParticle.resume();
        break;
      case 6:
        console.log('停止爆炸效果');
        explosionParticle.stop();
        break;
    }
  }, 2000);

  // === 示例5: 动态修改粒子属性 ===
  console.log('=== 示例5: 动态修改属性演示 ===');

  // 创建一个可修改的粒子系统
  const dynamicParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 650, y: 600 },
  });

  // 初始设置
  dynamicParticle.setGravity(0, -50); // 向上
  dynamicParticle.setAngle(90, 30); // 向上发射
  dynamicParticle.setStartColor({ r: 1.0, g: 1.0, b: 1.0, a: 1.0 }); // 白色
  dynamicParticle.setEndColor({ r: 1.0, g: 1.0, b: 1.0, a: 0.0 }); // 透明白色
  dynamicParticle.setParticleSize(10, 5);
  dynamicParticle.setEmissionRate(50);
  dynamicParticle.setParticleLifespan(2.0);
  dynamicParticle.play();

  // 每3秒改变一次颜色和大小
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

    // 动态修改颜色
    dynamicParticle.setStartColor(color);
    dynamicParticle.setEndColor({ ...color, a: 0.0 });

    // 动态修改大小
    const size = 5 + (colorIndex % 3) * 5;
    dynamicParticle.setParticleSize(size, size / 2);

    // 动态修改发射速率
    const rate = 30 + (colorIndex % 4) * 20;
    dynamicParticle.setEmissionRate(rate);

    colorIndex++;
  }, 3000);

  // === 示例6: 性能监控和信息显示 ===
  console.log('=== 示例6: 性能监控 ===');

  // 每5秒输出粒子系统状态
  setInterval(() => {
    console.log('=== 粒子系统状态 ===');
    console.log(`火焰粒子数量: ${fireParticle.particleCount}, 播放中: ${fireParticle.isPlaying}`);
    console.log(`烟雾粒子数量: ${smokeParticle.particleCount}, 播放中: ${smokeParticle.isPlaying}`);
    console.log(`瀑布粒子数量: ${waterfallParticle.particleCount}, 播放中: ${waterfallParticle.isPlaying}`);
    console.log(
      `爆炸粒子数量: ${explosionParticle.particleCount}, 播放中: ${explosionParticle.isPlaying}, 暂停: ${explosionParticle.isPaused}`
    );
    console.log(`动态粒子数量: ${dynamicParticle.particleCount}, 播放中: ${dynamicParticle.isPlaying}`);

    const totalParticles =
      fireParticle.particleCount +
      smokeParticle.particleCount +
      waterfallParticle.particleCount +
      explosionParticle.particleCount +
      dynamicParticle.particleCount;
    console.log(`总粒子数量: ${totalParticles}`);
  }, 5000);

  // === 示例7: 事件监听演示 ===
  console.log('=== 示例7: 事件监听演示 ===');

  // 创建一个循环播放的粒子系统
  const burstParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 400, y: 500 },
  });

  // 设置脉冲效果
  burstParticle.setStartColor({ r: 1.0, g: 0.8, b: 0.0, a: 1.0 }); // 金黄色
  burstParticle.setEndColor({ r: 1.0, g: 0.2, b: 0.0, a: 0.0 }); // 透明红色
  burstParticle.setParticleSize(12, 3);
  burstParticle.setEmissionRate(100);
  burstParticle.setParticleLifespan(1.5);

  // 模拟脉冲效果：播放一段时间后停止，然后重新开始
  function startBurst() {
    burstParticle.play();
    setTimeout(() => {
      burstParticle.stop();
      setTimeout(startBurst, 2000); // 2秒后重新开始
    }, 2000); // 播放2秒
  }

  // 启动脉冲效果
  startBurst();

  // === 示例8: 鼠标交互粒子 ===
  console.log('=== 示例8: 鼠标交互粒子 ===');

  // 创建跟随鼠标的粒子系统
  const mouseParticle = new ParticleSystem({
    parent: app.stage,
    position: { x: 400, y: 400 },
  });

  // 设置彩色粒子
  mouseParticle.setStartColor({ r: 0.8, g: 0.2, b: 0.8, a: 1.0 }); // 紫色
  mouseParticle.setEndColor({ r: 0.2, g: 0.8, b: 0.8, a: 0.0 }); // 透明青色
  mouseParticle.setParticleSize(6, 2);
  mouseParticle.setEmissionRate(30);
  mouseParticle.setParticleLifespan(1.0);
  mouseParticle.setGravity(0, 20); // 轻微向下的重力
  mouseParticle.play();

  // 监听鼠标移动事件（简化版，实际应用中需要更复杂的事件处理）
  app.stage.on(EventType.pointerMove, (event: LikoPointerEvent) => {
    if (event.pointer) {
      mouseParticle.position.set(event.pointer.x, event.pointer.y);
    }
  });
}

test();
