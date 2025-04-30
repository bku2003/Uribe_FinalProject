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
let rgbOffset = 3;      // rgb split effect
let scanlineAlpha = 100;   // scan lines visibile
const NEON_GREEN = [0, 255, 70];
let lastBuffer; 

let realTimeData = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  isApiTime: false
};

function preload() {
  console.log("Loading font...");
  // Change this line to use the correct font file
  font = loadFont('public/fonts/Web437_Cordata_PPC-400.woff');
}

async function fetchPSTTime() {
  try {
    const response = await fetch('http://worldtimeapi.org/api/timezone/America/Los_Angeles');
    if (!response.ok) throw new Error('API response error');
    
    const data = await response.json();
    // Parse the datetime string directly as PST
    const date = new Date(data.datetime);
    
    realTimeData.hours = date.getHours();
    realTimeData.minutes = date.getMinutes();
    realTimeData.seconds = date.getSeconds();
    realTimeData.isApiTime = true;
    updateTimeDisplay();
    console.log('Successfully fetched PST time:', `${realTimeData.hours}:${realTimeData.minutes}`);
  } catch (error) {
    console.error('Failed to fetch PST time, using local time as fallback:', error);
    useFallbackTime();
  }
}

function useFallbackTime() {
  const options = { 
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  };
  
  const pstTime = new Date().toLocaleString('en-US', options);
  const [hours, minutes, seconds] = pstTime.split(':').map(Number);
  
  realTimeData.hours = hours;
  realTimeData.minutes = minutes;
  realTimeData.seconds = seconds;
  realTimeData.isApiTime = false;
  updateTimeDisplay();
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
  
  // initialize mouse tracking
  lastMouseX = mouseX;
  lastMouseAngle = 0;

  // alculate height to fill screen while maintaining aspect ratio
  fetchPSTTime();
  // Update time every minute
  setInterval(fetchPSTTime, 60000);
}

function draw() {
  if (!isAnimating && lastBuffer) {
    image(lastBuffer, 0, 0);
    return;
  }

  background(0);
  
  // bubffahs
  let mainBuffer = createGraphics(800, 800);
  let clockMask = createGraphics(800, 800);
  
  // clock
  clockMask.background(0);
  clockMask.noFill();
  clockMask.stroke(255);
  clockMask.strokeWeight(30);
  
  // center the clock in fixed canvas
  let clockX = 400; // Center X
  let clockY = 400; // Center Y
  let clockSize = 600; // Fixed size for clock
  
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
  drawClockHand(clockMask, mouseAngle, "hour", 200);
  drawClockHand(clockMask, timeOffset, "minute", 250);
  drawClockHand(clockMask, timeOffset * 60, "second", 280);

  // draw everything to main buffer first
  mainBuffer.push();
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      let x = (matrix[i].x + j * fontSize) % width;
      
      let pixelColor = clockMask.get(x, i * fontSize);
      if (pixelColor[0] > 0) {
        // update the matrix character color
        mainBuffer.fill(NEON_GREEN[0], NEON_GREEN[1], NEON_GREEN[2]);
        if (abs(i * fontSize - scanLine) < fontSize) {
          // brighter green on scan line
          mainBuffer.fill(NEON_GREEN[0], NEON_GREEN[1] + 30, NEON_GREEN[2] + 10);
        }
        mainBuffer.textFont(font);
        mainBuffer.textSize(fontSize);
        mainBuffer.text(matrix[i].chars[j], x, i * fontSize);
      }
    }
    // use constant speed instead of mouse-based speed
    matrix[i].x += matrix[i].speed;
  }
  mainBuffer.pop();

  // after all drawing is complete, store the current frame
  lastBuffer = mainBuffer.get();
  
  // draw current frame
  image(mainBuffer, 0, 0);

  // cr tv effects
  // rgb split
  push();
  blendMode(ADD);
  tint(0, 255, 0); // Base green channel
  image(mainBuffer, 0, 0);
  tint(0, 50, 0); // Subtle green ghost
  image(mainBuffer, -rgbOffset, 0);
  image(mainBuffer, rgbOffset, 0);
  pop();
  noTint();

  // scanline effect
  for (let y = 0; y < height; y += 4) {
    stroke(0, scanlineAlpha);
    line(0, y, width, y);
  }
  // CRT vignette
  let vignette = createGraphics(width, height);
  vignette.noFill();
  for (let i = 0; i < 100; i++) {
    let alpha = map(i, 0, 100, 0, 50);
    vignette.stroke(0, alpha);
    vignette.strokeWeight(2);
    vignette.ellipse(width/2, height/2, width-i*5, height-i*5);
  }
  image(vignette, 0, 0);
  scanLine += 10;
  if (scanLine > height) scanLine = 0;
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
    } else { // second hand
      let seconds;
      if (realTimeData.isApiTime) {
        seconds = realTimeData.seconds;
      } else {
        seconds = (second() + (timeOffset * 60)) % 60;
      }
      if (seconds < 0) seconds += 60;
      angle = map(seconds, 0, 60, -HALF_PI, TWO_PI - HALF_PI);
    }
  }
  
  g.push();
  g.translate(400, 400);
  g.rotate(angle);
  g.stroke(255);
  g.strokeWeight(30);
  g.line(0, 0, 0, -length);
  g.pop();
}

function windowResized() {
  // canvas in the center
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canvas.position(x, y);
}

// spacebar to pause and resume
function keyPressed() {
  if (keyCode === 32) { // spacebar
    isAnimating = !isAnimating;
    if (isAnimating) {
      lastBuffer = null;
    }
    return false;
  }
}

function updateTimeDisplay() {
  const timeElement = document.getElementById('pst-time');
  if (timeElement) {
    let hours = realTimeData.hours;
    let ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // If hours is 0, set to 12
    
    // Format the time string
    let timeString = `${hours.toString()}:${realTimeData.minutes.toString().padStart(2, '0')} ${ampm}`;
    timeElement.textContent = timeString;
  }
}
