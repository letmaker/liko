import { EventType } from "../../const";
import type { IAnimation } from "../../nodes/animation";
import { RegScript } from "../../utils/decorators";
import { Script } from "../script";

@RegScript("Controller")
export class Controller extends Script {
  available = true;
  duration = 1;
  repeatDelay = 0;

  private _aniName = "";
  get aniName() {
    return this._aniName;
  }
  set aniName(value) {
    this._aniName = value;
    const target = this.target as any;
    if (target.aniName !== undefined) {
      target.aniName = value;
    }
  }

  private _repeatTimes = 0;
  private _repeat = 1;
  get repeat(): number {
    return this._repeat;
  }
  set repeat(value) {
    this._repeat = value < 1 ? Number.POSITIVE_INFINITY : value;
  }

  private _playing = false;
  get playing(): boolean {
    return this._playing;
  }

  get target(): IAnimation {
    return super.target as IAnimation;
  }
  set target(value: IAnimation) {
    super.target = value;
  }

  private _startTime = 0;
  override get delay(): number {
    return super.delay;
  }
  override set delay(value: number) {
    super.delay = value;
    this._startTime = value;
  }

  override get enabled(): boolean {
    return super.enabled;
  }
  override set enabled(value: boolean) {
    super.enabled = value;
    if (!value && !this.destroyed && this._playing) {
      this.target.stop();
      this._playing = false;
    }
  }

  override update(time: number): void {
    if (this.enabled && !this.ended && time >= this._startTime) {
      this.awaked || this.awake();
      if (!this.started || !this._playing) {
        const { target } = this;
        if (target.controller !== this) {
          if (target.controller) target.controller.available = false;
          this.available = true;
          target.controller = this;
        }
        target.on(EventType.ended, this.end, this);
        target.play();
        this._playing = true;
        this.start();
      }
    }
  }

  override end(): void {
    if (!this.available) return;
    this._repeatTimes++;
    if (this._repeatTimes < this._repeat) {
      if (this.repeatDelay) this.target.stop();
      this._startTime = this.delay + (this.repeatDelay + this.duration) * this._repeatTimes;
      this.started = false;
      this.ended = false;
      this.onEnd();
    } else {
      this.complete();
    }
  }

  complete(): void {
    if (!this.ended) {
      this._repeatTimes = this._repeat;
      this.ended = true;
      this.target.goto(this.duration);
      this.target.stop();
      this.target.off(EventType.ended, this.end, this);
      this._playing = false;
      this.onEnd();
      this.onComplete();
    }
  }

  onComplete(): void {
    //
  }

  override goto(time: number): void {
    if (!this.enabled || this.destroyed) return;

    this._playing = false;
    this.target.stop();

    if (this._repeat > 1) {
      const interval = this.duration + this.repeatDelay;
      this._repeatTimes = time > this.delay + this.duration ? Math.floor((time - this.delay) / interval) : 0;
      if (this._repeatTimes > this._repeat) this._repeatTimes = this._repeat;
      this._startTime = this.delay + interval * this._repeatTimes;
    }

    this.started = false;
    this.ended = false;
    if (time >= this._startTime) {
      this.target.goto(time - this._startTime);
    }
  }

  override reset(time: number): void {
    if (time < this.delay) {
      this.started = false;
      this.ended = false;
      this.target.controller = this;
      if (this.awaked) this.target.goto(0);
    }
  }
}
