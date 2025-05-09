import type { Batch } from '../batch/batch';
import { Device } from '../device/device';
import type { GLBuffer, GLTexture, WebGLDevice } from '../device/webgl-device';
import FragShader from './sprite.frag?raw';
import VertShader from './sprite.vert?raw';
import type { IWebGLRenderPipe } from './webgl-render';

export class WebGLSpritePipeline implements IWebGLRenderPipe {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;

  aPosLocation = 0;
  aColorLocation = 0;
  aUVLocation = 0;
  aTextureIdLocation = 0;
  uTexturesLocation: WebGLUniformLocation | null;
  texturesList = Array.from({ length: 16 }, (_, i) => i);
  vao!: WebGLVertexArrayObject;

  constructor() {
    const device = Device as WebGLDevice;
    const gl = device.gl;
    const program = device.createProgram(VertShader, FragShader);

    this.aPosLocation = gl.getAttribLocation(program, 'aPos');
    this.aColorLocation = gl.getAttribLocation(program, 'aColor');
    this.aUVLocation = gl.getAttribLocation(program, 'aUV');
    this.aTextureIdLocation = gl.getAttribLocation(program, 'aTextureId');
    this.uTexturesLocation = gl.getUniformLocation(program, 'uTextures');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //禁用深度测试
    // gl.disable(gl.DEPTH_TEST);

    this.gl = gl;
    this.program = program;
  }

  first = true;

  render(batch: Batch): void {
    const gl = this.gl;

    if (this.first) {
      this.first = false;

      const { posBuffer, colorBuffer, uvBuffer, indexBuffer } = batch.batchGroup;
      const posBufferData = (posBuffer.buffer as unknown as GLBuffer).data;
      const colorBufferData = (colorBuffer.buffer as unknown as GLBuffer).data;
      const uvBufferData = (uvBuffer.buffer as unknown as GLBuffer).data;
      const indexBufferData = (indexBuffer.buffer as unknown as GLBuffer).data;

      // TODO 多余
      this.vao = gl.createVertexArray() as WebGLVertexArrayObject;
      gl.bindVertexArray(this.vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBufferData);
      gl.enableVertexAttribArray(this.aPosLocation);
      gl.vertexAttribPointer(this.aPosLocation, 2, gl.FLOAT, false, 8, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferData);
      gl.enableVertexAttribArray(this.aColorLocation);
      gl.vertexAttribPointer(this.aColorLocation, 4, gl.UNSIGNED_BYTE, true, 4, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBufferData);
      gl.enableVertexAttribArray(this.aUVLocation);
      gl.vertexAttribPointer(this.aUVLocation, 2, gl.FLOAT, false, 12, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBufferData);
      gl.enableVertexAttribArray(this.aTextureIdLocation);
      gl.vertexAttribPointer(this.aTextureIdLocation, 1, gl.FLOAT, false, 12, 8);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferData);

      gl.bindVertexArray(null);

      // 需要调用一次，以上传图片纹理
      batch.textureGroup.group;
      // 绑定纹理
      for (let i = 0; i < batch.textureGroup.buffers.length; i++) {
        const texture = (batch.textureGroup.buffers[i].texture as unknown as GLTexture).data;
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      }
      gl.uniform1iv(this.uTexturesLocation, this.texturesList);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, batch.size, gl.UNSIGNED_INT, batch.startIndex);
  }
}
