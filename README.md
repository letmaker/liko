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

```typescript
import { App, Text } from 'liko';

async function test() {
  // Create application instance
  const app = new App();
  // Initialize the application, set canvas size to 800x800
  await app.init({ width: 800, height: 800 });

  // Create text object
  new Text({
    text: "Hello World", // Text content
    fillColor: "#ff0000", // Text color (red)
    fontSize: 30, // Font size
    pos: { x: 100, y: 100 }, // Text position
    parent: app.stage, // Parent node is stage
  });
}

test();
```


## Demo
demo:
https://letmaker.github.io/liko-page/

source code:
https://github.com/letmaker/liko-demo

## Documentation
api:
https://letmaker.github.io/liko-page/docs/


## License
MIT

## Thanks
- [npm](https://www.npmjs.com/package/liko)
- [pixi.js](https://github.com/pixijs/pixijs)
- [planck-js](https://github.com/piqnt/planck.js)