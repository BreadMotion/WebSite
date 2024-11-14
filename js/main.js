function processingProc(processing) {
  processing.setup = function () {
    processing.size(
      document.body.clientWidth,
      document.getElementById("content").offsetHeight - 30
    );
    processing.noStroke();
  };

  processing.draw = function () {
    processing.size(
      document.body.clientWidth,
      document.getElementById("content").offsetHeight - 30
    );
    processing.background(0);
    processing.translate(width / 2, height / 2);
    processing.pointLight(
      150,
      100,
      0, // Color
      200,
      -150,
      0
    ); // Position

    processing.directionalLight(
      0,
      102,
      255, // Color
      1,
      0,
      0
    ); // The x-, y-, z-axis direction

    processing.spotLight(
      255,
      255,
      109, // Color
      0,
      40,
      200, // Position
      0,
      -0.5,
      -0.5, // Direction
      PI / 2,
      2
    ); // Angle, concentration

    processing.rotateY(map(mouseX, 0, width, 0, PI));
    processing.rotateX(map(mouseY, 0, height, 0, PI));
    processing.box(150);
  };
}

var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, processingProc);
