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
let rgbOffset = 3;
let scanlineAlpha = 100;
const NEON_COLOR = [120, 192, 224];
let lastBuffer;
let strokeEnabled = false;

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
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/America/Los_Angeles"
    );
    if (!response.ok) throw new Error("API response error");

    const data = await response.json();
    const date = new Date(data.datetime);

    realTimeData.hours = date.getHours();
    realTimeData.minutes = date.getMinutes();
    realTimeData.seconds = date.getSeconds();
    realTimeData.isApiTime = true;
    updateTimeDisplay();
    console.log(
      "fetched PST time:",
      `${realTimeData.hours}:${realTimeData.minutes}`
    );
  } catch (error) {
    console.error(
      "failed to fetch PST time, using local time as fallback:",
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

  isAnimating = true;

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

  lastMouseX = mouseX;
  lastMouseAngle = 0;

  fetchPSTTime();
  setInterval(fetchPSTTime, 60000);

  lastBuffer = createGraphics(800, 800);
  mainBuffer = createGraphics(800, 800);
  clockMask = createGraphics(800, 800);
  vignette = createGraphics(width, height);

  vignette.noFill();
  for (let i = 0; i < 100; i++) {
    let alpha = map(i, 0, 100, 0, 50);
    vignette.stroke(0, alpha);
    vignette.strokeWeight(2);
    vignette.ellipse(width / 2, height / 2, width - i * 5, height - i * 5);
  }
}

let mainBuffer, clockMask, vignette;

function draw() {
  if (!isAnimating) {
    background(0);

    mainBuffer.clear();

    clockMask.clear();
    clockMask.background(0);
    clockMask.noFill();
    clockMask.stroke(255);
    clockMask.strokeWeight(30);

    let clockX = width / 2;
    let clockY = height / 2;
    let clockSize = min(width, height) * 0.75;

    clockMask.circle(clockX, clockY, clockSize);

    drawClockHand(clockMask, lastMouseAngle, "hour", clockSize * 0.33);
    drawClockHand(clockMask, timeOffset, "minute", clockSize * 0.42);
    drawClockHand(clockMask, timeOffset * 60, "second", clockSize * 0.47);

    mainBuffer.push();
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        let x = (matrix[i].x + j * fontSize) % width;

        if (x >= 0 && x < width) {
          let pixelColor = clockMask.get(x, i * fontSize);
          if (pixelColor[0] > 0) {
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

    image(mainBuffer, 0, 0);

    push();
    blendMode(ADD);
    tint(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);
    image(mainBuffer, 0, 0);
    tint(NEON_COLOR[0] / 6, NEON_COLOR[1] / 6, NEON_COLOR[2] / 6);
    image(mainBuffer, -rgbOffset, 0);
    image(mainBuffer, rgbOffset, 0);
    pop();
    noTint();

    for (let y = 0; y < height; y += 4) {
      stroke(0, scanlineAlpha);
      line(0, y, width, y);
    }

    image(vignette, 0, 0);

    return;
  }

  background(0);

  mainBuffer.clear();
  clockMask.clear();

  clockMask.background(0);
  clockMask.noFill();
  clockMask.stroke(255);
  clockMask.strokeWeight(30);

  let clockX = width / 2;
  let clockY = height / 2;
  let clockSize = min(width, height) * 0.75;

  clockMask.circle(clockX, clockY, clockSize);

  let mouseAngle = atan2(mouseY - clockY, mouseX - clockX);
  let angleDiff = mouseAngle - lastMouseAngle;

  if (angleDiff !== 0) {
    if (angleDiff > PI) angleDiff -= TWO_PI;
    if (angleDiff < -PI) angleDiff += TWO_PI;
    clockwise = angleDiff > 0;

    timeOffset += clockwise ? 1 : -1;
  }
  lastMouseAngle = mouseAngle;

  drawClockHand(clockMask, mouseAngle, "hour", clockSize * 0.33);
  drawClockHand(clockMask, timeOffset, "minute", clockSize * 0.42);
  drawClockHand(clockMask, timeOffset * 60, "second", clockSize * 0.47);

  mainBuffer.push();
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      let x = (matrix[i].x + j * fontSize) % width;

      if (x >= 0 && x < width) {
        let pixelColor = clockMask.get(x, i * fontSize);
        if (pixelColor[0] > 0) {
          mainBuffer.fill(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);
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
    if (isAnimating) {
      matrix[i].x += matrix[i].speed;
    }
  }
  mainBuffer.pop();

  lastBuffer.copy(mainBuffer, 0, 0, width, height, 0, 0, width, height);

  image(mainBuffer, 0, 0);

  push();
  blendMode(ADD);
  tint(NEON_COLOR[0], NEON_COLOR[1], NEON_COLOR[2]);
  image(mainBuffer, 0, 0);
  tint(NEON_COLOR[0] / 6, NEON_COLOR[1] / 6, NEON_COLOR[2] / 6);
  image(mainBuffer, -rgbOffset, 0);
  image(mainBuffer, rgbOffset, 0);
  pop();
  noTint();

  for (let y = 0; y < height; y += 4) {
    stroke(0, scanlineAlpha);
    line(0, y, width, y);
  }

  image(vignette, 0, 0);

  scanLine += 10;
  if (scanLine > height) scanLine = 0;

  if (frameCount % 30 === 0) {
    console.log("FPS:", frameRate());
  }
}

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
  g.translate(width / 2, height / 2);
  g.rotate(angle);
  g.stroke(255);
  g.strokeWeight(30);
  g.line(0, 0, 0, -length);
  g.pop();
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

function keyPressed() {
  if (keyCode === 32) {
    isAnimating = !isAnimating;

    if (!isAnimating) {
      redraw();
    }
    return false;
  }
}

function updateTimeDisplay() {
  const timeElement = document.getElementById("pst-time");
  if (timeElement) {
    let hours = realTimeData.hours;
    let ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    let timeString = `${hours.toString()}:${realTimeData.minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
    timeElement.textContent = timeString;
  }
}
