#version 300 es

precision highp float;
uniform sampler2D u_texture;
uniform vec2 screenSize;

uniform float u_direction;
uniform int u_normalise;
uniform int u_mode;

#define PI 3.1415926535897932384626433832795

layout(location = 0) out vec4 magn;
layout(location = 1) out vec4 phase;

vec2 CMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y,  a.x * b.y + a.y * b.x);
}

float CPhase(vec2 c) {
    return (atan(c.y, c.x) + PI) / PI / 2.;
}

vec2 CExp(vec2 c) {
    float coef = exp(c.x);
    return vec2(coef * cos(c.y), coef * sin(c.y));
} 

void main() {
    vec2 resR = vec2(0., 0.);
    vec2 resG = vec2(0., 0.);
    vec2 resB = vec2(0., 0.);

    float k = gl_FragCoord.x - 0.5;
    float l = gl_FragCoord.y - 0.5;

    // magn = vec4(k,0,0,1);
    // phase = vec4(l,0,0,1);

    float N = screenSize.x;
    float M = screenSize.y;

    

    for(int ii = 0; ii < int(N); ii++) {
        for(int jj = 0; jj < int(M); jj++) {
            float i = float(ii);
            float j = float(jj);
            vec2 power = vec2(0., u_direction * 2. * PI * (k*i/N + l*j/M));
            vec2 mul = CExp(power);
            vec4 term = texture(u_texture, vec2(i+0.5, j+0.5) / screenSize);

            resR += CMul(vec2(term.x, 0.), mul);
            resG += CMul(vec2(term.y, 0.), mul);
            resB += CMul(vec2(term.z, 0.), mul);
        }
    }

    if (u_normalise != 0) {
        resR /= N*M;
        resG /= N*M;
        resB /= N*M;
    }

    // magn = vec4(k/N, 0.,0., 1.);
    // phase = vec4(0.,0.,l/M, 1.);
    magn = vec4(length(resR), length(resG), length(resB), 1.);
    phase = vec4(CPhase(resR), CPhase(resG), CPhase(resB), 1.);
    return;
}