import { RegScript } from "../../utils/decorators";
import { Effect } from "./effect";

/**
 * 路径动画
 */
@RegScript("PathEffect")
export class PathEffect extends Effect {
  private readonly _paths: Array<{ x: number; y: number; distance: number; time: number }> = [];
  private readonly _start = { x: 0, y: 0 };

  /** 路径列表，比如 `[{x:100,y:100},{x:200,y:600}]` */
  paths: Array<{ x: number; y: number }> = [];

  onAwake(): void {
    super.onAwake();
    this._start.x = this.target.pos.x;
    this._start.y = this.target.pos.y;
    let { x, y } = this._start;

    let totalDistance = 0;
    for (const path of this.paths) {
      const distance = Math.sqrt((x - path.x) * (x - path.x) + (y - path.y) * (y - path.y));
      x = path.x;
      y = path.y;
      totalDistance += distance;
      this._paths.push({ x: path.x, y: path.y, distance, time: 0 });
    }

    for (const path of this._paths) {
      path.time = path.distance / totalDistance;
    }
  }

  onValueChanged(value: number): void {
    const targetPos = this.target.pos;
    const len = this._paths.length - 1;
    let count = 0;
    let posX = this._start.x;
    let posY = this._start.y;
    for (let i = 0; i <= len; i++) {
      const path = this._paths[i];
      if (value <= count + path.time || i === len) {
        targetPos.x = posX + ((path.x - posX) * (value - count)) / path.time;
        targetPos.y = posY + ((path.y - posY) * (value - count)) / path.time;
        break;
      }
      posX = path.x;
      posY = path.y;
      count += path.time;
    }
  }
}
