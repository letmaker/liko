struct VertexInput {
  @location(0) xy: vec2<f32>,
  @location(1) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) clipRect: vec4<f32>,
};

@group(0) @binding(0) var<uniform> projection: mat4x4<f32>;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

@vertex
fn vert_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = projection * vec4<f32>(input.xy, 0.0, 1.0);
    out.uv = input.uv;
    out.clipRect = projection * filterUniforms.uClipRect;
    return out;
}

struct FilterUniforms {
  uClipRect: vec4<f32>,
};
@group(1) @binding(0) var<uniform> filterUniforms : FilterUniforms;

@fragment
fn frag_main(@location(0) uv: vec2<f32>, @location(1) clipRect: vec4<f32>) -> @location(0) vec4<f32> {
    var color = textureSample(tex, samp, uv);
    // 裁剪区域检查
    if uv.x < clipRect.x || uv.x > clipRect.x + clipRect.z || uv.y < clipRect.y || uv.y > clipRect.y + clipRect.w {
        // 如果像素不在裁剪区域内，直接输出透明颜色
        color = vec4(1.0, 0.0, 0.0, 1.0);
    }
    return color;
}