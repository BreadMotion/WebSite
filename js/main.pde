Eye e1, e2, e3;

void setup() {
  size(640, 360);
  surface.setResizable(true);
  
  noStroke();
  e1 = new Eye( 250,  16, 120);
  e2 = new Eye( 164, 185,  80);  
  e3 = new Eye( 420, 230, 220);
}

int PWidth = 640;
int PHeight = 360;
float ScaleW = 1.0;
float ScaleH = 1.0;

void draw() throws IllegalArgumentException {
  if(PWidth != width || PHeight!=height){
    ScaleW *= (float)width / PWidth;
    ScaleH *= (float)height / PHeight;
    PWidth = width;
    PHeight = height;
  }

  scale(ScaleW,ScaleH);

  background(102);
  
  e1.update(mouseX, mouseY);
  e2.update(mouseX, mouseY);
  e3.update(mouseX, mouseY);

  e1.display();
  e2.display();
  e3.display();
}

class Eye {
  int x, y;
  int size;
  float angle = 0.0;
  
  Eye(int tx, int ty, int ts) {
    x = tx;
    y = ty;
    size = ts;
 }

  void update(int mx, int my) {
    angle = atan2(my-y, mx-x);
  }
  
  void display() {
    pushMatrix();
    translate(x, y);
    fill(255);
    ellipse(0, 0, size, size);
    rotate(angle);
    fill(153, 204, 0);
    ellipse(size/4, 0, size/2, size/2);
    popMatrix();
  }
}