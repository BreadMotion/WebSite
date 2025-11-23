let animationCanvas;

function setup() {
  const parent = document.getElementById(
    "menuAnimationCanvas",
  ).parentElement;
  animationCanvas = createCanvas(
    parent.offsetWidth,
    parent.offsetHeight,
  );
  animationCanvas.parent("menuAnimationCanvas");
  background(22, 27, 34);
}

function draw() {
  noStroke();
  fill(255, 255, 255, 50);
  ellipse(random(width), random(height), 10, 10);
}

function windowResized() {
  const parent = document.getElementById(
    "menuAnimationCanvas",
  ).parentElement;
  resizeCanvas(parent.offsetWidth, parent.offsetHeight);
}
