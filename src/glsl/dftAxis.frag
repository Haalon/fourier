#version 300 es

precision mediump float;
uniform sampler2D u_x;
uniform sampler2D u_y;

uniform vec2 screenSize;

uniform float u_direction;
uniform int u_normalise;
uniform int u_axis;

#define PI 3.1415926535897932384626433832795

layout(location = 0) out vec4 out_x;
layout(location = 1) out vec4 out_y;

vec2 CMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y,  a.x * b.y + a.y * b.x);
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

    // columns
    if (u_axis == 1) {
        for(float i = 0.; i < N; i++) {
            vec2 power = vec2(0., u_direction * 2. * PI * k * i / N);
            vec2 mul = CExp(power);
            vec4 term_x = texture(u_x, vec2(i+0.5, l+0.5) / screenSize);
            vec4 term_y =  texture(u_y, vec2(i+0.5, l+0.5) / screenSize);


            resR += CMul(vec2(term_x.x, term_y.x), mul);
            resG += CMul(vec2(term_x.y, term_y.y), mul);
            resB += CMul(vec2(term_x.z, term_y.z), mul);
        }

        if (u_normalise != 0) {
            resR = resR / N;
            resG = resG / N;
            resB = resB / N;
        }
    } else {
        for(float j = 0.; j < M; j++) {
            vec2 power = vec2(0., u_direction * 2. * PI * l * j / M);
            vec2 mul = CExp(power);
            vec4 term_x = texture(u_x, vec2(k+0.5, j+0.5) / screenSize);
            vec4 term_y =  texture(u_y, vec2(k+0.5, j+0.5) / screenSize);

            resR += CMul(vec2(term_x.x, term_y.x), mul);
            resG += CMul(vec2(term_x.y, term_y.y), mul);
            resB += CMul(vec2(term_x.z, term_y.z), mul);
        }

        if (u_normalise != 0) {
            resR = resR / M;
            resG = resG / M;
            resB = resB / M;
        }
    }

    out_x = vec4(resR.x, resG.x, resB.x, 1.);
    out_y = vec4(resR.y, resG.y, resB.y, 1.);

    return;
}