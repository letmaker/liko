// @ts-nocheck  TODO: 待实现
import { WebGLRender } from "../render/webgl-render";
import type { WebGpuRender } from "../render/webgpu-render";
import type { RenderOptions } from "../renderer";
import type { IBindResource } from "./webgpu-device";

export class GLBuffer {
  constructor(
    public data: WebGLBuffer,
    private gl: WebGL2RenderingContext,
    public label: string,
  ) {}
  destroy() {
    console.error("todo");
  }
}

export class GLUniform {
  constructor(public label: string) {}
  destroy() {
    console.error("todo");
  }
}

export class GLTexture {
  constructor(
    public data: WebGLTexture,
    private gl: WebGL2RenderingContext,
  ) {}
  destroy() {
    console.error("todo");
  }
  createView() {
    return {} as unknown as GPUTextureView;
  }
}

/**
 * WebGL 设备，方便隔离 WebGL 和 WebGPU
 */
export class WebGLDevice {
  gl!: WebGL2RenderingContext;
  defaultSampler!: GPUSampler;

  private debug = false;
  private program!: WebGLProgram;

  /**
   * 初始化 WebGL 设备
   */
  init(options: RenderOptions) {
    this.gl = options.canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      premultipliedAlpha: true,
    }) as WebGL2RenderingContext;
    if (!this.gl) {
      throw new Error("Failed to initialize WebGL context");
    }

    if (this.debug) {
      console.log("WebGL context initialized");
    }

    return {
      context: { getCurrentTexture: () => undefined } as unknown as GPUCanvasContext,
      gpuRender: new WebGLRender() as unknown as WebGpuRender,
    };
  }

  setViewport(width: number, height: number) {
    this.gl.viewport(0, 0, width, height);
    if (this.debug) {
      console.log("setViewport", width, height);
    }
  }

  createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
    }
    if (this.debug) {
      console.log("createShader", type, source);
    }
    return shader;
  }

  createProgram(vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
    const gl = this.gl;
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create program");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // gl.deleteProgram(program);
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }

    this.program = program;
    gl.useProgram(program);
    if (this.debug) {
      console.log("createProgram");
    }
    return program;
  }

  createProjectionMatrixBuffer(locationLabel: string, data: Float32Array) {
    return {
      buffer: new GLUniform(locationLabel) as unknown as GPUBuffer,
      group: {} as unknown as GPUBindGroup,
    };
  }

  uploadUniform(buffer: GPUBuffer, data: Float32Array) {
    const gl = this.gl;
    const locationLabel = (buffer as unknown as GLUniform).label;
    // 获取 uniform 位置
    const uProjectionMatrixLocation = gl.getUniformLocation(this.program, locationLabel);
    // 设置 uniform 值
    gl.uniformMatrix4fv(uProjectionMatrixLocation, false, data);
    if (this.debug) {
      console.log("uploadUniform", locationLabel, data);
    }
  }

  createVertexBuffer(label: string, data: Float32Array | Uint32Array) {
    const gl = this.gl;

    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    if (this.debug) {
      console.log("createVertexBuffer", label, data);
    }

    return new GLBuffer(buffer, gl, label) as unknown as GPUBuffer;
  }

  createIndexBuffer(label: string, data: Uint16Array | Uint32Array) {
    const gl = this.gl;

    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    if (this.debug) {
      console.log("createIndexBuffer", label, data);
    }

    return new GLBuffer(buffer, gl, label) as unknown as GPUBuffer;
  }

  createUniformBuffer(locationLabel: string, data: Uint16Array | Uint32Array) {
    const gl = this.gl;
    // 获取 uniform 位置
    const uProjectionMatrixLocation = gl.getUniformLocation(this.program, locationLabel);
    // 设置 uniform 值
    gl.uniformMatrix4fv(uProjectionMatrixLocation, false, data);

    if (this.debug) {
      console.log("createUniformBuffer", locationLabel, data);
    }
    return {} as unknown as GPUBuffer;
  }

  uploadBuffer(buffer: GPUBuffer, data: BufferSource | SharedArrayBuffer, index = false) {
    if (!buffer) return;
    const gl = this.gl;
    const type = index ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    gl.bindBuffer(type, (buffer as unknown as GLBuffer).data);
    gl.bufferSubData(type, 0, data);

    if (this.debug) {
      console.log("uploadBuffer", buffer.label);
    }
  }

  createGroup(label: string, entries: IBindResource[]) {
    return { layout: {} as unknown as GPUBindGroupLayout, group: {} as unknown as GPUBindGroup };
  }

  createTexture(label: string, width: number, height: number): GPUTexture {
    const gl = this.gl;

    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create texture");
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (this.debug) {
      console.log("createTexture", label, width, height);
    }

    return new GLTexture(texture, gl) as unknown as GPUTexture;
  }

  uploadTexture(bitmap: ImageBitmap | HTMLCanvasElement, texture: GPUTexture): void {
    const gl = this.gl;

    gl.bindTexture(gl.TEXTURE_2D, (texture as unknown as GLTexture).data);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

    if (this.debug) {
      console.log("uploadTexture");
    }
  }
}
