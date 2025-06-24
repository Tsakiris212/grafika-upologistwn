window.onload = function() {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL δεν υποστηρίζεται από τον browser σου.");
        return;
    }

    // Ρύθμιση φόντου (σκούρο γκρι)
    gl.clearColor(0.2, 0.2, 0.2, 1.0);  // RGB 0.2 για σκούρο γκρι
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Ενεργοποίηση βάθους για 3D
    gl.enable(gl.DEPTH_TEST);
};
