let font;
let matrix = [];
let lastMouseX;
// ADJUST CHARACTER SIZE HERE (try 15-30)
const fontSize = 25; 
const characters = "ATAYAT-001-001-001";
let columns;
let rows;
let scanLine = 0;
let trail = [];
const maxTrailLength = 20;
let isAnimating = true;
let lastMouseAngle = 0;
let clockwise = true;
let timeOffset = 0;

// CRT effect parameters
let rgbOffset = 3;      // Increase to make RGB split more pronounced (try 2.0-3.0)
let scanlineAlpha = 100;   // Increase for more visible scanlines (try 70-100)
const NEON_GREEN = [0, 255, 70];

// Add this with other global variables at the top
let lastBuffer; 

function preload() {
  console.log("Loading font...");
  font = loadFont('public/fonts/Web437_Cordata_PPC-21.woff');
}

function setup() {
  let canvas = createCanvas(800, 800); // Fixed size instead of full width
  canvas.parent('sketch-holder');
  
  // Update columns calculation for fixed width
  columns = floor(width / fontSize);
  rows = floor(height / fontSize);

  // Initialize matrix array
  for (let i = 0; i < rows; i++) {
    matrix[i] = {
      x: random(-500, 0),
      speed: random(0.2, 0.8), // Reduced from random(1, 3) to slower values
      chars: [],
    };
    for (let j = 0; j < columns; j++) {
      matrix[i].chars[j] = characters[j % characters.length];
    }
  }
  
  // Initialize mouse tracking
  lastMouseX = mouseX;
  lastMouseAngle = 0;

  // Calculate height to fill screen while maintaining aspect ratio
}

function draw() {
  if (!isAnimating && lastBuffer) {
    // If paused, just show the last frame
    image(lastBuffer, 0, 0);
    return;
  }

  background(0);
  
  // Create buffers with fixed size
  let mainBuffer = createGraphics(800, 800);
  let clockMask = createGraphics(800, 800);
  
  // Setup clock mask
  clockMask.background(0);
  clockMask.noFill();
  clockMask.stroke(255);
  clockMask.strokeWeight(30);
  
  // Center the clock in the fixed canvas
  let clockX = 400; // Center X
  let clockY = 400; // Center Y
  let clockSize = 600; // Fixed size for clock
  
  clockMask.circle(clockX, clockY, clockSize);

  // Update mouse angle calculation to use centered coordinates
  let mouseAngle = atan2(mouseY - clockY, mouseX - clockX);
  let angleDiff = mouseAngle - lastMouseAngle;
  
  // Normalize angle difference to determine direction
  if (angleDiff !== 0) {
    // Adjust for angle wrap-around
    if (angleDiff > PI) angleDiff -= TWO_PI;
    if (angleDiff < -PI) angleDiff += TWO_PI;
    clockwise = angleDiff > 0;
    
    // Update time offset based on movement
    timeOffset += clockwise ? 1 : -1;
  }
  lastMouseAngle = mouseAngle;

  // Draw clock hands with direction awareness
  drawClockHand(clockMask, mouseAngle, "hour", 200);
  drawClockHand(clockMask, timeOffset, "minute", 250);
  drawClockHand(clockMask, timeOffset * 60, "second", 280);

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
          // Brighter green on scan line
          mainBuffer.fill(NEON_GREEN[0], NEON_GREEN[1] + 30, NEON_GREEN[2] + 10);
        }
        mainBuffer.textFont(font);
        mainBuffer.textSize(fontSize);
        mainBuffer.text(matrix[i].chars[j], x, i * fontSize);
      }
    }
    // Use constant speed instead of mouse-based speed
    matrix[i].x += matrix[i].speed;
  }
  mainBuffer.pop();

  // After all drawing is complete, store the current frame
  lastBuffer = mainBuffer.get();
  
  // Draw the current frame
  image(mainBuffer, 0, 0);

  // Apply CRT effects
  // RGB Split effect with maintained green color
  push();
  blendMode(ADD);
  tint(0, 255, 0); // Base green channel
  image(mainBuffer, 0, 0);
  tint(0, 50, 0); // Subtle green ghost
  image(mainBuffer, -rgbOffset, 0);
  image(mainBuffer, rgbOffset, 0);
  pop();
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

// Update drawClockHand function to use the same center point
function drawClockHand(g, value, type, length) {
  let angle;
  let now = new Date();
  
  if (type === "hour") {
    angle = value;
  } else {
    // Calculate time-based position including offset
    if (type === "minute") {
      let minutes = (minute() + timeOffset) % 60;
      if (minutes < 0) minutes += 60;
      angle = map(minutes, 0, 60, -HALF_PI, TWO_PI - HALF_PI);
    } else { // second hand
      let seconds = (second() + (timeOffset * 60)) % 60;
      if (seconds < 0) seconds += 60;
      angle = map(seconds, 0, 60, -HALF_PI, TWO_PI - HALF_PI);
    }
  }
  
  g.push();
  g.translate(400, 400); // Use same center point as clock
  g.rotate(angle);
  g.stroke(255);
  g.strokeWeight(30);
  g.line(0, 0, 0, -length);
  g.pop();
}

function windowResized() {
  // Don't resize canvas, just recenter it
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canvas.position(x, y);
}

// Update keyPressed function
function keyPressed() {
  if (keyCode === 32) { // spacebar
    isAnimating = !isAnimating;
    if (isAnimating) {
      // Clear the stored buffer when resuming
      lastBuffer = null;
    }
    return false; // Prevent default space bar behavior
  }
}
