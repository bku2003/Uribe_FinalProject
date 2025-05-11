let font;
let matrix = [];
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
const NEON_COLOR = [120, 192, 224]; // Using blue color from your current file
let lastBuffer;
let mainBuffer, clockMask, vignette;

let realTimeData = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  isApiTime: false,
};

function preload() {
  console.log("Loading font...");
  font = loadFont("public/fonts/Web437_Cordata_PPC-400.woff");
}

async function fetchPSTTime() {
  try {
    let apiUrl = "https://worldtimeapi.org/api/timezone/America/Los_Angeles";
    console.log("trying to get time from: " + apiUrl);
    var apiResponse = await fetch(apiUrl);
    if (apiResponse.ok != true) {
      console.log("API isnt working");
      throw new Error("API error");
    }
    let jsonData = await apiResponse.json();
    let timeString = jsonData.datetime;
    console.log("got raw data: " + timeString);
    var dateObj = new Date(timeString);
    let hour = dateObj.getHours();
    let min = dateObj.getMinutes();
    let sec = dateObj.getSeconds();
    realTimeData.hours = hour;
    realTimeData.minutes = min;
    realTimeData.seconds = sec;
    realTimeData.isApiTime = true;
    updateTimeDisplay();
    console.log("fetched PST time:", `${hour}:${min}:${sec}`);
  } catch (error) {
    console.error(
      "failed to fetch PST time, using local time as fallback:",
      error
    );
    useFallbackTime();
  }
}

function useFallbackTime() {
  try {
    const options = {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    };
    const pstTime = new Date().toLocaleString("en-US", options);
    const timeParts = pstTime.split(":");
    realTimeData.hours = parseInt(timeParts[0]);
    realTimeData.minutes = parseInt(timeParts[1]);
    realTimeData.seconds = parseInt(timeParts[2]);
  } catch (error) {
    const now = new Date();
    realTimeData.hours = now.getHours();
    realTimeData.minutes = now.getMinutes();
    realTimeData.seconds = now.getSeconds();
  }

  realTimeData.isApiTime = false;
  updateTimeDisplay();
}

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent("sketch-holder");

  columns = floor(width / fontSize);
  rows = floor(height / fontSize);

  for (let i = 0; i < rows; i++) {
    matrix[i] = {
      x: random(-500, 0),
      speed: random(0.2, 0.8),
      chars: [],
    };
    for (let j = 0; j < columns; j++) {
      matrix[i].chars[j] = characters[j % characters.length];
    }
  }

  lastMouseAngle = 0;
  fetchPSTTime();
  setInterval(fetchPSTTime, 60000);

  // Create persistent graphics buffers
  lastBuffer = createGraphics(width, height);
  mainBuffer = createGraphics(width, height);
  clockMask = createGraphics(width, height);
  vignette = createGraphics(width, height);

  // Pre-render vignette effect since it doesn't change
  vignette.noFill();
  for (let i = 0; i < 100; i++) {
    let alpha = map(i, 0, 100, 0, 50);
    vignette.stroke(0, alpha);
    vignette.strokeWeight(2);
    vignette.ellipse(width / 2, height / 2, width - i * 5, height - i * 5);
  }
}

