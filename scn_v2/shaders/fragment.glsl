precision mediump float;

varying vec4 vColor;
varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform bool uUseTexture;

void main(void) {
  if (uUseTexture) {
    gl_FragColor = texture2D(uTexture, vTexCoord);
  } else {
    gl_FragColor = vColor;
  }
}
