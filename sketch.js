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
let lastMouseAngle = 0;
let clockwise = true;
let timeOffset = 0;
let images = [];
let imageX = [];
const IMAGE_OPACITY = 10; // 10% opacity
let lastMouseX = 0;
let imageSpeed = 0;
const IMAGE_SPEED = 1; // Adjust speed of image movement
let imageHeight;

// CRT effect parameters
let rgbOffset = 1.5; // ADJUST RGB SHIFT AMOUNT HERE
let scanlineAlpha = 50; // ADJUST SCANLINE INTENSITY HERE
const NEON_GREEN = [0, 255, 70]; // RGB values for neon green

function preload() {
  console.log("Loading font...");
  font = loadFont('public/fonts/Web437_Cordata_PPC-21.woff');
  // Load all images from public/images
  loadImageDirectory();
}

function loadImageDirectory() {
  // Array of image filenames from your public/images directory
  const imageFiles = [
    'public/images/image1.jpg',
    'public/images/image2.JPG',
    'public/images/image3.jpg',
    'public/images/image4.jpg',
    'public/images/image5.jpg',
    'public/images/image6.jpg',
    'public/images/image7.jpg',
    'public/images/image8.jpg',
    'public/images/image9.jpg',
    'public/images/image10.jpg',
    // Add all your image filenames here
  ];

  imageFiles.forEach((filepath, index) => {
    loadImage(filepath, img => {
      images.push(img);
      imageX[index] = index * width; // Position images side by side
    });
  });
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight); // Make canvas fullscreen
  canvas.parent('sketch-holder');
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

  // Initialize image positions to create a continuous reel
  imageX = images.map((_, index) => index * windowWidth);
  
  lastMouseX = mouseX;

  // Calculate height to fill screen while maintaining aspect ratio
  imageHeight = height;
}

function drawImageReel() {
  // Calculate mouse-based speed
  let currentMouseSpeed = abs(mouseX - lastMouseX);
  imageSpeed = lerp(imageSpeed, currentMouseSpeed * 0.5, 0.1); // Smooth acceleration
  
  push();
  tint(255, IMAGE_OPACITY);
  
  // Draw each image
  images.forEach((img, index) => {
    // Calculate dimensions to fill screen while maintaining aspect ratio
    let aspectRatio = img.width / img.height;
    let imgHeight = windowHeight;
    let imgWidth = imgHeight * aspectRatio;
    
    // Draw image
    image(img, imageX[index], 0, imgWidth, imgHeight);
    
    // Move image based on mouse speed
    imageX[index] += imageSpeed;
    
    // Wrap images around when they move off screen
    if (imageX[index] > windowWidth) {
      // Find leftmost image position
      let leftmostX = Math.min(...imageX);
      imageX[index] = leftmostX - imgWidth;
    } else if (imageX[index] + imgWidth < 0) {
      // Find rightmost image position
      let rightmostX = Math.max(...imageX);
      imageX[index] = rightmostX;
    }
  });
  pop();
  
  lastMouseX = mouseX;
}

function draw() {
  background(0);
  
  // Draw background images first
  drawImageReel();

  if (!isAnimating) {
    return;
  }

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

  // Get mouse angle for hour hand and determine direction
  let mouseAngle = atan2(mouseY - 400, mouseX - 400);
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
    let speed = map(mouseSpeed, 0, 50, 0.5, 5);
    matrix[i].x += speed;
  }
  mainBuffer.pop();

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

// Update drawClockHand function
function drawClockHand(g, value, type, length) {
  let angle;
  let now = new Date();
  
  if (type === "hour") {
    angle = value; // Direct mouse angle
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
  g.translate(400, 400);
  g.rotate(angle);
  g.stroke(255);
  g.strokeWeight(30); // Restore original thickness for all hands
  g.line(0, 0, 0, -length);
  g.pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Reinitialize image positions
  imageX = images.map((_, index) => index * windowWidth);
}

// Add keyPressed function to handle space bar
function keyPressed() {
  if (keyCode === 32) {
    // 32 is the keyCode for spacebar
    isAnimating = !isAnimating;
  }
}
