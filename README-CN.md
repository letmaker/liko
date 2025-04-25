# liko
Liko 是使用 typescript 开发的一个轻量级、高性能的 H5 渲染框架。

Liko 是一个基于 WebGPU 的高性能渲染引擎，专为 AI 设计。

Liko 可用于游戏开发、H5应用程序和互动交互场景等。

## 特点
- 基于 webGPU 设计
- 专为人工智能和编辑器而设计
- 轻量
- 高性能
- 涵盖游戏需要的所有功能

## 功能
- 2D 渲染
- Sprite 渲染
- AnimatedSprite 渲染
- Text 渲染
- Canvas 渲染
- 内置物理引擎
- 内置音频系统
- 内置粒子系统（建设中）
- 内置脚本系统
- 内置动画系统
- 内置缓动系统
- 内置事件系统
- 内置资源管理
- 内置场景管理
- 内置定时管理

## 如何使用

安装
```bash
npm install liko
```

使用
```typescript
import { App, Text } from 'liko';

async function test() {
  // 创建应用实例
  const app = new App();
  // 初始化应用，设置画布大小为800x800
  await app.init({ width: 800, height: 800 });

  // 创建文本对象
  new Text({
    text: "Hello World", // 文本内容
    fillColor: "#ff0000", // 文本颜色（红色）
    fontSize: 30, // 字体大小
    pos: { x: 100, y: 100 }, // 文本位置
    parent: app.stage, // 父节点为舞台
  });
}

test();
```


## 更多 demo
https://github.com/letmaker/liko-demo

## License
MIT

## 感谢
- [planck-js](https://github.com/piqnt/planck.js)
- [pixi.js](https://github.com/pixijs/pixijs)
- [npm](https://www.npmjs.com/package/liko)