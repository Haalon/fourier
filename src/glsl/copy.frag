#version 300 es

precision highp float;
uniform sampler2D u_texture;
uniform vec2 screenSize;
uniform vec2 u_offset;

out vec4 outColor;

void main() {
    outColor = texture(u_texture, (gl_FragCoord.xy + u_offset) / screenSize);
}