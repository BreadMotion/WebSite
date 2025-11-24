let animationCanvas;
let particles = [];
const numParticles = 1000;
const maxParticleSize = 8;
const minParticleSize = 2;
const maxSpeed = 10;
const repulsionRadius = 250;
const repulsionStrength = 20;

let isMouseInsideBrowserWindow = false;

function setup() {
  // ページの全体の高さを取得
  let pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight,
  );

  animationCanvas = createCanvas(windowWidth, pageHeight);
  animationCanvas.position(0, 0);
  animationCanvas.style("z-index", "-1");
  animationCanvas.style("pointer-events", "none");

  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  clear();

  for (let particle of particles) {
    particle.update();
    particle.display();
  }
}

function windowResized() {
  let pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight,
  );
  resizeCanvas(windowWidth, pageHeight);
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.origPos = createVector(this.pos.x, this.pos.y);
    this.vel = p5.Vector.random2D().mult(random(0.1, 1));
    this.acc = createVector(0, 0);
    this.size = random(minParticleSize, maxParticleSize);
    this.color = color(255, 255, 255, random(50, 150));
    this.mass = random(0.5, 1.5);
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  update() {
    if (isMouseInsideBrowserWindow) {
      let mouse = createVector(mouseX, mouseY);
      let force = p5.Vector.sub(this.pos, mouse);
      let distance = force.mag();
      let toOrigPos = p5.Vector.sub(this.origPos, this.pos);
      this.vel.add(toOrigPos.mult(0.0001));
      if (distance < repulsionRadius) {
        distance = max(distance, 5);
        let strength = -repulsionStrength / distance;
        force.setMag(strength);
        this.applyForce(force);
      }

      this.vel.add(this.acc);
      this.vel.mult(0.97);
      this.vel.limit(maxSpeed);
    }
    this.pos.add(this.vel);
    this.acc.mult(0);

    if (
      this.pos.x > width - this.size / 2 ||
      this.pos.x < this.size / 2
    ) {
      this.vel.x *= -1;
      if (this.pos.x > width - this.size / 2)
        this.pos.x = width - this.size / 2;
      if (this.pos.x < this.size / 2)
        this.pos.x = this.size / 2;
    }
    if (
      this.pos.y > height - this.size / 2 ||
      this.pos.y < this.size / 2
    ) {
      this.vel.y *= -1;
      if (this.pos.y > height - this.size / 2)
        this.pos.y = height - this.size / 2;
      if (this.pos.y < this.size / 2)
        this.pos.y = this.size / 2;
    }
  }

  display() {
    noStroke();
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

window.addEventListener("load", () => {
  document.body.addEventListener("mouseenter", () => {
    isMouseInsideBrowserWindow = true;
  });
  document.body.addEventListener("mouseleave", () => {
    isMouseInsideBrowserWindow = false;
  });
});
