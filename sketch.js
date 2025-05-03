let font;
let matrix = [];
//let lastMouseX;
// this is where i can change the character size...smaller characters make it run slower tho
const fontSize = 20;
const characters = "INLAND-EMPIRE-BORN-A-TALE-AS-YOUNG-AS-TIME";
let columns;
let rows;
let scanLine = 0;
let trail = [];
const maxTrailLength = 20;
let isAnimating = true;
let lastMouseAngle = 0;
let clockwise = true;
let timeOffset = 0;
// cr tv stuffs
let rgbOffset = 3; // rgb split effect
let scanlineAlpha = 100; // scan lines visibile
const NEON_COLOR = [120, 192, 224]; // Changed from NEON_GREEN to NEON_COLOR with hex #78C0E0 values
let lastBuffer;
// Add stroke effect when paused
let strokeEnabled = false;

let realTimeData = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  isApiTime: false,
};

function preload() {
  console.log("Loading font...");
  // Change this line to use the correct font file
  font = loadFont("public/fonts/Web437_Cordata_PPC-400.woff");
}

async function fetchPSTTime() {
  try {
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/America/Los_Angeles"
    );
    if (!response.ok) throw new Error("API response error");

    const data = await response.json();
    // Parse the datetime string directly as PST
    const date = new Date(data.datetime);

    realTimeData.hours = date.getHours();
    realTimeData.minutes = date.getMinutes();
    realTimeData.seconds = date.getSeconds();
    realTimeData.isApiTime = true;
    updateTimeDisplay();
    console.log(
      "Successfully fetched PST time:",
      `${realTimeData.hours}:${realTimeData.minutes}`
    );
  } catch (error) {
    console.error(
      "Failed to fetch PST time, using local time as fallback:",
      error
    );
    useFallbackTime();
  }
}

function useFallbackTime() {
  const options = {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  const pstTime = new Date().toLocaleString("en-US", options);
  const [hours, minutes, seconds] = pstTime.split(":").map(Number);

  realTimeData.hours = hours;
  realTimeData.minutes = minutes;
  realTimeData.seconds = seconds;
  realTimeData.isApiTime = false;
  updateTimeDisplay();
}

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent("sketch-holder");

  // Force animation to always be on
  isAnimating = true;

  // Update columns calculation for current width
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

  // initialize mouse tracking
  lastMouseX = mouseX;
  lastMouseAngle = 0;

  // Calculate height to fill screen while maintaining aspect ratio
  fetchPSTTime();
  // Update time every minute
  setInterval(fetchPSTTime, 60000);

  // Create persistent buffers once instead of in every draw call
  lastBuffer = createGraphics(800, 800);
  mainBuffer = createGraphics(800, 800);
  clockMask = createGraphics(800, 800);
  vignette = createGraphics(width, height);

  // Pre-render the vignette effect since it doesn't change
  vignette.noFill();
  for (let i = 0; i < 100; i++) {
    let alpha = map(i, 0, 100, 0, 50);
    vignette.stroke(0, alpha);
    vignette.strokeWeight(2);
    vignette.ellipse(width / 2, height / 2, width - i * 5, height - i * 5);
  }
}

// Add these as global variables
let mainBuffer, clockMask, vignette;

