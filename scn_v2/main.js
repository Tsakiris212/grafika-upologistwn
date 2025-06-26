// main.js – Βήμα 11: Animation Mode & FPS Camera Mode με toggle κουμπιά + Περιστροφή Ρομπότ

async function loadShaderSource(url) {
  const response = await fetch(url);
  return await response.text();
}

window.onload = async function () {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;

  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl");
  canvas.setAttribute("tabindex", "0");
  canvas.focus();

  if (!gl) {
    alert("WebGL δεν υποστηρίζεται.");
    return;
  }

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

  const texCoords = [
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1,
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

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();

  const aPosition = gl.getAttribLocation(program, "aPosition");
  const aColor = gl.getAttribLocation(program, "aColor");
  const aTexCoord = gl.getAttribLocation(program, "aTexCoord");
  const uModel = gl.getUniformLocation(program, "uModel");
  const uView = gl.getUniformLocation(program, "uView");
  const uProjection = gl.getUniformLocation(program, "uProjection");
  const uUseTexture = gl.getUniformLocation(program, "uUseTexture");
  const uTexture = gl.getUniformLocation(program, "uTexture");

  gl.enableVertexAttribArray(aPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.15, 0.15, 0.15, 1.0);

  const texture = gl.createTexture();
  const image = new Image();
  image.src = "textures/grass.jpg";
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    drawScene();
  };

  gl.uniform1i(uTexture, 0);

  function drawCube(modelMatrix, color, useTexture = false) {
    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniform1i(uUseTexture, useTexture);

    if (useTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aTexCoord);
    } else {
      const colorArray = [];
      for (let i = 0; i < 8; i++) colorArray.push(...color);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aColor);
    }

    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
  }

  let robotRotation = 0;
  let angle = 0;
  let animationRunning = false;
  let fpsMode = false;

  let leftArmAngle = 0;
  let leftArmDirection = 1;

  let camPos = vec3.fromValues(6, 6, 6);
  let camForward = vec3.fromValues(-1, -1, 0);
  let camUp = vec3.fromValues(0, 0, 1);

  function animateCamera() {
    if (!animationRunning) return;
    angle += 0.01;
    const radius = 6;
    camPos[0] = radius * Math.cos(angle);
    camPos[1] = radius * Math.sin(angle);
    camForward = vec3.fromValues(-camPos[0], -camPos[1], -camPos[2]);
    vec3.normalize(camForward, camForward);
    drawScene();
    requestAnimationFrame(animateCamera);
  }

 document.getElementById("startAnimation").onclick = () => {
  if (animationRunning) {
    animationRunning = false;
    document.getElementById("startAnimation").innerText = "Start Animation";
  } else {
    fpsMode = false;
    animationRunning = true;
    document.getElementById("startAnimation").innerText = "Stop Animation";
    animateCamera();
  }
  canvas.addEventListener("wheel", function (e) {
    const selectedPart = document.querySelector('input[name="part"]:checked')?.value;
    if (selectedPart === "leftArmMove") {
      // Ρύθμιση γωνίας με βάση τη ροδέλα
      leftArmAngle += e.deltaY * -0.005;
  
      // Περιορισμός γωνίας
      leftArmAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, leftArmAngle));
  
      drawScene();
    }
  });
};
σ


  document.getElementById("startFPS").onclick = () => {
    animationRunning = false;
    fpsMode = true;
    drawScene();
  };

  document.addEventListener("keydown", (e) => {
  const moveSpeed = 0.3;
  const right = vec3.create();
  vec3.cross(right, camForward, camUp);
  vec3.normalize(right, right);

  if (fpsMode) {
  if (e.key === "w" || e.key === "W") vec3.scaleAndAdd(camPos, camPos, camForward, moveSpeed);
  if (e.key === "s" || e.key === "S") vec3.scaleAndAdd(camPos, camPos, camForward, -moveSpeed);
  if (e.key === "a" || e.key === "A") vec3.scaleAndAdd(camPos, camPos, right, -moveSpeed);
  if (e.key === "d" || e.key === "D") vec3.scaleAndAdd(camPos, camPos, right, moveSpeed);
}

// ανεξαρτήτως mode, περιστροφή ρομπότ
if (e.key === "a" || e.key === "A") robotRotation += 0.05;
if (e.key === "d" || e.key === "D") robotRotation -= 0.05;


  // Η περιστροφή του ρομπότ γίνεται ανεξαρτήτως mode
  if (e.key === "a" || e.key === "A") robotRotation += 0.05;
  if (e.key === "d" || e.key === "D") robotRotation -= 0.05;

  drawScene();
});


  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMatrix = mat4.create();
    const camTarget = vec3.create();
    vec3.add(camTarget, camPos, camForward);
    mat4.lookAt(viewMatrix, camPos, camTarget, camUp);
    gl.uniformMatrix4fv(uView, false, viewMatrix);

    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, Math.PI / 3, canvas.width / canvas.height, 1.0, 100);
    gl.uniformMatrix4fv(uProjection, false, projMatrix);

    const matGround = mat4.create();
    mat4.translate(matGround, matGround, [0, 0, -0.2]);
    mat4.scale(matGround, matGround, [10, 10, 1.0]);
    drawCube(matGround, [1, 1, 1, 1], true);

    const matSkybox = mat4.create();
    mat4.translate(matSkybox, matSkybox, [0, 0, 10]);
    mat4.scale(matSkybox, matSkybox, [40, 40, 20]);
    drawCube(matSkybox, [0.4, 0.6, 1, 1]);

    const matRobot = mat4.create();
    mat4.rotateZ(matRobot, matRobot, robotRotation);

    const matFootL = mat4.clone(matRobot);
    mat4.translate(matFootL, matFootL, [-0.6, -0.3, 0.1]);
    mat4.scale(matFootL, matFootL, [0.4, 0.6, 0.2]);
    drawCube(matFootL, [1, 0, 0, 1]);

    const matFootR = mat4.clone(matRobot);
    mat4.translate(matFootR, matFootR, [0.6, -0.3, 0.1]);
    mat4.scale(matFootR, matFootR, [0.4, 0.6, 0.2]);
    drawCube(matFootR, [1, 0, 0, 1]);

    const matLegL = mat4.clone(matRobot);
    mat4.translate(matLegL, matLegL, [-0.4, -0.3, 0.5]);
    mat4.scale(matLegL, matLegL, [0.2, 0.2, 0.8]);
    drawCube(matLegL, [1, 1, 0, 1]);

    const matLegR = mat4.clone(matRobot);
    mat4.translate(matLegR, matLegR, [0.6, -0.3, 0.5]);
    mat4.scale(matLegR, matLegR, [0.2, 0.2, 0.8]);
    drawCube(matLegR, [1, 1, 0, 1]);

    const matBody = mat4.clone(matRobot);
    mat4.translate(matBody, matBody, [0, -0.3, 1.4]);
    mat4.scale(matBody, matBody, [1.2, 0.5, 1]);
    drawCube(matBody, [1, 0, 0, 1]);

    const matArmL = mat4.clone(matRobot);
mat4.translate(matArmL, matArmL, [-0.7, -0.3, 1.4]);

const selectedPart = document.querySelector('input[name="part"]:checked')?.value;
if (selectedPart === "leftArmMove") {
  mat4.rotateX(matArmL, matArmL, leftArmAngle);
}

mat4.scale(matArmL, matArmL, [0.2, 0.2, 1]);
drawCube(matArmL, [1, 1, 0, 1]);

    const matArmR = mat4.clone(matRobot);
    mat4.translate(matArmR, matArmR, [0.7, -0.3, 1.4]);
    mat4.scale(matArmR, matArmR, [0.2, 0.2, 1]);
    drawCube(matArmR, [1, 1, 0, 1]);

    const matHead = mat4.clone(matRobot);
    mat4.translate(matHead, matHead, [0, -0.3, 2.4]);
    mat4.scale(matHead, matHead, [0.5, 0.5, 0.5]);
    drawCube(matHead, [1, 1, 0, 1]);
  }

  if (selectedPart === "leftArmMove") {
    requestAnimationFrame(drawScene);
  }
};