function draw() {
  if (!isAnimating && lastBuffer) {
    image(lastBuffer, 0, 0);
    return;
  }
  background(0);

  mainBuffer.clear();
  clockMask.clear();

  //___________________________________start github copilot (claude 3.5) use__________________
  // create the clock mask - this is like a separate canvas for the clock stuff
  clockMask.background(0); // fill everything with black first
  clockMask.noFill(); // we just want outlines, no filling in shapes
  clockMask.stroke(255); // make the lines white
  clockMask.strokeWeight(30); // nice thick lines for the clock

  // set up where our clock will be and how big
  let clockX = 400; // center x position
  let clockY = 400; // center y position
  let clockSize = 600; // how big the clock is

  // draw the clock's circle
  clockMask.circle(clockX, clockY, clockSize);

  // figure out where the mouse is pointing from the center
  let mouseAngle = atan2(mouseY - clockY, mouseX - clockX);

  // check if the mouse moved to a different angle
  let angleDiff = mouseAngle - lastMouseAngle;

  // handle when the mouse moves around the clock
  if (angleDiff !== 0) {
    // only do stuff if the angle changed
    // fix weird angle jumps when crossing the back of the circle
    if (angleDiff > PI) angleDiff -= TWO_PI; // smooth out the transition
    if (angleDiff < -PI) angleDiff += TWO_PI; // when going around the back

    // figure out which way we're rotating
    clockwise = angleDiff > 0; // going positive means clockwise

    // update time based on which way we're going
    timeOffset += clockwise ? 1 : -1; // add or subtract time
  }
  // remember where the mouse was for next time
  lastMouseAngle = mouseAngle;

  // draw all the clock hands
  drawClockHand(clockMask, mouseAngle, "hour", 200); // hour hand follows the mouse
  drawClockHand(clockMask, timeOffset, "minute", 250); // minute hand based on our time counter
  drawClockHand(clockMask, timeOffset * 60, "second", 280); // second hand moves way faster

  // start a new drawing state so we don't mess up other stuff
  mainBuffer.push();

  // loop through all the rows of matrix characters
  for (let i = 0; i < rows; i++) {
    // go through each character in this row
    for (let j = 0; j < columns; j++) {
      // figure out where this character should be (wrapping around the screen)
      let x = (matrix[i].x + j * fontSize) % width;

      // check if this spot has clock stuff in it
      let pixelColor = clockMask.get(x, i * fontSize);

      // only show characters where the clock is visible
      if (pixelColor[0] > 0) {
        // make characters our neon color
        mainBuffer.fill(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);

        // make characters pop when they hit the scan line
        if (abs(i * fontSize - scanLine) < fontSize) {
          mainBuffer.fill(
            NEON_COLOR[0],
            NEON_COLOR[1] + 30,
            NEON_COLOR[2] + 10
          );
        }

        // use our matrix font
        mainBuffer.textFont(font);
        mainBuffer.textSize(fontSize);

        // draw the actual character
        mainBuffer.text(matrix[i].chars[j], x, i * fontSize);
      }
    }

    // move the characters down for next frame
    matrix[i].x += matrix[i].speed;
  }

  // clean up our drawing state
  mainBuffer.pop();
  //___________________________________end of using github copilot__________________

  lastBuffer = mainBuffer.get();

  image(mainBuffer, 0, 0);

  // Apply CRT effects
  push();
  blendMode(ADD);
  tint(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);
  image(mainBuffer, 0, 0);
  tint(NEON_COLOR[0] / 6, NEON_COLOR[1] / 6, NEON_COLOR[2] / 6);
  image(mainBuffer, -rgbOffset, 0);
  image(mainBuffer, rgbOffset, 0);
  pop();
  noTint();

  // scan
  for (let y = 0; y < height; y += 4) {
    stroke(0, scanlineAlpha);
    line(0, y, width, y);
  }

  // Apply vignette effect
  image(vignette, 0, 0);

  scanLine += 10;
  if (scanLine > height) scanLine = 0;

  updateTimeDisplay();
}

function drawClockHand(g, value, type, length) {
  var angle;
  if (type === "hour") {
    angle = value;
  } else {
    if (type === "minute") {
      let minutes;
      if (realTimeData.isApiTime == true) {
        minutes = realTimeData.minutes;
      } else {
        minutes = (minute() + timeOffset) % 60;
      }
      if (minutes < 0) {
        minutes = minutes + 60;
      }
      angle = map(minutes, 0, 60, -HALF_PI, TWO_PI - HALF_PI);
    } else {
      let seconds;
      if (realTimeData.isApiTime == true) {
        seconds = realTimeData.seconds;
      } else {
        seconds = (second() + timeOffset * 60) % 60;
      }
      if (seconds < 0) {
        seconds = seconds + 60;
      }
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

function keyPressed() {
  if (keyCode === 32) {
    // spacebar
    isAnimating = !isAnimating;
    if (isAnimating) {
      lastBuffer = null;
    }
    return false;
  }
}

function updateTimeDisplay() {
  var timeElement = document.getElementById("pst-time");
  if (timeElement != null) {
    var hours = realTimeData.hours;
    var ampm;
    if (hours >= 12) {
      ampm = "PM";
    } else {
      ampm = "AM";
    }
    hours = hours % 12;
    if (hours == 0) {
      hours = 12;
    }
    var minutes = realTimeData.minutes;
    var minutesStr;
    if (minutes < 10) {
      minutesStr = "0" + minutes.toString();
    } else {
      minutesStr = minutes.toString();
    }
    var timeString = hours.toString() + ":" + minutesStr + " " + ampm;
    timeElement.textContent = timeString;
  }
}

function resizeCanvas(w, h) {
  if (w !== width || h !== height) {
    p5.prototype.resizeCanvas.call(window, w, h);

    columns = floor(width / fontSize);
    rows = floor(height / fontSize);

    lastBuffer = createGraphics(width, height);
    mainBuffer = createGraphics(width, height);
    clockMask = createGraphics(width, height);
    vignette = createGraphics(width, height);

    vignette.noFill();
    for (let i = 0; i < 100; i++) {
      let alpha = map(i, 0, 100, 0, 50);
      vignette.stroke(0, alpha);
      vignette.strokeWeight(2);
      vignette.ellipse(width / 2, height / 2, width - i * 5, height - i * 5);
    }

    console.log("canvas resized to", w, "x", h);
  }
}

function windowResized() {
  console.log("window resized event detected");
}
