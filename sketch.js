let font;
let matrix = [];
// ADJUST CHARACTER SIZE HERE (try 15-30)
const fontSize = 15; 
const characters = "ATAYAT-001-001-001";
let columns;
let rows;
let scanLine = 0;
let trail = [];
const maxTrailLength = 20;
let isAnimating = true;
let lastMouseX = 0;
let mouseSpeed = 0;
// CRT effect parameters
let rgbOffset = 1.5; // ADJUST RGB SHIFT AMOUNT HERE
let scanlineAlpha = 50; // ADJUST SCANLINE INTENSITY HERE
const NEON_GREEN = [0, 255, 70]; // RGB values for neon green

function preload() {
  console.log("Loading font...");
  font = loadFont('public/fonts/Web437_Cordata_PPC-21.woff');
}

function setup() {
  createCanvas(800, 800);

  if (font) {
    console.log("Font loaded successfully");
    textFont(font);
  } else {
    console.warn("Font failed to load, using monospace fallback");
    textFont("monospace");
  }
  textSize(fontSize);

  columns = floor(800 / fontSize);
  rows = floor(800 / fontSize);

  // Initialize matrix array with fixed pattern
  for (let i = 0; i < rows; i++) {
    matrix[i] = {
      x: random(-500, 0),
      speed: random(1, 3),
      chars: [],
    };
    for (let j = 0; j < columns; j++) {
      // Use characters in sequence instead of random
      matrix[i].chars[j] = characters[j % characters.length];
    }
  }
  lastMouseX = mouseX;
}

function draw() {
  // Calculate mouse speed
  let currentMouseSpeed = abs(mouseX - lastMouseX);
  mouseSpeed = lerp(mouseSpeed, currentMouseSpeed, 0.1); // Smooth the speed
  lastMouseX = mouseX;

  if (!isAnimating) {
    return; // Stop all animation if isAnimating is false
  }

  background(0);

  // Create main graphics buffer
  let mainBuffer = createGraphics(width, height);
  mainBuffer.background(0);

  // Create clock mask
  let clockMask = createGraphics(width, height);
  clockMask.background(0);
  clockMask.noFill();
  clockMask.stroke(255);
  clockMask.strokeWeight(30);
  clockMask.circle(400, 400, 600);

  // Draw clock hands on mask
  // Draw hour hand (follows mouse exactly)
  let mouseAngle = atan2(mouseY - 400, mouseX - 400);
  clockMask.push();
  clockMask.translate(400, 400);
  clockMask.stroke(255);
  clockMask.strokeWeight(4); // Thicker for hour hand
  clockMask.line(0, 0, cos(mouseAngle) * 200, sin(mouseAngle) * 200);
  clockMask.pop();

  // Draw minute hand (inverse of mouse)
  let inverseAngle = mouseAngle + PI;
  clockMask.push();
  clockMask.translate(400, 400);
  clockMask.stroke(255);
  clockMask.strokeWeight(2);
  clockMask.line(0, 0, cos(inverseAngle) * 250, sin(inverseAngle) * 250);
  clockMask.pop();

  // Update trail array with inverse angle positions
  trail.unshift({
    x: cos(inverseAngle) * 250,
    y: sin(inverseAngle) * 250
  });
  if (trail.length > maxTrailLength) {
    trail.pop();
  }

  // Draw second hand
  let s = second();
  drawClockHand(clockMask, s, 60, 280);

  // Draw everything to main buffer first
  mainBuffer.push();
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      let x = (matrix[i].x + j * fontSize) % width;
      
      let pixelColor = clockMask.get(x, i * fontSize);
      if (pixelColor[0] > 0) {
        // Update the matrix character color
        mainBuffer.fill(NEON_GREEN[0], NEON_GREEN[1], NEON_GREEN[2]);
        if (abs(i * fontSize - scanLine) < fontSize) {
          mainBuffer.fill(NEON_GREEN[0], NEON_GREEN[1] + 30, NEON_GREEN[2]); // Slightly brighter on scan line
        }
        mainBuffer.textSize(fontSize);
        mainBuffer.text(matrix[i].chars[j], x, i * fontSize);
      }
    }
    let speed = map(mouseSpeed, 0, 50, 0.5, 5);
    matrix[i].x += speed;
  }
  mainBuffer.pop();

  // Apply CRT effects
  // RGB Split effect
  tint(255, 0, 0); // Red channel
  image(mainBuffer, -rgbOffset, 0);
  tint(0, 255, 0); // Green channel
  image(mainBuffer, 0, 0);
  tint(0, 0, 255); // Blue channel
  image(mainBuffer, rgbOffset, 0);
  noTint();

  // Scanline effect
  for (let y = 0; y < height; y += 4) {
    stroke(0, scanlineAlpha);
    line(0, y, width, y);
  }

  // CRT vignette effect
  let vignette = createGraphics(width, height);
  vignette.noFill();
  for (let i = 0; i < 100; i++) {
    let alpha = map(i, 0, 100, 0, 50);
    vignette.stroke(0, alpha);
    vignette.strokeWeight(2);
    vignette.ellipse(width/2, height/2, width-i*5, height-i*5);
  }
  image(vignette, 0, 0);

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

// Add keyPressed function to handle space bar
function keyPressed() {
  if (keyCode === 32) {
    // 32 is the keyCode for spacebar
    isAnimating = !isAnimating;
  }
}
