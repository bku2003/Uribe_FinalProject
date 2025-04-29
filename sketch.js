let font;
let matrix = [];
const characters = "ATAYAT-001-001-001";
const fontSize = 15;
let columns;
let rows;
let scanLine = 0; // Add scanline tracking

function setup() {
  // Create fixed size canvas
  createCanvas(900, 900);
  
  if (font) {
    textFont(font);
  } else {
    textFont("monospace");
  }
  textSize(fontSize);

  // Calculate grid
  columns = floor(900 / fontSize);
  rows = floor(900 / fontSize);

  // Initialize matrix array - modified for horizontal movement
  for (let i = 0; i < rows; i++) {
    matrix[i] = {
      x: random(-500, 0), // Use x instead of y
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

  // Draw matrix characters
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      // Add blinking effect
      if (random(1) > 0.99) {
        matrix[i].chars[j] = characters.charAt(floor(random(characters.length)));
      }
      
      // Calculate x position with movement
      let x = (matrix[i].x + j * fontSize) % width;
      
      // Basic character color
      fill(0, 255, 70);
      
      // Add CRT scan line effect
      if (abs(i * fontSize - scanLine) < fontSize) {
        fill(0, 255, 100); // Brighter on scan line
      }
      
      text(matrix[i].chars[j], x, i * fontSize);
    }
    // Move horizontally
    matrix[i].x += matrix[i].speed;
  }

  // Update scan line
  scanLine += 10;
  if (scanLine > height) scanLine = 0;

  // Draw subtle scan line overlay
  stroke(255, 255, 255, 10);
  line(0, scanLine, width, scanLine);

  // Draw clock on top
  drawClock();
}

// Update windowResized function for fixed canvas
function windowResized() {
  // Remove resizeCanvas call since we want fixed size
  // Just reinitialize matrix if needed
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
