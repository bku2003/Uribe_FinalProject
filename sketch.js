let bookWidth = 250;
let bookHeight = 250;
let pageAngle = 0;
let words = ["A", "TALE", "AS", "YOUNG", "AS", "TIME"];
let currentWordIndex = 0;
let wordOpacity = 0;
let animationState = "opening"; // opening, images, revealing, complete

let images = [];
let imageFiles = [
  "images/img1.jpg", // graduation
  "images/img2.jpg", // basketball
  "images/img3.jpg", // yankees
  "images/img4.jpg", // cat
  "images/img5.jpg", // bucket hat
  "images/img6.jpg", // golf
];
let currentImageIndex = 0;
let imageOpacity = 0;

function preload() {
  for (let i = 0; i < imageFiles.length; i++) {
    images[i] = loadImage(imageFiles[i]);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(32);
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

  // Draw book
  push();
  fill(50);
  rect(-bookWidth / 2, -bookHeight / 2, bookWidth, bookHeight);

  // Draw pages
  fill(255);
  if (animationState === "opening") {
    pageAngle = map(frameCount, 0, 60, 0, PI / 2);
    if (frameCount > 60) {
      animationState = "images";
      frameCount = 0;
    }
  }

  // Left page
  push();
  translate(-bookWidth / 4, 0);
  rotate(-pageAngle);
  rect(-bookWidth / 4, -bookHeight / 2, bookWidth / 2, bookHeight);
  pop();

  // Right page
  push();
  translate(bookWidth / 4, 0);
  rotate(pageAngle);
  rect(0, -bookHeight / 2, bookWidth / 2, bookHeight);
  pop();
  pop();

  // Draw images in sequence after opening
  if (animationState === "images") {
    if (currentImageIndex < images.length) {
      if (frameCount < 20) {
        imageOpacity = map(frameCount, 0, 20, 0, 255);
      } else if (frameCount < 50) {
        imageOpacity = 255;
      } else {
        frameCount = 0;
        currentImageIndex++;
        if (currentImageIndex >= images.length) {
          animationState = "revealing";
          frameCount = 0;
        }
      }
      push();
      imageMode(CENTER);
      tint(255, imageOpacity);
      if (images[currentImageIndex]) {
        let img = images[currentImageIndex];
        let scale = min(bookWidth / img.width, bookHeight / img.height);
        image(img, 0, 0, img.width * scale, img.height * scale);
      }
      pop();
    }
  }
  // Draw text
  else if (animationState === "revealing") {
    if (currentWordIndex < words.length) {
      if (frameCount < 30) {
        wordOpacity = map(frameCount, 0, 30, 0, 255);
      } else if (frameCount < 60) {
        wordOpacity = 255;
      } else {
        frameCount = 0;
        currentWordIndex++;
        if (currentWordIndex >= words.length) {
          animationState = "complete";
        }
      }
      push();
      fill(255, wordOpacity);
      textSize(getWordFontSize(words[currentWordIndex]));
      text(words[currentWordIndex], 0, 0, bookWidth * 0.9, bookHeight * 0.9);
      pop();
    }
  } else if (animationState === "complete") {
    push();
    fill(255);
    textSize(32);
    let completeText = words.join(" ");
    text(completeText, 0, 0);
    pop();
  }
}

function getWordFontSize(word) {
  // Make the word fill the book width
  let size = 32;
  textSize(size);
  let tw = textWidth(word);
  while (tw < bookWidth * 0.85 && size < 120) {
    size += 2;
    textSize(size);
    tw = textWidth(word);
  }
  return size;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
