#version 300 es

precision highp float;
uniform sampler2D u_texture;
uniform vec2 screenSize;

uniform mat2 u_matrix;

out vec4 outColor;

vec2 diff = vec2(0.5, -0.5);

void main() {
    vec2 coords_centered = gl_FragCoord.xy - diff;

    vec2 coords_transformed = u_matrix * coords_centered;

    vec2 coords_final = coords_transformed + diff;

    outColor = texture(u_texture, coords_final / screenSize);
}