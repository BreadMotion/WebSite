let animationCanvas;
let particles = [];
const numParticles = 100;
const maxParticleSize = 8;
const minParticleSize = 2;
const maxSpeed = 2;
const repulsionRadius = 150;
const repulsionStrength = 1;

function setup() {
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
    this.vel = p5.Vector.random2D().mult(
      random(0.5, maxSpeed),
    );
    this.acc = createVector(0, 0);
    this.size = random(minParticleSize, maxParticleSize);
    this.color = color(255, 255, 255, random(50, 150)); // 半透明の白
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    let mouse = createVector(mouseX, mouseY);
    let force = p5.Vector.sub(this.pos, mouse);
    let distance = force.mag();

    if (distance < repulsionRadius) {
      let strength =
        -repulsionStrength / (distance * distance);
      force.setMag(strength);
      this.applyForce(force);
    }

    this.vel.add(this.acc);
    this.vel.limit(maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    if (this.pos.x > width || this.pos.x < 0) {
      this.vel.x *= -1;
    }
    if (this.pos.y > height || this.pos.y < 0) {
      this.vel.y *= -1;
    }

    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  display() {
    noStroke();
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}
