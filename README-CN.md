# liko
Liko 是使用 typescript 开发的一个轻量级、高性能的 H5 渲染框架。

Liko 是一个基于 WebGPU 的高性能渲染引擎，专为 AI 设计。

Liko 可用于游戏开发、H5应用程序和互动交互场景等。

## 功能
- 基于 webGPU 设计
- 专为人工智能和编辑器而设计
- 轻量
- 高性能
- 集成 Planck 物理引擎

## 如何使用

安装
```bash
npm install liko
```

使用
```typescript
import { App, Text } from 'liko';

async function test() {
  const app = new App();
  await app.init({ width: 800, height: 800 });
  const text = new Text({
    text: 'Hello World',
    fillColor: '#ff0000',
    fontSize: 30,
    pos: { x: 100, y: 100 },
  });
  app.stage.addChild(text);
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