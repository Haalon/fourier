#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform vec2 screenSize;

out vec4 outColor;

int bitfieldReverse(int x, int digitNum)
{
  int res = 0;
  int i, shift, mask;

  for(i = 0; i < digitNum; i++) {
    mask = 1 << i;
    shift = digitNum - 2*i - 1;
    mask &= x;
    mask = (shift > 0) ? mask << shift : mask >> -shift;
    res |= mask;
  }

  return res;
}

void main() {
    int sizeX = int(floor(log2(screenSize.x)));
    int sizeY = int(floor(log2(screenSize.y)));

    int x = int(floor(gl_FragCoord.x));
    int y = int(floor(gl_FragCoord.y));

    float xx = float(bitfieldReverse(x, sizeX)) + 0.5;
    float yy = float(bitfieldReverse(y, sizeY)) + 0.5;

    vec2 pos = vec2(xx,yy);
    outColor = texture(u_texture, pos / screenSize);
}