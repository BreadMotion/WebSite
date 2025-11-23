let animationCanvas;
let circleSize = 0;
let growing = true;

function setup() {
  const parent = document.getElementById(
    "menuAnimationCanvas",
  ).parentElement;
  animationCanvas = createCanvas(
    parent.offsetWidth,
    parent.offsetHeight,
  );
  animationCanvas.parent("menuAnimationCanvas");
  background(22, 27, 34); // 背景色を一度だけ設定
}

function draw() {
  background(22, 27, 34, 50);
  noStroke();
  fill(255, 255, 255, 150);

  if (growing) {
    circleSize += 0.5;
    if (circleSize > 50) {
      growing = false;
    }
  } else {
    circleSize -= 0.5;
    if (circleSize < 10) {
      growing = true;
    }
  }
  ellipse(width / 2, height / 2, circleSize, circleSize);

  fill(255, 255, 255, 80);
  ellipse(mouseX, mouseY, 15, 15);
}

function windowResized() {
  const parent = document.getElementById(
    "menuAnimationCanvas",
  ).parentElement;
  resizeCanvas(parent.offsetWidth, parent.offsetHeight);
}
