import { Effect } from "./effect/effect";
import { ScriptBase } from "./script-base";

interface IEffect {
  targetID: string;
  delay: number;
  duration: number;
  easing?: string;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  initial?: Record<string, any>;
  from?: Record<string, any>;
  to?: Record<string, any>;
}

export class Animator extends ScriptBase {
  private _paused = false;

  duration = 0;
  timeScale = 1;
  currentTime = 0;

  private _repeat = 1;
  /** 动画重复次数，默认为1次，设置为0，等同于无数次 */
  get repeat(): number {
    return this._repeat;
  }
  set repeat(value: number) {
    if (value !== this._repeat) {
      this._repeat = value < 1 ? Number.POSITIVE_INFINITY : value;
    }
  }

  private _effects: Effect[] = [];
  private _data: IEffect[] = [];
  get data(): IEffect[] {
    return this._data;
  }
  set data(value: IEffect[]) {
    this._data = value;

    this._effects.length = 0;
    for (const item of value) {
      const target = this.target.getChild(item.targetID);
      if (target) {
        const effect = new Effect();
        effect.target = target;
        effect.setProps(item as Record<string, any>);
        this._effects.push(effect);

        effect.onStart = () => {
          target.emit("animator:start", effect);
        };
        effect.onEnd = () => {
          target.emit("animator:end", effect);
        };
      }
    }
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
  }

  goto(time: number): void {
    this.currentTime = time;
    for (const effect of this._effects) {
      effect.goto(time);
    }
  }

  onUpdate(delta: number): void {
    if (this._paused || this.currentTime > this.duration || this.duration === 0) return;

    this.currentTime += delta * this.timeScale;

    for (const effect of this._effects) {
      effect.update(this.currentTime);
    }

    if (this.currentTime >= this.duration) {
      this.target.emit("animator:complete");
      if (this.repeat > 0) {
        this.repeat--;
        this.currentTime = this.currentTime % this.duration;
      }
    }
  }

  override destroy(): void {
    super.destroy();
    this._effects.length = 0;
  }
}
