async function loadShaderSource(url) {
  const response = await fetch(url);
  return await response.text();
}

window.onload = async function () {
  const mat4 = glMatrix.mat4;

  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL δεν υποστηρίζεται.");
    return;
  }

  // Φόρτωση shader source
  const vsSource = await loadShaderSource("shaders/vertex.glsl");
  const fsSource = await loadShaderSource("shaders/fragment.glsl");

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Buffers
  const cubeVertices = [
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
    -0.5,  0.5, -0.5,
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,
  ];

  const cubeIndices = [
    0, 1, 2,  0, 2, 3,
    4, 5, 6,  4, 6, 7,
    0, 4, 7,  0, 7, 3,
    1, 5, 6,  1, 6, 2,
    3, 2, 6,  3, 6, 7,
    0, 1, 5,  0, 5, 4,
  ];

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  const uProjection = gl.getUniformLocation(program, "uProjection");
  const uView = gl.getUniformLocation(program, "uView");
  const uModel = gl.getUniformLocation(program, "uModel");
  const aColor = gl.getAttribLocation(program, "aColor");

  // Dummy color (χρησιμοποιείται μόνο μία φορά εδώ)
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  const oneColor = new Float32Array(8 * 4).fill(1); // 8 κορυφές × RGBA
  gl.bufferData(gl.ARRAY_BUFFER, oneColor, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aColor);
  gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);

  // View/Projection setup
  const projMatrix = mat4.create();
  mat4.perspective(projMatrix, Math.PI / 3, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(uProjection, false, projMatrix);

  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [6, 6, 6], [0, 0, 0], [0, 0, 1]);
  gl.uniformMatrix4fv(uView, false, viewMatrix);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.15, 0.15, 0.15, 1.0);

  // ----------- drawCube ------------
  function drawCube(modelMatrix, color) {
    gl.uniformMatrix4fv(uModel, false, modelMatrix);

    // Set χρώμα σε κάθε κορυφή
    const colorArray = [];
    for (let i = 0; i < 8; i++) colorArray.push(...color);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
  }

  // ----------- Σχεδίαση σκηνής --------
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Πατούσα αριστερή (κόκκινο)
  const matFootLeft = mat4.create();
  mat4.translate(matFootLeft, matFootLeft, [-0.6, -0.3, 0.1]);
  mat4.scale(matFootLeft, matFootLeft, [0.4, 0.6, 0.2]);
  drawCube(matFootLeft, [1, 0, 0, 1]);

  // Πατούσα δεξιά (κόκκινο)
  const matFootRight = mat4.create();
  mat4.translate(matFootRight, matFootRight, [0.6, -0.3, 0.1]);
  mat4.scale(matFootRight, matFootRight, [0.4, 0.6, 0.2]);
  drawCube(matFootRight, [1, 0, 0, 1]);

  // Πόδι αριστερό
const matLegLeft = mat4.create();
mat4.translate(matLegLeft, matLegLeft, [-0.6, -0.3, 0.5]);  // πάνω από πατούσα
mat4.scale(matLegLeft, matLegLeft, [0.2, 0.2, 0.8]);
drawCube(matLegLeft, [1, 1, 0, 1]);

// Πόδι δεξί
const matLegRight = mat4.create();
mat4.translate(matLegRight, matLegRight, [0.6, -0.3, 0.5]);
mat4.scale(matLegRight, matLegRight, [0.2, 0.2, 0.8]);
drawCube(matLegRight, [1, 1, 0, 1]);

//Κορμός
const matBody = mat4.create();
mat4.translate(matBody, matBody, [0, -0.3, 1.4]);  // πάνω από πόδια
mat4.scale(matBody, matBody, [1.2, 0.5, 1]);
drawCube(matBody, [1, 0, 0, 1]);

// Χέρι αριστερό
const matArmLeft = mat4.create();
mat4.translate(matArmLeft, matArmLeft, [-1.0, -0.3, 1.4]);
mat4.scale(matArmLeft, matArmLeft, [0.2, 0.2, 1]);
drawCube(matArmLeft, [1, 1, 0, 1]);

// Χέρι δεξί
const matArmRight = mat4.create();
mat4.translate(matArmRight, matArmRight, [1.0, -0.3, 1.4]);
mat4.scale(matArmRight, matArmRight, [0.2, 0.2, 1]);
drawCube(matArmRight, [1, 1, 0, 1]);

//Κεφάλι 
const matHead = mat4.create();
mat4.translate(matHead, matHead, [0, -0.3, 2.4]);
mat4.scale(matHead, matHead, [0.5, 0.5, 0.5]);
drawCube(matHead, [1, 1, 0, 1]);

};
