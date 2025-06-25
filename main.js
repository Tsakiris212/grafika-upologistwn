window.onload = function () {
  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl");

  if (!gl) {
    alert("WebGL δεν υποστηρίζεται.");
    return;
  }

  // --------- SHADERS ----------
  const vsSource = `
    attribute vec3 aPosition;
    attribute vec4 aColor;
    varying vec4 vColor;
    uniform mat4 uProjection;
    uniform mat4 uView;
    void main(void) {
      gl_Position = uProjection * uView * vec4(aPosition, 1.0);
      vColor = aColor;
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  // --------- CUBE GEOMETRY ----------
  // Κάθε πλευρά έχει δικά της 4 κορυφές (6 πλευρές x 4 κορυφές = 24)
  const cubeVertices = [
    // Front face (κόκκινο)
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,

    // Back face (πράσινο)
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,

    // Top face (μπλε)
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,

    // Bottom face (κίτρινο)
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,

    // Right face (μωβ)
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,

    // Left face (γαλάζιο)
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
  ];

  const colors = [
    // Front (κόκκινο)
    1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,
    // Back (πράσινο)
    0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1,
    // Top (μπλε)
    0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1,
    // Bottom (κίτρινο)
    1, 1, 0, 1,  1, 1, 0, 1,  1, 1, 0, 1,  1, 1, 0, 1,
    // Right (μωβ)
    1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,
    // Left (γαλάζιο)
    0, 1, 1, 1,  0, 1, 1, 1,  0, 1, 1, 1,  0, 1, 1, 1
  ];

  const indices = [
    0, 1, 2,   0, 2, 3,       // Front
    4, 5, 6,   4, 6, 7,       // Back
    8, 9,10,   8,10,11,       // Top
   12,13,14,  12,14,15,       // Bottom
   16,17,18,  16,18,19,       // Right
   20,21,22,  20,22,23        // Left
  ];

  // Buffer για vertices
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

  // Buffer για χρώματα
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Buffer για indices
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  // Bind attributes
  const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  const aColor = gl.getAttribLocation(shaderProgram, "aColor");
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aColor);

  // Προβολή & κάμερα
  const uProjection = gl.getUniformLocation(shaderProgram, "uProjection");
  const uView = gl.getUniformLocation(shaderProgram, "uView");

  const projMatrix = mat4.create();
  mat4.perspective(projMatrix, 60 * Math.PI / 180, 1, 0.001, 8000);
  gl.uniformMatrix4fv(uProjection, false, projMatrix);

  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [8, 8, 8], [0, 0, 0], [0, 0, 1]);
  gl.uniformMatrix4fv(uView, false, viewMatrix);

  // Καθαρισμός και σχεδίαση
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
};
