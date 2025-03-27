struct VertexInput {
  @location(0) xy: vec2<f32>,
  @location(1) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> projection: mat4x4<f32>;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

@vertex
fn vert_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.pos = projection * vec4<f32>(input.xy, 0.0, 1.0);
    out.uv = input.uv;
    return out;
}

struct FilterUniforms {
  alpha: f32,
};
@group(1) @binding(0) var<uniform> filterUniforms : FilterUniforms;

@fragment
fn frag_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let color = textureSample(tex, samp, uv);
    return vec4<f32>(color.rgb, filterUniforms.alpha);
}