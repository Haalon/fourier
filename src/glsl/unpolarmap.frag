#version 300 es

precision highp float;
uniform sampler2D u_magn;
uniform sampler2D u_phase;
uniform vec2 screenSize;

uniform float u_maxval;

#define PI 3.1415926535897932384626433832795

layout(location = 0) out vec4 outX;
layout(location = 1) out vec4 outY;

void main() {
    vec3 logmagn = texture(u_magn, gl_FragCoord.xy / screenSize).xyz;
    vec3 phase_corr = texture(u_phase, gl_FragCoord.xy / screenSize).xyz;

    vec3 phase = phase_corr * 2. * PI - vec3(PI);
    vec3 magn = exp(logmagn * log(1. + u_maxval)) - vec3(1.);

    vec3 x = magn * cos(phase);
    vec3 y = magn * sin(phase);

    outX = vec4(x, 1.);
    outY = vec4(y, 1.);
    
}