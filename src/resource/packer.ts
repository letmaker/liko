type Box = { width: number; height: number };
type Rect = { x: number; y: number; width: number; height: number };
type Space = { freeRects: Rect[]; usedRects: Rect[]; canvas: HTMLCanvasElement; content: CanvasRenderingContext2D };

const atlasSize = 1024;
const minLeftWidth = 10;
const spaces: Space[] = [];
const padding = 1;

function createSpace() {
  const canvas = document.createElement('canvas');
  canvas.width = atlasSize;
  canvas.height = atlasSize;
  const content = canvas.getContext('2d') as CanvasRenderingContext2D;

  // debug
  document.body.append(canvas);
  canvas.style.backgroundColor = '#efefef';
  canvas.style.margin = '1px';

  const freeRects = [{ x: 0, y: 0, width: atlasSize, height: atlasSize }];
  spaces.push({ freeRects, usedRects: [], canvas, content });
  console.debug('createSpace >>>>>>>>>', spaces.length);
}
createSpace();

export function seekSpace(box: Box): { rect: Rect; canvas: HTMLCanvasElement; content: CanvasRenderingContext2D } {
  const image = { width: box.width + padding * 2, height: box.height + padding * 2 };
  if (image.width > atlasSize || image.height > atlasSize) {
    throw new Error('box is too big');
  }

  const boxArea = image.width * image.height;
  let bestScore = Number.MAX_VALUE;
  let bestRect: Rect | null = null;
  let bestRectIndex = -1;
  let space: Space;

  for (let i = 0; i < spaces.length; i++) {
    space = spaces[i];
    const { freeRects, usedRects } = space;
    console.debug(`freeRects${i}`, freeRects.length);

    // 寻找最佳的空闲矩形
    for (let j = 0; j < freeRects.length; j++) {
      const rect = freeRects[j];
      if (rect.width >= image.width && rect.height >= image.height) {
        const score = rect.width * rect.height - boxArea;
        if (score < bestScore) {
          bestScore = score;
          bestRectIndex = j;
          bestRect = { x: rect.x, y: rect.y, width: image.width, height: image.height };
        }
      }
    }

    if (bestRect === null) {
      bestScore = Number.MAX_VALUE;
      if (i === spaces.length - 1) createSpace();
      continue;
    }

    // 添加到占用空间
    usedRects.push(bestRect);
    // 更新空闲矩形列表
    const selectedRect = freeRects[bestRectIndex];
    // 删除已使用的矩形
    freeRects.splice(bestRectIndex, 1);

    // 剩余的右侧矩形，使用minWidth减少小空间的计算
    if (selectedRect.width - image.width >= minLeftWidth) {
      freeRects.push({
        x: selectedRect.x + image.width,
        y: selectedRect.y,
        width: selectedRect.width - image.width,
        height: image.height,
      });
    }
    // 剩余的下方矩形，使用minWidth减少小空间的计算
    if (selectedRect.height - image.height >= minLeftWidth) {
      freeRects.push({
        x: selectedRect.x,
        y: selectedRect.y + image.height,
        width: selectedRect.width,
        height: selectedRect.height - image.height,
      });
    }

    break;
  }

  return { rect: bestRect!, canvas: space!.canvas, content: space!.content };
}

// test
document.addEventListener('click', () => {
  const box = {
    width: Math.max(15, Math.round(Math.random() * atlasSize * 0.5)),
    height: Math.max(15, Math.round(Math.random() * atlasSize * 0.2)),
  };

  console.time('------seek------');
  const { rect, content } = seekSpace(box);
  console.timeEnd('------seek------');

  content.rect(rect.x + padding, rect.y + padding, rect.width - padding * 2, rect.height - padding * 2);
  content.fillStyle = '#999999';
  content.fill();

  // debugRects();
});

// function debugRects() {
//   for (let index = 0; index < spaces.length; index++) {
//     const { freeRects, usedRects, canvas, content } = spaces[index];
//     content.clearRect(0, 0, canvas.width, canvas.height);

//     for (const rect of freeRects) {
//       content.rect(rect.x, rect.y, rect.width, rect.height);
//     }
//     content.strokeStyle = "green";
//     content.lineWidth = 1;
//     content.stroke();

//     content.beginPath();
//     for (const rect of usedRects) {
//       content.rect(rect.x + padding, rect.y + padding, rect.width - padding * 2, rect.height - padding * 2);
//     }
//     content.strokeStyle = "red";
//     content.lineWidth = 1;
//     content.stroke();
//   }
// }
