# liko
Liko is a simple, fast, and lightweight H5 framework by Typescript.

Liko is a high-performance rendering engine based on WebGPU, designed for AI.

Liko can be used for games, H5 applications, and interactive interactions.

## Features
- designed based on webGPU
- designed for AI and editors
- simple and fast
- high-performance
- integrated Planck physics engine

## How to use

```bash
npm install liko
```

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


## Demo
https://github.com/letmaker/liko-demo

## License
MIT

## Thanks
- [planck-js](https://github.com/piqnt/planck.js)
- [pixi.js](https://github.com/pixijs/pixijs)