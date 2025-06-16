import type { Batch } from '../render/batch/batch';
import type { IndexBuffer } from '../render/buffer/index-buffer';
import type { VertexBuffer } from '../render/buffer/vertex-buffer';
import type { IRenderObject } from '../render/render/render-object';
import type { Texture } from '../resource/texture';
import type { ParticleData } from './particle-data';
import type { ParticleSystem } from './particle-system';

/**
 * 粒子渲染对象
 * 负责将粒子数据转换为可供渲染器使用的数据
 */
export class ParticleRenderObject implements IRenderObject {
  private particleSystem: ParticleSystem;
  private vertices: Float32Array;
  private colors: Float32Array;
  private uvs: Float32Array;
  private indices: Uint16Array;

  // 预分配最大容量
  private maxParticles = 0;

  /** 当前活跃粒子数量 */
  private activeParticleCount = 0;

  // IRenderObject 接口实现
  batch?: Batch;
  textureId = -1;

  vertexStart = 0;
  indexStart = 0;
  colorStart = 0;
  uvStart = 0;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
    // 初始化空数组，延迟到真正需要时分配
    this.vertices = new Float32Array(0);
    this.colors = new Float32Array(0);
    this.uvs = new Float32Array(0);
    this.indices = new Uint16Array(0);
  }

  /**
   * 确保缓冲区有足够的容量
   */
  private ensureBufferCapacity(maxParticles: number): void {
    if (this.maxParticles >= maxParticles) return;

    this.maxParticles = maxParticles;
    const vertexCount = maxParticles * 4;
    const indexCount = maxParticles * 6;

    // 一次性分配最大容量，避免频繁重新分配
    this.vertices = new Float32Array(vertexCount * 2);
    this.colors = new Float32Array(vertexCount * 1);
    this.uvs = new Float32Array(vertexCount * 3);
    this.indices = new Uint16Array(indexCount);
  }

  // IRenderObject 接口属性
  get vertexSize(): number {
    return this.activeParticleCount * 4 * 2; // 每个粒子4个顶点，每个顶点2个坐标
  }

  get indexSize(): number {
    return this.activeParticleCount * 6; // 每个粒子6个索引（2个三角形）
  }

  get colorSize(): number {
    return this.activeParticleCount * 4 * 1; // 每个粒子4个顶点，每个顶点1个压缩颜色值
  }

  get uvSize(): number {
    return this.activeParticleCount * 4 * 3; // 每个粒子4个顶点，每个顶点3个UV值（u, v, textureId）
  }

  /**
   * 更新粒子数据
   */
  updateParticles(particles: ParticleData[]): void {
    const activeParticles = particles.filter((p) => p.isAlive);
    this.activeParticleCount = activeParticles.length;

    if (this.activeParticleCount === 0) {
      return;
    }

    // 确保缓冲区容量足够（基于配置的最大粒子数）
    const config = this.particleSystem.config;
    this.ensureBufferCapacity(config.maxParticles);

    // 生成顶点数据
    let vertexIndex = 0;
    let colorIndex = 0;
    let uvIndex = 0;
    let indexIndex = 0;

    for (let i = 0; i < this.activeParticleCount; i++) {
      const particle = activeParticles[i];
      const halfSize = particle.size / 2;

      // 计算旋转
      const cos = Math.cos(particle.rotation);
      const sin = Math.sin(particle.rotation);

      // 四个顶点的本地坐标（相对于粒子中心）
      const localVertices = [
        { x: -halfSize, y: -halfSize }, // 左下
        { x: halfSize, y: -halfSize }, // 右下
        { x: halfSize, y: halfSize }, // 右上
        { x: -halfSize, y: halfSize }, // 左上
      ];

      // 变换并设置顶点位置
      for (let j = 0; j < 4; j++) {
        const local = localVertices[j];

        // 应用旋转
        const rotatedX = local.x * cos - local.y * sin;
        const rotatedY = local.x * sin + local.y * cos;

        // 转换到世界坐标
        this.vertices[vertexIndex++] = particle.x + rotatedX;
        this.vertices[vertexIndex++] = particle.y + rotatedY;
      }

      // 将粒子颜色转换为32位ABGR格式
      const r = Math.max(0, Math.min(255, Math.round(particle.r * 255)));
      const g = Math.max(0, Math.min(255, Math.round(particle.g * 255)));
      const b = Math.max(0, Math.min(255, Math.round(particle.b * 255)));
      const a = Math.max(0, Math.min(255, Math.round(particle.a * 255)));

      // ABGR格式：Alpha << 24 | Blue << 16 | Green << 8 | Red
      const packedColor = (a << 24) | (b << 16) | (g << 8) | r;

      // 设置颜色（每个顶点相同）
      for (let j = 0; j < 4; j++) {
        // 将压缩的32位颜色值转换为float存储
        const colorBuffer = new ArrayBuffer(4);
        const uint32View = new Uint32Array(colorBuffer);
        const float32View = new Float32Array(colorBuffer);
        uint32View[0] = packedColor;
        this.colors[colorIndex++] = float32View[0];
      }

      // 设置UV坐标（包含textureId）
      const uvCoords = [
        { u: 0, v: 0 }, // 左下
        { u: 1, v: 0 }, // 右下
        { u: 1, v: 1 }, // 右上
        { u: 0, v: 1 }, // 左上
      ];

      for (let j = 0; j < 4; j++) {
        this.uvs[uvIndex++] = uvCoords[j].u;
        this.uvs[uvIndex++] = uvCoords[j].v;
        this.uvs[uvIndex++] = this.textureId; // 添加textureId
      }

      // 设置索引（两个三角形组成四边形）
      const baseIndex = i * 4;
      this.indices[indexIndex++] = baseIndex + 0; // 第一个三角形
      this.indices[indexIndex++] = baseIndex + 1;
      this.indices[indexIndex++] = baseIndex + 2;

      this.indices[indexIndex++] = baseIndex + 0; // 第二个三角形
      this.indices[indexIndex++] = baseIndex + 2;
      this.indices[indexIndex++] = baseIndex + 3;
    }
  }

  /**
   * 更新纹理
   */
  updateTexture(texture?: Texture): void {
    // 修复：无论是否有batch都应该记录texture变化
    // 在batch创建时会重新设置正确的textureId
    if (texture) {
      // 如果有batch，立即设置textureId
      if (this.batch) {
        this.textureId = this.batch.getTextureId(texture) ?? this.batch.add(texture);
      } else {
        // 没有batch时，暂时设置为0，等待batch创建时重新设置
        this.textureId = 0;
      }
    } else {
      this.textureId = -1;
    }
  }

  // IRenderObject 接口方法实现
  packVertex(vertexBuffer: VertexBuffer): void {
    // 将顶点数据打包到顶点缓冲区
    const actualVertexCount = this.activeParticleCount * 4 * 2; // 每个粒子4个顶点，每个顶点2个坐标
    if (actualVertexCount > 0) {
      // 只复制实际使用的顶点数据，而不是整个缓冲区
      const actualVertices = this.vertices.subarray(0, actualVertexCount);

      // 添加调试信息
      if (this.vertexStart + actualVertexCount > vertexBuffer.f32Data.length) {
        console.error('顶点缓冲区越界:', {
          vertexStart: this.vertexStart,
          actualVertexCount,
          bufferSize: vertexBuffer.f32Data.length,
          requiredSize: this.vertexStart + actualVertexCount,
          activeParticles: this.activeParticleCount,
          maxParticles: this.maxParticles,
        });
        return;
      }

      vertexBuffer.f32Data.set(actualVertices, this.vertexStart);
    }
  }

  packIndex(indexBuffer: IndexBuffer): void {
    // 将索引数据打包到索引缓冲区
    const actualIndexCount = this.activeParticleCount * 6; // 每个粒子6个索引
    if (actualIndexCount > 0) {
      // 只处理实际使用的索引数据
      const actualIndices = this.indices.subarray(0, actualIndexCount);

      // 添加调试信息
      if (this.indexStart + actualIndexCount > indexBuffer.data.length) {
        console.error('索引缓冲区越界:', {
          indexStart: this.indexStart,
          actualIndexCount,
          bufferSize: indexBuffer.data.length,
          requiredSize: this.indexStart + actualIndexCount,
          activeParticles: this.activeParticleCount,
        });
        return;
      }

      // 将Uint16Array转换为Uint32Array以匹配IndexBuffer
      for (let i = 0; i < actualIndices.length; i++) {
        indexBuffer.data[this.indexStart + i] = actualIndices[i];
      }
    }
  }

  packColor(colorBuffer: VertexBuffer): void {
    // 将颜色数据打包到颜色缓冲区
    const actualColorCount = this.activeParticleCount * 4; // 每个粒子4个顶点
    if (actualColorCount > 0) {
      // 只处理实际使用的颜色数据
      const actualColors = this.colors.subarray(0, actualColorCount);

      // 添加调试信息
      if (this.colorStart + actualColorCount > colorBuffer.u32Data.length) {
        console.error('颜色缓冲区越界:', {
          colorStart: this.colorStart,
          actualColorCount,
          bufferSize: colorBuffer.u32Data.length,
          requiredSize: this.colorStart + actualColorCount,
          activeParticles: this.activeParticleCount,
        });
        return;
      }

      // 使用u32Data来访问压缩的32位颜色数据
      const sourceBuffer = new ArrayBuffer(actualColors.length * 4);
      const sourceFloat32 = new Float32Array(sourceBuffer);
      const sourceUint32 = new Uint32Array(sourceBuffer);

      // 复制颜色数据到临时缓冲区
      sourceFloat32.set(actualColors);

      // 将uint32数据复制到目标缓冲区
      for (let i = 0; i < actualColors.length; i++) {
        colorBuffer.u32Data[this.colorStart + i] = sourceUint32[i];
      }
    }
  }

  packUV(uvBuffer: VertexBuffer): void {
    // 将UV数据打包到UV缓冲区
    const actualUVCount = this.activeParticleCount * 4 * 3; // 每个粒子4个顶点，每个顶点3个UV值
    if (actualUVCount > 0) {
      // 只处理实际使用的UV数据
      const actualUVs = this.uvs.subarray(0, actualUVCount);

      // 添加调试信息
      if (this.uvStart + actualUVCount > uvBuffer.f32Data.length) {
        console.error('UV缓冲区越界:', {
          uvStart: this.uvStart,
          actualUVCount,
          bufferSize: uvBuffer.f32Data.length,
          requiredSize: this.uvStart + actualUVCount,
          activeParticles: this.activeParticleCount,
        });
        return;
      }

      // UV数据格式: u, v, textureId
      // 前两个值使用f32Data，textureId使用u32Data或f32Data（取决于渲染器）
      const { f32Data, u32Data } = uvBuffer;
      const useWebGpu = true; // 假设使用WebGPU，实际应该从device获取
      const textureData = useWebGpu ? u32Data : f32Data;

      for (let i = 0; i < actualUVs.length; i += 3) {
        const uvStart = this.uvStart + i;
        f32Data[uvStart] = actualUVs[i]; // u
        f32Data[uvStart + 1] = actualUVs[i + 1]; // v
        textureData[uvStart + 2] = actualUVs[i + 2]; // textureId
      }
    }
  }

  /**
   * 获取顶点数据
   */
  getVertices(): Float32Array {
    return this.vertices;
  }

  /**
   * 获取颜色数据
   */
  getColors(): Float32Array {
    return this.colors;
  }

  /**
   * 获取UV数据
   */
  getUVs(): Float32Array {
    return this.uvs;
  }

  /**
   * 获取索引数据
   */
  getIndices(): Uint16Array {
    return this.indices;
  }

  /**
   * 获取活跃粒子数量
   */
  getActiveParticleCount(): number {
    return this.activeParticleCount;
  }
}
