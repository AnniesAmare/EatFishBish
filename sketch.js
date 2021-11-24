// Fish variables
let playerFish;
let allOtherFish;
let numberOfFish = 5;

//handstuff
let video;
let handpose;
let hands;
let indexX;
let indexY;

//statemachine
let generalState = 0;

//cheks runs when a handpose has loaded
function modelReady() {
  console.log("hand pose loaded");
  handpose.on("predict", gotPose);
}

//saves the data from the predict-function
function gotPose(results) {
  // do something with the results
  hands = results;
}

function getIndexFingerCords(hand) {
  let indexFinger = hand.annotations.indexFinger;
  return indexFinger[3];
}

//creates all the fish
function createFish(number) {
  let allOtherFish = [];
  for (let fishIndex = 0; fishIndex < number; fishIndex++) {
    const x = random(0, width) + 5;
    const y = random(0, height) + 5;
    const size = random(10, 50);
    const otherFish = new Fish(x, y, size);
    allOtherFish[fishIndex] = otherFish;
  }
  return allOtherFish;
}

function setup() {
  createCanvas(600, 400);
  video = createCapture(VIDEO);
  video.hide();
  handpose = ml5.handpose(video, modelReady);

  allOtherFish = createFish(numberOfFish);
  playerFish = new PlayerFish();
}

function draw() {
  if (generalState == 0) {
    background(43, 190, 236);
    textAlign(CENTER);
    textSize(50);
    text("Hello!", width / 2, height / 2 - 100);
    textSize(20);
    text("Please type your name in the box below:", width / 2, height / 2 - 70);
  }

  if (generalState == 1) {
    push();
    translate(width, 0);
    scale(-1, 1);
    background(220);
    if (video) {
      tint(255, 127);
      image(video, 0, 0);
    }

    for (let key in allOtherFish) {
      let fish = allOtherFish[key];
      fish.display();
    }

    if (hands && hands.length > 0) {
      let hand = hands[0];
      let indexFinger = getIndexFingerCords(hand);
      indexX = indexFinger[0];
      indexY = indexFinger[1];

      playerFish.move(indexX, indexY);
      playerFish.display();

      for (let key in allOtherFish) {
        let fish = allOtherFish[key];
        if (playerFish.collision(fish)) {
          console.log("AUCH! collision");
        }
      }
    }
    pop();
  }

}

class Fish {
  constructor(x, y, size) {
    this.fishX = x
    this.fishY = y
    this.fishSize = size;
    this.color = color("#0e6b0e");
    this.speed = 2;
    this.isDead = false;
  }

  display() {
    //draws fish if it isn't dead
    if (!this.isDead){
      fill(this.color);
      circle(this.fishX, this.fishY, this.fishSize);
      this.move();
    }
  }

  move() {
    if (this.fishX > width - 1 || this.fishX < 1) {
      this.speed = this.speed * -1;
    }
    this.fishX = this.fishX + this.speed;
  }

  kill() {
    this.isDead = true;
  }
}

class PlayerFish {
  constructor() {
    this.fishX = 0;
    this.fishY = 0;
    this.fishSize = 30;
    this.color = color("#FFC0CB");
    this.playerScore = 0;
  }

  display() {
    //draws fish
    fill(this.color);
    circle(this.fishX, this.fishY, this.fishSize)
    fill(0)
    circle(this.fishX, this.fishY, 10);
  }

  move(x, y) {
    this.fishX = x;
    this.fishY = y;
  }

  addPoint(number) {
    this.playerScore = this.playerScore + number;
  }

  collision(otherFish) {
    if (!otherFish.isDead) {
      line(otherFish.fishX, otherFish.fishY, this.fishX, this.fishY)
      let requiredDist = (this.fishSize + otherFish.fishSize) / 2;
      let distanceToCenter = Math.round(dist(otherFish.fishX, otherFish.fishY, this.fishX, this.fishY));
      // console.log(distanceToCenter);
      if (distanceToCenter < requiredDist) {
        if (otherFish.fishSize > this.fishSize) {
          otherFish.kill();
          this.fishSize = this.fishSize - 10;
          this.addPoint(-1);
        } else {
          otherFish.kill();
          this.fishSize = this.fishSize + 10;
          this.addPoint(1);
        }
        return true;
      } else {
        return false;
      }
    }
  }

}