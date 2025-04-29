let font;
let matrix = [];
const characters = "M8B0123456789"; // Modified characters to match screenshot
const fontSize = 15;
let columns;
let rows;
let scanLine = 0;
let time;

function setup() {
  createCanvas(800, 800); // Changed to 800x800

  if (font) {
    textFont(font);
  } else {
    textFont("monospace");
  }
  textSize(fontSize);

  // Calculate grid
  columns = floor(800 / fontSize);
  rows = floor(800 / fontSize);

  // Initialize matrix array
  for (let i = 0; i < rows; i++) {
    matrix[i] = {
      x: random(-500, 0),
      speed: random(1, 3),
      chars: [],
    };
    for (let j = 0; j < columns; j++) {
      matrix[i].chars[j] = characters.charAt(floor(random(characters.length)));
    }
  }
}

function draw() {
  background(0);

  // Calculate time values
  let h = hour();
  let m = minute();
  let s = second();

  // Create clock mask
  let clockMask = createGraphics(800, 800);
  clockMask.background(0);
  clockMask.noFill();
  clockMask.stroke(255);
  clockMask.strokeWeight(30);
  clockMask.circle(400, 400, 600); // Clock outline

  // Draw clock hands on mask
  drawClockHand(clockMask, h % 12, 12, 200);
  drawClockHand(clockMask, m, 60, 250);
  drawClockHand(clockMask, s, 60, 280);

  // Draw matrix characters
  push();
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      if (random(1) > 0.99) {
        matrix[i].chars[j] = characters.charAt(
          floor(random(characters.length))
        );
      }

      let x = (matrix[i].x + j * fontSize) % width;

      // Only draw character if it's within the clock mask
      let pixelColor = clockMask.get(x, i * fontSize);
      if (pixelColor[0] > 0) {
        // If the mask is white at this position
        fill(0, 255, 70);
        if (abs(i * fontSize - scanLine) < fontSize) {
          fill(0, 255, 100);
        }
        text(matrix[i].chars[j], x, i * fontSize);
      }
    }
    matrix[i].x += matrix[i].speed;
  }
  pop();

  // Update scan line
  scanLine += 10;
  if (scanLine > height) scanLine = 0;
}

function drawClockHand(g, value, total, length) {
  let angle = map(value, 0, total, -HALF_PI, TWO_PI - HALF_PI);
  g.push();
  g.translate(400, 400);
  g.rotate(angle);
  g.line(0, 0, 0, -length);
  g.pop();
}

function windowResized() {
  // Keep canvas size fixed at 800x800
  let canvasX = (windowWidth - 800) / 2;
  let canvasY = (windowHeight - 800) / 2;
  canvas.position(canvasX, canvasY);
}