function draw() {
  // Check if animation is paused
  if (!isAnimating) {
    // When paused, just draw the current frame with stroke effect
    background(0);

    // Clear the buffer for clean rendering
    mainBuffer.clear();

    // Draw the clock mask as usual
    clockMask.clear();
    clockMask.background(0);
    clockMask.noFill();
    clockMask.stroke(255);
    clockMask.strokeWeight(30);

    let clockX = width / 2;
    let clockY = height / 2;
    let clockSize = min(width, height) * 0.75;

    clockMask.circle(clockX, clockY, clockSize);

    // Draw the clock hands in their current position
    drawClockHand(clockMask, lastMouseAngle, "hour", clockSize * 0.33);
    drawClockHand(clockMask, timeOffset, "minute", clockSize * 0.42);
    drawClockHand(clockMask, timeOffset * 60, "second", clockSize * 0.47);

    // Draw just the current state of the characters with stroke
    mainBuffer.push();
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        let x = (matrix[i].x + j * fontSize) % width;

        // Only process characters that are visible on screen
        if (x >= 0 && x < width) {
          let pixelColor = clockMask.get(x, i * fontSize);
          if (pixelColor[0] > 0) {
            // Apply character with stroke effect
            mainBuffer.fill(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);
            mainBuffer.stroke(
              NEON_COLOR[0],
              NEON_COLOR[1] - 50,
              NEON_COLOR[2] - 30
            );
            mainBuffer.strokeWeight(1);

            mainBuffer.textFont(font);
            mainBuffer.textSize(fontSize);
            mainBuffer.text(matrix[i].chars[j], x, i * fontSize);
          }
        }
      }
    }
    mainBuffer.pop();

    // Draw the current buffer
    image(mainBuffer, 0, 0);

    // Apply CRT effects
    push();
    blendMode(ADD);
    tint(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]); // Base color channel
    image(mainBuffer, 0, 0);
    tint(NEON_COLOR[0] / 6, NEON_COLOR[1] / 6, NEON_COLOR[2] / 6); // Subtle color ghost
    image(mainBuffer, -rgbOffset, 0);
    image(mainBuffer, rgbOffset, 0);
    pop();
    noTint();

    // Apply scanlines and vignette
    for (let y = 0; y < height; y += 4) {
      stroke(0, scanlineAlpha);
      line(0, y, width, y);
    }

    image(vignette, 0, 0);

    return;
  }

  background(0);

  // Clear the buffers instead of recreating them
  mainBuffer.clear();
  clockMask.clear();

  // Reset clock mask background
  clockMask.background(0);
  clockMask.noFill();
  clockMask.stroke(255);
  clockMask.strokeWeight(30);

  // center the clock in fixed canvas
  let clockX = width / 2; // Center X - this makes it responsive
  let clockY = height / 2; // Center Y - this makes it responsive
  let clockSize = min(width, height) * 0.75; // Scale to canvas size

  clockMask.circle(clockX, clockY, clockSize);

  // update mouse angle calculation to use centered coordinates
  let mouseAngle = atan2(mouseY - clockY, mouseX - clockX);
  let angleDiff = mouseAngle - lastMouseAngle;

  // normalize angle difference to determine direction
  if (angleDiff !== 0) {
    // adjust for angle wrap-around
    if (angleDiff > PI) angleDiff -= TWO_PI;
    if (angleDiff < -PI) angleDiff += TWO_PI;
    clockwise = angleDiff > 0;

    // dpdate time offset based on movement
    timeOffset += clockwise ? 1 : -1;
  }
  lastMouseAngle = mouseAngle;

  // draw clock hands with direction awareness
  drawClockHand(clockMask, mouseAngle, "hour", clockSize * 0.33);
  drawClockHand(clockMask, timeOffset, "minute", clockSize * 0.42);
  drawClockHand(clockMask, timeOffset * 60, "second", clockSize * 0.47);

  // draw everything to main buffer first
  mainBuffer.push();
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      let x = (matrix[i].x + j * fontSize) % width;

      // Only process characters that are visible on screen
      if (x >= 0 && x < width) {
        let pixelColor = clockMask.get(x, i * fontSize);
        if (pixelColor[0] > 0) {
          // update the matrix character color
          mainBuffer.fill(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);
          // Apply stroke effect when paused
          if (!isAnimating) {
            mainBuffer.stroke(
              NEON_COLOR[0],
              NEON_COLOR[1] - 50,
              NEON_COLOR[2] - 30
            );
            mainBuffer.strokeWeight(1);
          } else {
            mainBuffer.noStroke();
          }

          if (abs(i * fontSize - scanLine) < fontSize) {
            // brighter blue on scan line
            mainBuffer.fill(
              NEON_COLOR[0],
              NEON_COLOR[1] + 30,
              NEON_COLOR[2] + 10
            );
          }
          mainBuffer.textFont(font);
          mainBuffer.textSize(fontSize);
          mainBuffer.text(matrix[i].chars[j], x, i * fontSize);
        }
      }
    }
    // Only update positions if animating
    if (isAnimating) {
      // use constant speed instead of mouse-based speed
      matrix[i].x += matrix[i].speed;
    }
  }
  mainBuffer.pop();

  // after all drawing is complete, store the current frame
  lastBuffer.copy(mainBuffer, 0, 0, width, height, 0, 0, width, height);

  // draw current frame
  image(mainBuffer, 0, 0);

  // cr tv effects
  // rgb split
  push();
  blendMode(ADD);
  tint(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]); // Base color channel
  image(mainBuffer, 0, 0);
  tint(NEON_COLOR[0] / 6, NEON_COLOR[1] / 6, NEON_COLOR[2] / 6); // Subtle color ghost
  image(mainBuffer, -rgbOffset, 0);
  image(mainBuffer, rgbOffset, 0);
  pop();
  noTint();

  // scanline effect
  for (let y = 0; y < height; y += 4) {
    stroke(0, scanlineAlpha);
    line(0, y, width, y);
  }

  // Add pre-rendered vignette
  image(vignette, 0, 0);

  scanLine += 10;
  if (scanLine > height) scanLine = 0;

  // Frame rate limiting to reduce CPU usage
  if (frameCount % 30 === 0) {
    console.log("FPS:", frameRate());
  }
}

