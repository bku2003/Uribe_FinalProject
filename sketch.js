let font;
let matrix = [];
const characters = "BMMY98C7JI1DB"; // Characters from the reference image
const fontSize = 15;
let columns;
let rows;
const scrollSpeed = 1;

function preload() {
  console.log("Starting font load...");
  loadFont(
    "public/fonts/Web437_Cordata_PPC-21.woff",
    // Success callback
    function (f) {
      console.log("Font loaded successfully!");
      font = f;
    },
    // Error callback
    function (err) {
      console.error("Error loading font:", err);
      // Fallback to a system font if the custom font fails to load
      font = null;
    }
  );
}

function setup() {
  console.log("Setting up sketch...");
  createCanvas(windowWidth, windowHeight);

  // Use the custom font if loaded, otherwise fallback to monospace
  if (font) {
    textFont(font);
  } else {
    textFont("monospace");
    console.log("Using fallback font: monospace");
  }

  textSize(fontSize);
  console.log(`Canvas created: ${width}x${height}`);

  // Calculate number of columns and rows
  columns = floor(width / fontSize);
  rows = floor(height / fontSize);
  console.log(`Grid: ${columns} columns x ${rows} rows`);

  // Initialize matrix array
  for (let i = 0; i < columns; i++) {
    matrix[i] = {
      y: random(-500, 0),
      speed: random(2, 5),
      chars: [],
    };
    for (let j = 0; j < rows; j++) {
      matrix[i].chars[j] = characters.charAt(floor(random(characters.length)));
    }
  }
}

function draw() {
  background(0, 25);

  // Draw matrix rain
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      let y = (matrix[i].y + j * fontSize) % height;
      let alpha = map(j, 0, rows, 255, 50);
      fill(0, 255, 70, alpha);
      text(matrix[i].chars[j], i * fontSize, y);
    }
    matrix[i].y += matrix[i].speed;
  }

  // Draw clock
  drawClock();
}

function drawClock() {
  push();
  translate(width / 2, height / 2);

  // Draw clock circle using characters
  let radius = min(width, height) * 0.3;
  let points = 60;
  let angle = TWO_PI / points;

  for (let i = 0; i < points; i++) {
    let x = cos(angle * i) * radius;
    let y = sin(angle * i) * radius;
    fill(255);
    text(characters.charAt(floor(random(characters.length))), x, y);
  }

  // Calculate time with acceleration
  let time = millis() * 10; // 10x faster
  let s = (time / 1000) % 60;
  let m = (time / 1000 / 60) % 60;
  let h = (time / 1000 / 3600) % 12;

  // Draw hands
  // Hour hand
  push();
  rotate((h * TWO_PI) / 12 + (m * TWO_PI) / (12 * 60));
  stroke(255);
  strokeWeight(4);
  line(0, 0, 0, -radius * 0.5);
  pop();

  // Minute hand
  push();
  rotate((m * TWO_PI) / 60);
  stroke(255);
  strokeWeight(2);
  line(0, 0, 0, -radius * 0.7);
  pop();

  // Second hand
  push();
  rotate((s * TWO_PI) / 60);
  stroke(255, 0, 0);
  strokeWeight(1);
  line(0, 0, 0, -radius * 0.8);
  pop();

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recalculate matrix dimensions
  columns = floor(width / fontSize);
  rows = floor(height / fontSize);

  // Reinitialize matrix array
  matrix = [];
  for (let i = 0; i < columns; i++) {
    matrix[i] = {
      y: random(-500, 0),
      speed: random(2, 5),
      chars: [],
    };
    for (let j = 0; j < rows; j++) {
      matrix[i].chars[j] = characters.charAt(floor(random(characters.length)));
    }
  }
}
