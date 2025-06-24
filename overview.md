# liko [中文文档](README-CN.md)
Liko is a lightweight, high-performance H5 rendering framework developed using TypeScript.

Liko is a high-performance rendering engine based on WebGPU, specially designed for AI.

Liko can be used for game development, H5 applications, and interactive scenarios.

## Features
- Designed based on WebGPU
- Specially designed for artificial intelligence and editors
- Lightweight
- High performance
- Covers all functionality needed for games

## Capabilities
- 2D rendering
- Sprite rendering
- AnimatedSprite rendering
- Text rendering
- Canvas rendering
- Built-in physics engine
- Built-in audio system
- Built-in particle system
- Built-in script system
- Built-in animation system
- Built-in easing system
- Built-in event system
- Built-in filter system (under construction)
- Built-in resource management
- Built-in scene management
- Built-in timing management

## How to use

```bash
npm install liko
```

overview

```typescript
/**
 * Liko游戏引擎功能综合示例 - AI学习参考
 */
import {
  App,
  Scene,
  Text,
  Sprite,
  AnimatedSprite,
  Canvas,
  Shape,
  RigidBody,
  Texture,
  Tween,
  Timer,
  music,
  sound,
  utils,
  Rectangle,
  loader,
  Ease,
  EventType,
  ParticleSystem,
  type LikoPointerEvent,
  type LikoNode,
} from "liko";

async function likoEngineOverview() {
  // 1. 应用初始化 - 基础配置
  const app = new App();
  await app.init({
    width: 1200,
    height: 960,
    bgColor: 0x2c3e50,
    container: "gameContainer", // 游戏容器节点或者名称
    physics: {
      // 物理引擎配置(如果需要再开启，不需要无需配置)
      enabled: true, // 启用物理系统
      debug: false, // 关闭调试显示
      boundaryArea: new Rectangle(0, 0, 1200, 950).pad(50), // 设置物理边界，超出边界后，物理对象会被销毁
    },
  });

  // 2. 场景创建
  const mainScene = new Scene({ width: 1200, height: 950, parent: app.stage });

  // 3. 文本渲染 - 基本用法
  new Text({
    label: "title",
    text: "Liko引擎功能展示\nLiko Game Engine Features",
    textColor: "#ecf0f1",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    position: { x: 600, y: 40 },
    anchor: { x: 0.5, y: 0.5 }, // 锚点设置
    parent: mainScene,
  });

  // 渐变文本 - 使用utils.createLinearGradient
  new Text({
    text: "支持渐变色文本效果",
    textColor: utils.createLinearGradient({ startX: 0, endX: 250, startY: 0, endY: 0 }, [
      { offset: 0, color: "#e74c3c" },
      { offset: 0.5, color: "#f39c12" },
      { offset: 1, color: "#2ecc71" },
    ]),
    fontSize: 22,
    fontWeight: "bold",
    position: { x: 50, y: 120 },
    parent: mainScene,
  });

  // 描边文本 - 两种创建方式对比
  const strokeText = new Text();
  strokeText.label = "strokeText";
  strokeText.text = "描边文本效果";
  strokeText.textColor = "#3498db";
  strokeText.fontSize = 22;
  strokeText.fontWeight = "bold";
  strokeText.textStrokeWidth = 3;
  strokeText.textStrokeColor = "#ffffff";
  strokeText.position.set(450, 120);
  mainScene.addChild(strokeText);

  // 动态文本更新 - 使用Timer
  const timerText = new Text({
    text: "运行时间: 0秒",
    fontSize: 16,
    textColor: "red",
    parent: mainScene,
    position: { x: 650, y: 125 },
  });

  const startTime = Date.now();
  app.stage.timer.setInterval(1, () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerText.text = `运行时间: ${elapsed}秒`;
  });

  new Text({
    text: "精灵系统与动画",
    textColor: "#f1c40f",
    fontSize: 20,
    fontWeight: "bold",
    position: { x: 50, y: 180 },
    parent: mainScene,
  });

  // 4. 精灵系统 - 静态精灵
  new Sprite({
    url: "assets/bg2.webp",
    width: 150,
    height: 100,
    alpha: 0.8,
    position: { x: 50, y: 210 },
    parent: mainScene,
  });

  // 可交互精灵 - 事件处理示例
  const interactiveSprite = new Sprite();
  interactiveSprite.url = "assets/apple.png";
  interactiveSprite.scale.set(0.4);
  interactiveSprite.anchor = { x: 0.5, y: 0.5 };
  interactiveSprite.position.set(300, 240);
  mainScene.addChild(interactiveSprite);

  // 鼠标事件绑定
  interactiveSprite.on(EventType.pointerOver, () => {
    interactiveSprite.scale.set(0.45);
    interactiveSprite.tintColor = 0xff6b6b; // 颜色着色
  });
  interactiveSprite.on(EventType.pointerOut, () => {
    interactiveSprite.scale.set(0.4);
    interactiveSprite.tintColor = 0xffffff;
  });

  interactiveSprite.on(EventType.click, () => {
    sound.play("assets/sound/bullet.mp3", 0.5); // 音效播放
    // Tween动画 - 旋转效果
    Tween.to({
      target: interactiveSprite,
      props: { angle: "+360" }, // 相对值使用"+"前缀
      duration: 0.5,
    }).play();
  });

  // Tween动画系统示例
  const rotatingSprite = new Sprite({
    url: "assets/strawberry.png",
    scale: { x: 0.4, y: 0.4 },
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 450, y: 240 },
    parent: mainScene,
  });

  // 连续旋转动画 - 无限循环
  Tween.to({
    target: rotatingSprite,
    props: { angle: 360 },
    duration: 3,
    repeat: 0, // 0表示无限重复
    onUpdate: (progress: number) => {
      rotatingSprite.angle = progress * 360;
    },
  }).play();

  // 往复动画 - yoyo效果
  const floatingSprite = new Sprite({
    url: "assets/girl.png",
    width: 56,
    height: 78,
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 600, y: 240 },
    parent: mainScene,
  });

  Tween.to({
    target: floatingSprite,
    props: { position: { y: 180 } },
    duration: 2,
    repeat: 0,
    yoyo: true, // 往复运动
  }).play();

  // 纹理切换 - loader加载与动态更换
  const boyTexture = await loader.load<Texture>("assets/boy.png");
  const girlTexture = await loader.load<Texture>("assets/girl.png");
  const switchableSprite = new Sprite({
    texture: boyTexture,
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 750, y: 240 },
    scale: { x: 0.8, y: 0.8 },
    parent: mainScene,
  });

  let frameIndex = 0;
  switchableSprite.on(EventType.click, async () => {
    frameIndex = frameIndex === 1 ? 0 : 1;
    if (girlTexture && boyTexture) {
      switchableSprite.texture = switchableSprite.texture === boyTexture ? girlTexture : boyTexture;
      // 缩放动画效果
      Tween.to({
        target: switchableSprite,
        props: { scale: { x: 1.0, y: 1.0 } },
        duration: 0.2,
        yoyo: true,
        repeat: 2,
      }).play();
    }
  });

  new Text({
    text: "动画精灵(AnimatedSprite)系统",
    textColor: "#e67e22",
    fontSize: 18,
    fontWeight: "bold",
    position: { x: 50, y: 320 },
    parent: mainScene,
  });

  // 动画精灵 - Atlas文件加载
  new AnimatedSprite({
    url: "assets/sheet/fliggy.atlas",
    parent: mainScene,
    position: { x: 50, y: 380 },
    scale: { x: 0.8, y: 0.8 },
  }).play();

  // 控制帧率的动画精灵
  new AnimatedSprite({
    url: "assets/sheet/zombie.atlas",
    parent: mainScene,
    position: { x: 180, y: 350 },
    scale: { x: 0.4, y: 0.4 },
    frameRate: 8, // 帧率控制
  }).play();

  new AnimatedSprite({
    url: "assets/sheet/fire-rotated.atlas",
    parent: mainScene,
    position: { x: 310, y: 350 },
    scale: { x: 0.6, y: 0.6 },
    frameRate: 15,
  }).play();

  // 动态切换动画纹理 - 使用纹理数组
  const jumpTextures = await loader.load<Texture[]>("assets/sheet/girl-jump.atlas", "sheet");
  const runTextures = await loader.load<Texture[]>("assets/sheet/girl-run.atlas", "sheet");

  if (runTextures && jumpTextures) {
    const interactiveGirl = new AnimatedSprite({
      textures: runTextures,
      parent: mainScene,
      position: { x: 440, y: 350 },
      scale: { x: 0.4, y: 0.4 },
      frameRate: 8,
    });
    interactiveGirl.play();

    interactiveGirl.on(EventType.click, () => {
      if (interactiveGirl.textures === jumpTextures) return;

      interactiveGirl.textures = jumpTextures; // 切换纹理组

      // 跳跃动画配合
      Tween.to({
        target: interactiveGirl,
        props: {
          position: { x: interactiveGirl.position.x, y: interactiveGirl.position.y - 60 },
        },
        ease: Ease.CubicOut,
        duration: 0.4,
        yoyo: true,
        repeat: 2,
      })
        .onAllComplete(() => {
          interactiveGirl.textures = runTextures; // 动画完成后恢复
        })
        .play();
    });
  }

  new Text({
    text: "拖动系统",
    textColor: "#e67e22",
    fontSize: 20,
    fontWeight: "bold",
    position: { x: 900, y: 180 },
    parent: mainScene,
  });

  // 拖拽系统实现 - 三种不同对象类型
  const draggableSprite = new Sprite({
    url: "assets/strawberry.png",
    width: 50,
    height: 50,
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 950, y: 250 },
    parent: mainScene,
  });

  const draggableShape = new Shape({
    label: "draggableShape",
    drawRect: {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      fill: "#3498db",
      stroke: "#2980b9",
      strokeWidth: 3,
    },
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 1050, y: 250 },
    parent: mainScene,
  });

  // 带物理的拖拽对象
  const draggablePhysicsSprite = new Sprite({
    url: "assets/apple.png",
    width: 40,
    height: 46,
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 1000, y: 300 },
    parent: mainScene,
    scripts: [
      new RigidBody({
        rigidType: "dynamic",
        friction: 0.8,
        restitution: 0.3,
        allowRotation: false, // 禁用旋转使拖动更平滑
      }),
    ],
  });

  // 通用拖拽功能实现
  function makeDraggable(target: LikoNode, isPhysics = false) {
    let isDragging = false;
    const dragOffset = { x: 0, y: 0 };
    let rigidBody: RigidBody | null = null;

    if (isPhysics) {
      rigidBody = target.findScript({ Class: RigidBody }) as RigidBody;
    }

    // 开始拖动
    target.on(EventType.pointerDown, (event: LikoPointerEvent) => {
      isDragging = true;
      dragOffset.x = event.pointer.x - target.position.x;
      dragOffset.y = event.pointer.y - target.position.y;

      // 视觉反馈
      target.scale.set(1.1);
      if (target.tintColor !== undefined) {
        target.tintColor = 0xffff99;
      }

      // 如果是物理对象，暂时设为kinematic类型以便拖动
      if (rigidBody) {
        rigidBody.rigidType = "kinematic";
      }
    });

    app.stage.on(EventType.pointerMove, (event: LikoPointerEvent) => {
      if (isDragging) {
        const newX = event.pointer.x - dragOffset.x;
        const newY = event.pointer.y - dragOffset.y;

        // 限制在场景范围内
        const clampedX = Math.max(25, Math.min(1175, newX));
        const clampedY = Math.max(25, Math.min(925, newY));

        if (rigidBody) {
          // 物理对象使用刚体移动
          rigidBody.setPosition(clampedX, clampedY);
        } else {
          // 普通对象直接设置位置
          target.position.set(clampedX, clampedY);
        }
      }
    });

    // 结束拖动
    app.stage.on(EventType.pointerUp, () => {
      if (isDragging) {
        isDragging = false;
        target.scale.set(1.0);
        if (target.tintColor !== undefined) {
          target.tintColor = 0xffffff;
        }

        if (rigidBody) {
          rigidBody.rigidType = "dynamic"; // 恢复物理模拟
        }
      }
    });
  }

  makeDraggable(draggableSprite);
  makeDraggable(draggableShape);
  makeDraggable(draggablePhysicsSprite, true);

  // 5. 物理系统 - RigidBody组件
  const physicsBox = new Sprite({
    url: "assets/box.png",
    width: 50,
    height: 50,
    anchor: { x: 0.5, y: 0.5 },
    parent: mainScene,
    position: { x: 850, y: 120 },
    scripts: [
      new RigidBody({
        rigidType: "dynamic",
        friction: 0.7,
        restitution: 0.4,
        allowRotation: true,
      }),
    ],
  });

  // 物理力的施加
  physicsBox.on(EventType.click, () => {
    const rigidBody = physicsBox.findScript<RigidBody>({ Class: RigidBody });
    if (rigidBody) {
      rigidBody.applyForceToCenter({ x: 0, y: -800 }); // 施加向上的力
      sound.play("assets/sound/bullet.mp3", 0.7);
    }
  });

  // 圆形物理刚体 - 自定义形状
  const physicsBall = new Sprite();
  physicsBall.url = "assets/ball.png";
  physicsBall.width = 35;
  physicsBall.height = 35;
  physicsBall.anchor = { x: 0.5, y: 0.5 };
  physicsBall.position.set(950, 120);
  physicsBall.scripts = [
    new RigidBody({
      rigidType: "dynamic",
      friction: 0.3,
      restitution: 0.8,
      shapes: [
        {
          shapeType: "circle",
          radius: 17.5,
        },
      ],
    }),
  ];
  mainScene.addChild(physicsBall);

  // 设置线性速度
  physicsBall.on(EventType.click, () => {
    const rigidBody = physicsBall.findScript<RigidBody>({ Class: RigidBody });
    if (rigidBody) {
      rigidBody.linearVelocity = { x: 0, y: -15 }; // 直接设置速度
      sound.play("assets/sound/bullet.mp3", 0.7);
    }
  });

  new Text({
    text: "Canvas绘图系统",
    textColor: "#9b59b6",
    fontSize: 20,
    fontWeight: "bold",
    position: { x: 50, y: 460 },
    parent: mainScene,
  });

  // 6. Canvas绘图 - 基本图形API
  const customCanvas = new Canvas();
  // 圆形
  customCanvas.beginPath();
  customCanvas.circle(40, 40, 25);
  customCanvas.fill({ color: "#e74c3c" });
  // 矩形
  customCanvas.beginPath();
  customCanvas.rect(90, 20, 50, 35);
  customCanvas.fill({ color: "#3498db" });
  // 三角形路径
  customCanvas.beginPath();
  customCanvas.moveTo(170, 20);
  customCanvas.lineTo(210, 20);
  customCanvas.lineTo(190, 60);
  customCanvas.closePath();
  customCanvas.fill({ color: "#2ecc71" });

  customCanvas.position.set(50, 490);
  mainScene.addChild(customCanvas);

  // Canvas描边与虚线
  const strokeCanvas = new Canvas();
  // 描边圆角矩形
  strokeCanvas.beginPath();
  strokeCanvas.roundRect(10, 10, 70, 50, 8);
  strokeCanvas.stroke({ color: "#9b59b6", width: 3 });
  // 描边椭圆
  strokeCanvas.beginPath();
  strokeCanvas.ellipse(130, 35, 35, 20, 0, 2 * Math.PI);
  strokeCanvas.stroke({ color: "#f39c12", width: 3 });

  // 虚线效果
  strokeCanvas.beginPath();
  strokeCanvas.circle(210, 35, 25);
  strokeCanvas.stroke({ color: "#e74c3c", width: 2, dash: [5, 3] });

  strokeCanvas.position.set(310, 490);
  mainScene.addChild(strokeCanvas);

  // 复杂路径绘制 - 五角星与贝塞尔曲线
  const pathCanvas = new Canvas();
  pathCanvas.beginPath();
  const outerRadius = 22;
  const innerRadius = outerRadius * 0.382;
  const centerX = 35;
  const centerY = 35;

  // 五角星路径
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (i === 0) {
      pathCanvas.moveTo(x, y);
    } else {
      pathCanvas.lineTo(x, y);
    }
  }
  pathCanvas.closePath();
  pathCanvas.fill({ color: "#f1c40f" });
  pathCanvas.stroke({ color: "#e67e22", width: 2 });

  // 贝塞尔曲线示例
  pathCanvas.beginPath();
  pathCanvas.moveTo(100, 15);
  pathCanvas.quadraticCurveTo(140, 0, 180, 15);
  pathCanvas.quadraticCurveTo(220, 35, 180, 55);
  pathCanvas.quadraticCurveTo(140, 70, 100, 55);
  pathCanvas.quadraticCurveTo(60, 35, 100, 15);
  pathCanvas.fill({ color: "#3498db" });

  pathCanvas.position.set(570, 490);
  mainScene.addChild(pathCanvas);

  // 渐变效果 - 线性渐变与径向渐变
  const gradientCanvas = new Canvas();
  // 线性渐变
  gradientCanvas.beginPath();
  gradientCanvas.rect(10, 10, 80, 35);
  gradientCanvas.fill({
    color: utils.createLinearGradient({ startX: 10, startY: 10, endX: 90, endY: 10 }, [
      { offset: 0, color: "#ff6b6b" },
      { offset: 0.5, color: "#4ecdc4" },
      { offset: 1, color: "#ffffff" },
    ]),
  });

  // 径向渐变
  gradientCanvas.beginPath();
  gradientCanvas.circle(130, 30, 25);
  gradientCanvas.fill({
    color: utils.createRadialGradient({ startX: 130, startY: 27, startRadius: 0, endX: 130, endY: 27, endRadius: 22 }, [
      { offset: 0, color: "#ffffff" },
      { offset: 0.7, color: "#ff6b6b" },
      { offset: 1, color: "#c44569" },
    ]),
  });

  gradientCanvas.position.set(810, 490);
  mainScene.addChild(gradientCanvas);

  // 裁剪蒙版 - 圆形头像效果
  const texture = await Texture.createFromUrl("assets/bg2.webp");
  if (!texture) return;
  const clippedImage = new Canvas();
  clippedImage.clear();
  clippedImage.beginPath();
  clippedImage.circle(25, 25, 25).clip(); // 设置裁剪区域
  clippedImage.drawImage(texture, 0, 0, 150, 100);
  clippedImage.closePath();
  clippedImage.position.set(990, 490);
  app.stage.addChild(clippedImage);

  // 交互式Canvas - 动态重绘
  const interactiveCanvas = new Canvas();
  const drawInteractiveShape = (fillColor: string) => {
    interactiveCanvas.clear();
    interactiveCanvas.beginPath();
    // 花朵形状绘制
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 40 + 25 * Math.cos(angle);
      const y = 40 + 25 * Math.sin(angle);
      interactiveCanvas.circle(x, y, 12);
    }
    interactiveCanvas.circle(40, 40, 18);
    interactiveCanvas.fill({ color: fillColor });
  };

  drawInteractiveShape("#e74c3c");

  interactiveCanvas.on(EventType.pointerOver, () => {
    drawInteractiveShape("#2ecc71");
  });

  interactiveCanvas.on(EventType.pointerOut, () => {
    drawInteractiveShape("#e74c3c");
  });

  interactiveCanvas.position.set(1080, 490);
  mainScene.addChild(interactiveCanvas);

  new Text({
    text: "Shape几何图形系统",
    textColor: "#1abc9c",
    fontSize: 20,
    fontWeight: "bold",
    position: { x: 50, y: 580 },
    parent: mainScene,
  });

  // 7. Shape几何图形 - 基础图形API
  new Shape({
    label: "basicRect",
    drawRect: {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      fill: "#3498db",
      stroke: "#2980b9",
      strokeWidth: 2,
    },
    position: { x: 50, y: 620 },
    parent: mainScene,
  });

  // 圆形
  new Shape({
    label: "basicCircle",
    drawCircle: {
      x: 25,
      y: 25,
      radius: 25,
      fill: "#e74c3c",
      stroke: "#c0392b",
      strokeWidth: 3,
    },
    position: { x: 140, y: 620 },
    parent: mainScene,
  });

  // 圆角矩形
  new Shape({
    label: "roundedRect",
    drawRoundedRect: {
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      cornerRadius: 12,
      fill: "#2ecc71",
      stroke: "#27ae60",
      strokeWidth: 2,
    },
    position: { x: 230, y: 620 },
    parent: mainScene,
  });

  // 椭圆形
  new Shape({
    label: "ellipse",
    drawEllipse: {
      x: 35,
      y: 25,
      radiusX: 35,
      radiusY: 20,
      fill: "#f39c12",
      stroke: "#e67e22",
      strokeWidth: 2,
    },
    position: { x: 330, y: 620 },
    parent: mainScene,
  });

  // 多边形 - 点数组定义形状
  new Shape({
    label: "triangle",
    drawPolygon: {
      points: [
        { x: 30, y: 0 },
        { x: 60, y: 50 },
        { x: 0, y: 50 },
      ],
      fill: "#9b59b6",
      stroke: "#8e44ad",
      strokeWidth: 2,
    },
    position: { x: 430, y: 610 },
    parent: mainScene,
  });

  // 线条绘制
  new Shape({
    label: "polyline",
    drawLine: {
      points: [
        { x: 0, y: 40 },
        { x: 20, y: 0 },
        { x: 40, y: 25 },
        { x: 60, y: 10 },
        { x: 80, y: 35 },
      ],
      color: "#34495e",
      lineWidth: 4,
    },
    position: { x: 530, y: 610 },
    parent: mainScene,
  });

  // 动态Shape - 运行时重绘
  new Shape({
    label: "interactiveShape",
    position: { x: 650, y: 610 },
    parent: mainScene,
  });

  const interactiveShape = mainScene.findChild<Shape>({ label: "interactiveShape" });
  if (interactiveShape) {
    interactiveShape.drawCircle({
      x: 25,
      y: 25,
      radius: 25,
      fill: "#1abc9c",
      stroke: "#16a085",
      strokeWidth: 2,
    });

    interactiveShape.on(EventType.pointerOver, () => {
      interactiveShape.drawCircle({
        x: 25,
        y: 25,
        radius: 30,
        fill: "#e67e22",
        stroke: "#d35400",
        strokeWidth: 3,
      });
    });

    interactiveShape.on(EventType.pointerOut, () => {
      interactiveShape.drawCircle({
        x: 25,
        y: 25,
        radius: 25,
        fill: "#1abc9c",
        stroke: "#16a085",
        strokeWidth: 2,
      });
    });
  }

  new Text({
    text: "粒子系统(ParticleSystem)",
    textColor: "#e67e22",
    fontSize: 20,
    fontWeight: "bold",
    position: { x: 50, y: 700 },
    parent: mainScene,
  });

  // 8. 粒子系统 - plist配置文件加载
  const fireParticle = new ParticleSystem({
    url: "assets/particle/fire.plist",
    parent: mainScene,
    position: { x: 120, y: 750 },
    autoPlay: true,
  });

  // 粒子控制按钮
  const fireControlButton = new Text({
    text: "⏸️ 暂停",
    fontSize: 14,
    textColor: "#e74c3c",
    position: { x: 180, y: 750 },
    parent: mainScene,
  });

  fireControlButton.on(EventType.click, () => {
    if (fireParticle.isPlaying && !fireParticle.isPaused) {
      fireParticle.pause();
      fireControlButton.text = "▶️ 播放";
    } else if (fireParticle.isPaused) {
      fireParticle.resume();
      fireControlButton.text = "⏸️ 暂停";
    } else {
      fireParticle.play();
      fireControlButton.text = "⏸️ 暂停";
    }
    sound.play("assets/sound/bullet.mp3", 0.3);
  });

  // 动态配置粒子系统 - config对象配置
  const interactiveParticle = new ParticleSystem({
    parent: mainScene,
    position: { x: 350, y: 750 },
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
      emissionRate: 50,

      // 粒子生命周期设置
      particleLifespan: 2.0, // 每个粒子存活3秒
      particleLifespanVariance: 0.5, // 生命周期随机变化±0.5秒

      // 初始速度：粒子发射时的速度
      speed: 100, // 初始速度100像素/秒
    },
  });

  // 动态修改粒子属性 - setter方法使用
  let particleColorIndex = 0;
  const particleColors = [
    { start: { r: 0.2, g: 0.8, b: 1.0, a: 1.0 }, end: { r: 1.0, g: 0.2, b: 0.8, a: 0.0 } },
    { start: { r: 1.0, g: 0.3, b: 0.1, a: 1.0 }, end: { r: 1.0, g: 0.8, b: 0.0, a: 0.0 } },
    { start: { r: 0.1, g: 1.0, b: 0.3, a: 1.0 }, end: { r: 0.8, g: 1.0, b: 0.1, a: 0.0 } },
    { start: { r: 0.8, g: 0.2, b: 1.0, a: 1.0 }, end: { r: 1.0, g: 0.6, b: 0.8, a: 0.0 } },
  ];

  app.stage.timer.setInterval(3, () => {
    const colorSet = particleColors[particleColorIndex % particleColors.length];
    interactiveParticle.setStartColor(colorSet.start);
    interactiveParticle.setEndColor(colorSet.end);
    particleColorIndex++;
  });

  // 鼠标悬停改变发射方向
  interactiveParticle.on(EventType.pointerOver, () => {
    interactiveParticle.setAngle(90, 30); // 向上发射
    interactiveParticle.setEmissionRate(80); // 增加发射速率
  });

  interactiveParticle.on(EventType.pointerOut, () => {
    interactiveParticle.setAngle(270, 45);
    interactiveParticle.setEmissionRate(50);
  });

  // 临时粒子效果 - 爆炸效果
  interactiveParticle.on(EventType.click, () => {
    // 临时创建爆炸粒子
    const burstParticle = new ParticleSystem({
      parent: mainScene,
      position: { x: interactiveParticle.position.x, y: interactiveParticle.position.y },
    });

    burstParticle.setStartColor({ r: 1.0, g: 0.8, b: 0.0, a: 1.0 });
    burstParticle.setEndColor({ r: 1.0, g: 0.2, b: 0.0, a: 0.0 });
    burstParticle.setParticleSize(15, 5);
    burstParticle.setEmissionRate(200);
    burstParticle.setParticleLifespan(1.0);
    burstParticle.setAngle(0, 360); // 全方向发射
    burstParticle.play();

    sound.play("assets/sound/bullet.mp3", 0.8);

    // 1.5秒后清理爆炸粒子
    setTimeout(() => {
      burstParticle.stop();
      mainScene.removeChild(burstParticle);
    }, 1500);
  });

  // 粒子状态监控
  const particleStatusText = new Text({
    text: "粒子状态: 火焰: 0, 交互: 0, 鼠标: 0",
    textColor: "#95a5a6",
    fontSize: 12,
    position: { x: 400, y: 750 },
    parent: mainScene,
  });

  app.stage.timer.setInterval(2, () => {
    particleStatusText.text = `粒子状态: 火焰: ${fireParticle.particleCount}, 交互: ${interactiveParticle.particleCount}, 鼠标: ${mouseTrailParticle.particleCount}`;
  });

  // 跟随鼠标的粒子系统
  const mouseTrailParticle = new ParticleSystem({
    parent: mainScene,
    position: { x: 600, y: 400 },
    autoPlay: true,
  });

  // 链式设置粒子属性
  mouseTrailParticle.setStartColor({ r: 0.8, g: 0.2, b: 0.8, a: 1.0 });
  mouseTrailParticle.setEndColor({ r: 0.2, g: 0.8, b: 0.8, a: 0.0 });
  mouseTrailParticle.setParticleSize(6, 2);
  mouseTrailParticle.setEmissionRate(30);
  mouseTrailParticle.setParticleLifespan(1.5, 0.3);
  mouseTrailParticle.setGravity(0, 20);
  mouseTrailParticle.setAngle(90, 60);
  mouseTrailParticle.play();

  // 鼠标跟随事件
  app.stage.on(EventType.pointerMove, (event: LikoPointerEvent) => {
    if (event.pointer) {
      mouseTrailParticle.position.set(event.pointer.x, event.pointer.y);
    }
  });

  // 静态物理边界
  const ground = new Canvas();
  ground.rect(0, 0, 1200, 30);
  ground.fill({ color: "#34495e" });
  ground.position.set(0, 920);
  mainScene.addChild(ground);
  ground.addScript(
    new RigidBody({
      rigidType: "static",
      category: "ground",
    }),
  );

  new Text({
    text: "控制面板",
    textColor: "#ecf0f1",
    fontSize: 18,
    fontWeight: "bold",
    position: { x: 50, y: 800 },
    parent: mainScene,
  });

  // 9. 音频系统 - music与sound
  const musicButton = new Text({
    text: "🎵 播放背景音乐",
    fontSize: 16,
    textColor: "#f39c12",
    parent: mainScene,
    position: { x: 50, y: 830 },
  });

  musicButton.on(EventType.click, () => {
    music.play("assets/sound/bg.mp3").fadeIn(2); // 淡入效果
    musicButton.text = "🎵 音乐播放中...";
  });

  const stopMusicButton = new Text({
    text: "⏹️ 停止音乐",
    fontSize: 16,
    textColor: "#e74c3c",
    parent: mainScene,
    position: { x: 220, y: 830 },
  });

  stopMusicButton.on(EventType.click, () => {
    music.stopAll(); // 停止所有音乐
    musicButton.text = "🎵 播放背景音乐";
  });

  // 10. 全局事件处理 - 键盘事件
  app.stage.on(EventType.keydown, (event: KeyboardEvent) => {
    switch (event.key) {
      case " ": // 空格键控制Timer系统
        event.preventDefault();
        if (Timer.system.paused) {
          Timer.system.resume();
        } else {
          Timer.system.pause();
        }
        break;
    }
  });
}

// 启动示例
likoEngineOverview();

```


## Demo
demo:
https://letmaker.github.io/liko-page/

source code:
https://github.com/letmaker/liko-demo

## Documentation
api:
https://letmaker.github.io/liko-page/docs/