// drawClockHand function to use the same center point
function drawClockHand(g, value, type, length) {
  let angle;

  if (type === "hour") {
    angle = value;
  } else {
    if (type === "minute") {
      let minutes;
      if (realTimeData.isApiTime) {
        minutes = realTimeData.minutes;
      } else {
        minutes = (minute() + timeOffset) % 60;
      }
      if (minutes < 0) minutes += 60;
      angle = map(minutes, 0, 60, -HALF_PI, TWO_PI - HALF_PI);
    } else {
      // second hand
      let seconds;
      if (realTimeData.isApiTime) {
        seconds = realTimeData.seconds;
      } else {
        seconds = (second() + timeOffset * 60) % 60;
      }
      if (seconds < 0) seconds += 60;
      angle = map(seconds, 0, 60, -HALF_PI, TWO_PI - HALF_PI);
    }
  }

  g.push();
  g.translate(width / 2, height / 2); // Use canvas dimensions instead of fixed values
  g.rotate(angle);
  g.stroke(255);
  g.strokeWeight(30);
  g.line(0, 0, 0, -length);
  g.pop();
}

// This function gets called by the resize observer in index.html
function resizeCanvas(w, h) {
  if (w !== width || h !== height) {
    // Use p5's resizeCanvas instead of calling itself recursively
    // The issue was using the same function name as p5's built-in function
    p5.prototype.resizeCanvas.call(window, w, h);

    // Recalculate columns and rows
    columns = floor(width / fontSize);
    rows = floor(height / fontSize);

    // Recreate buffers at new size
    lastBuffer = createGraphics(width, height);
    mainBuffer = createGraphics(width, height);
    clockMask = createGraphics(width, height);
    vignette = createGraphics(width, height);

    // Re-render vignette
    vignette.noFill();
    for (let i = 0; i < 100; i++) {
      let alpha = map(i, 0, 100, 0, 50);
      vignette.stroke(0, alpha);
      vignette.strokeWeight(2);
      vignette.ellipse(width / 2, height / 2, width - i * 5, height - i * 5);
    }

    console.log("Canvas resized to", w, "x", h);
  }
}

// Add this function to replace the current windowResized
function windowResized() {
  // Simple handler that relies on ResizeObserver in index.html
  console.log("Window resized event detected");
}

// Uncomment the keyPressed function to handle spacebar
function keyPressed() {
  if (keyCode === 32) {
    // spacebar
    isAnimating = !isAnimating;

    // Draw a new frame with strokes applied when paused
    if (!isAnimating) {
      redraw(); // Force a redraw to capture the frame with strokes
    }
    return false;
  }
}

function updateTimeDisplay() {
  const timeElement = document.getElementById("pst-time");
  if (timeElement) {
    let hours = realTimeData.hours;
    let ampm = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // If hours is 0, set to 12

    // Format the time string
    let timeString = `${hours.toString()}:${realTimeData.minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
    timeElement.textContent = timeString;
  }
}
