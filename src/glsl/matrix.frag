#version 300 es

precision mediump float;
uniform sampler2D u_texture;
uniform vec2 screenSize;

uniform mat2 u_matrix;

out vec4 outColor;

void main() {
    vec2 coords_centered = gl_FragCoord.xy - screenSize / 2.;

    vec2 coords_transformed = u_matrix * coords_centered;

    vec2 coords_final = coords_transformed + screenSize / 2.;

    outColor = texture(u_texture, coords_final / screenSize);
}