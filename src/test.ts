import { App, Canvas, Rectangle, RigidBody, Scene, Sprite, Text } from '.';

async function test() {
  // 创建一个游戏应用实例
  const app = new App();

  // 初始化游戏的基本设置
  await app.init({
    width: 800, // 设置游戏窗口的宽度为800像素
    height: 800, // 设置游戏窗口的高度为800像素
    bgColor: 0x333333, // 设置背景颜色为深灰色（使用16进制颜色代码）
    physics: {
      enabled: true, // 启用物理引擎，使游戏中的物体能够进行物理模拟
      debug: true, // 开启物理引擎的调试模式，会显示物体的碰撞边界
      boundaryArea: new Rectangle(0, 0, 800, 800).pad(100), // 创建一个比游戏窗口每边都大100像素的物理边界，超出此范围的物体会被销毁
    },
  });

  // 创建游戏场景，用于组织和管理游戏中的所有物体
  const scene = new Scene({ width: 800, height: 800, parent: app.stage });
  scene.on('click', () => {
    // 当玩家点击场景时触发此函数
    // 在点击位置的上方随机位置创建一个会下落的小球
    new Sprite({
      url: 'assets/ball.png', // 小球的图片资源路径
      width: 40, // 小球的显示宽度（像素）
      height: 40, // 小球的显示高度（像素）
      position: { x: Math.random() * 700 + 50, y: 0 }, // 设置小球的初始位置：x坐标随机（50-750），y坐标为0（顶部）
      parent: scene, // 将小球添加到游戏场景中
      scripts: [
        new RigidBody({
          // 为小球添加物理属性
          rigidType: 'dynamic', // 设置为动态物体，会受重力和其他力的影响
          friction: 0.5, // 设置摩擦系数，影响物体在碰撞时的摩擦力（0表示无摩擦，1表示最大摩擦）
          restitution: 0.2, // 设置弹性系数，影响物体碰撞后的反弹程度（0表示不反弹，1表示完全弹性碰撞）
          allowRotation: true, // 允许物体旋转
          shapes: [
            // 定义物体的物理碰撞形状
            {
              shapeType: 'circle', // 使用圆形作为碰撞形状
              radius: 20, // 碰撞圆的半径（像素）
              offset: { x: 0, y: 0 }, // 碰撞形状相对于物体中心的偏移量
            },
          ],
        }),
      ],
    });
  });

  // 创建一个说明文本
  new Text({
    text: '点击场景添加小球', // 文本内容
    position: { x: 400, y: 60 }, // 文本在场景中的位置
    anchor: { x: 0.5, y: 0.5 }, // 文本的锚点，用于旋转和缩放的中心点
    fontSize: 24, // 文本的字号
    textColor: '#ffffff', // 文本的填充颜色
    parent: scene, // 将文本添加到游戏场景中
  });

  // 创建一个动态方块1
  new Sprite({
    url: 'assets/box.png', // 方块图片路径
    width: 64, // 方块宽度
    height: 64, // 方块高度
    position: { x: 140, y: 200 }, // 初始位置
    scale: { x: 0.5, y: 0.5 }, // 将方块缩放到原始大小的一半
    anchor: { x: 0.5, y: 0.5 }, // 设置锚点在方块中心，影响旋转和缩放的中心点
    parent: scene, // 添加到场景中
    scripts: [
      new RigidBody({
        rigidType: 'dynamic', // 动态物体
        friction: 0.8, // 摩擦系数
        restitution: 0.2, // 弹性系数
        categoryAccepted: ['block', 'ground', 'box2'], // 设置可以与哪些类别的物体发生碰撞
        allowRotation: true, // 允许旋转
      }),
    ],
  });

  // 创建一个动态方块2
  new Sprite({
    url: 'assets/box.png',
    width: 64,
    height: 64,
    position: { x: 400, y: 200 },
    scale: { x: 0.5, y: 0.5 },
    anchor: { x: 0.5, y: 0.5 },
    angle: 45,
    parent: scene,
    scripts: [
      new RigidBody({
        rigidType: 'dynamic', // 动态物体，会受重力影响
        friction: 0.5, // 摩擦系数
        restitution: 0.2, // 弹性系数
        category: 'box2',
      }),
    ],
  });

  // 创建一个动态方块3
  new Sprite({
    url: 'assets/box.png',
    width: 64,
    height: 64,
    position: { x: 500, y: 200 },
    scale: { x: 0.5, y: 0.5 },
    anchor: { x: 0.5, y: 0.5 },
    parent: scene,
    scripts: [
      new RigidBody({
        rigidType: 'dynamic', // 动态物体，会受重力影响
        friction: 0.5, // 摩擦系数
        restitution: 0.2, // 弹性系数
      }),
    ],
  });

  // 创建一个小球
  new Sprite({
    url: 'assets/ball.png', // 图片的路径
    width: 40, // 图片的宽度
    height: 40, // 图片的高度
    position: { x: 80, y: 0 }, // 图片在游戏画面中的位置
    anchor: { x: 0.5, y: 0.5 }, // 图片的锚点，用于旋转和缩放
    parent: scene, // 图片的父对象，这里是游戏的舞台
    scripts: [
      new RigidBody({
        rigidType: 'dynamic', // 静态物体，不会移动
        categoryAccepted: ['ground', 'box2'],
        friction: 0.5, // 摩擦系数
        restitution: 0.2, // 弹性系数
        allowRotation: true, // 允许旋转
        angularVelocity: -Math.PI, // 角速度，每秒旋转的弧度
        shapes: [
          {
            shapeType: 'circle', // 圆形碰撞体
            radius: 20, // 碰撞半径
            offset: { x: 0, y: 0 }, // 碰撞体中心偏移量
          },
        ],
      }),
    ],
  });

  // 创建一个三角形
  const triangle = new Canvas();
  triangle.beginPath(); // 开始绘制路径
  triangle.moveTo(25, 0); // 移动到起点
  triangle.lineTo(50, 50); // 画线到第二个点
  triangle.lineTo(0, 50); // 画线到第三个点
  triangle.closePath(); // 闭合路径
  triangle.fill({ color: '#ff00ff' }); // 填充粉色
  triangle.position.set(600, 300); // 设置位置
  triangle.angle = 5; // 设置旋转角度
  scene.addChild(triangle); // 添加到场景

  triangle.addScript(
    new RigidBody({
      rigidType: 'dynamic',
      friction: 0.5,
      restitution: 0.2,
      category: 'triangle',
      shapes: [
        {
          shapeType: 'polygon', // 多边形碰撞体
          // 多边形的顶点坐标
          vertices: [
            { x: 25, y: 0 },
            { x: 50, y: 50 },
            { x: 0, y: 50 },
          ],
        },
      ],
    })
  );

  // 创建一个静态方块障碍物
  new Sprite({
    url: 'assets/brick.png',
    width: 128,
    height: 128,
    position: { x: 100, y: 450 },
    scale: { x: 0.5, y: 0.5 },
    anchor: { x: 0.5, y: 0.5 },
    parent: scene,
    scripts: [
      new RigidBody({
        rigidType: 'static', // 静态物体，不会移动
        category: 'block', // 物理碰撞分类名称
      }),
    ],
  });

  // 创建地面
  const ground = new Canvas();
  ground.rect(0, 0, 700, 40); // 创建一个700x40像素的矩形作为地面
  ground.fill({ color: '#ff8800' }); // 使用橙色填充地面
  ground.position.set(0, 500); // 设置地面的位置
  ground.angle = 5; // 使地面略微倾斜5度
  scene.addChild(ground);

  // 为地面添加静态物理属性
  const rigidBodyGround = new RigidBody({
    rigidType: 'static', // 静态物体，不会移动或受力影响
    category: 'ground', // 设置物体的碰撞类别为"ground"
    friction: 0.5, // 地面的摩擦系数
    restitution: 0.2, // 地面的弹性系数
  });
  ground.addScript(rigidBodyGround);

  // 创建链条形状
  const chain = new Canvas();
  chain.moveTo(0, 0).lineTo(100, 10).lineTo(200, 50).lineTo(400, 0); // 绘制折线
  chain.stroke({ color: '#ff8800', width: 2 }); // 设置线条颜色和宽度
  chain.position.set(0, 100); // 设置位置
  chain.angle = 5; // 设置角度
  scene.addChild(chain);

  const rigidBodyChain = new RigidBody({
    rigidType: 'static',
    category: 'chain',
    friction: 0.5,
    restitution: 0.2,
    shapes: [
      {
        shapeType: 'chain',
        vertices: [
          { x: 0, y: 0 },
          { x: 100, y: 10 },
          { x: 200, y: 50 },
          { x: 400, y: 0 },
        ],
      },
    ],
  });
  chain.addScript(rigidBodyChain);
}

test(); // 运行测试函数
