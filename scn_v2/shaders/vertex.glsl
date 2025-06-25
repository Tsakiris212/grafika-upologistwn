attribute vec3 aPosition;
attribute vec4 aColor;
attribute vec2 aTexCoord;

varying vec4 vColor;
varying vec2 vTexCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  vColor = aColor;
  vTexCoord = aTexCoord;
}
