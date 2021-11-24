// score variables
let scores;
let savedScores;
let fileIsSaved = false;
let json = {};

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
let userInputName = null;

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

//fetches the coordinates for the fingertip of the index-finger
function getIndexFingerCords(hand) {
  let indexFinger = hand.annotations.indexFinger;
  return indexFinger[3];
}

//creates all the fish
function createFish(number) {
  let allOtherFish = [];
  for (let fishIndex = 0; fishIndex < number; fishIndex++) {
    const x = random(0, width);
    const y = random(0, height);
    const size = random(10, 50);
    const otherFish = new Fish(x, y, size);
    allOtherFish[fishIndex] = otherFish;
  }
  return allOtherFish;
}

//used to create the input box and handle the input
function createInputBox() {
  let input;
  let button;
  input = createInput();
  input.position(width / 3, height / 2 - 50);
  button = createButton("submit");
  button.position(width / 3 + 180, height / 2 - 50);
  button.mousePressed(userInputNameHandler => {
    //handles the input
    userInputName = input.value();
    input.remove();
    button.remove();
    //sets generalstate to the game.
    generalState = 1;
  });
}

function displayPlayerScore(playerName, playerFish){
  //mirrors the text, because our game is mirrored
  push();
  translate(width, 0);
  scale(-1, 1);
  //sets the x and y position for the text
  const playerTextX = 50;
  const playerTextY = 50;
  //sets the text alignment, size and content
  textAlign(LEFT);
  textSize(15);
  text("Player: " + playerName, playerTextX, playerTextY);
  text("Score: " + playerFish.playerScore, playerTextX, playerTextY + 20);
  //stops the mirroring
  pop();
}

function displayGameOver(playerFish){
  textAlign(CENTER);
  textSize(50);
  text("Game over!", width/2, height/2 - 100);
  textSize(20);
  text("You finished with a score of: "+playerFish.playerScore, width/2,height/2-70);
}

function preload() {
  scores = loadJSON('scores.json');
}

function setup() {
  createCanvas(600, 400);
  video = createCapture(VIDEO);
  video.hide();
  handpose = ml5.handpose(video, modelReady);

  createInputBox();

  allOtherFish = createFish(numberOfFish);
  playerFish = new PlayerFish();
}

function draw() {
  if (generalState == 0) {
    background(43, 190, 236);
    textAlign(CENTER);
    textSize(50);
    text("Hello!", width/2, height/2 - 100);
    textSize(20);
    text("Please type your name in the box below:", width/2, height/2 - 70);
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
    displayPlayerScore(userInputName,playerFish);

    //display fishes
    let deathCount = 0;
    for (let key in allOtherFish) {
      let fish = allOtherFish[key];
      if (!fish.isDead) {
        fish.display();
      } else {
        deathCount = deathCount+1;
        if(deathCount == numberOfFish){
          generalState = 2;
        }
      }
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
          if (fish.fishSize > playerFish.fishSize) {
            //game over
            generalState = 2;
          } else {
            //kills fish, makes the player-fish bigger and adds a point
            fish.kill();
            playerFish.fishSize = playerFish.fishSize + 10;
            playerFish.addPoint(1);
          }
        }
      }
    }
    pop();
  }

  if (generalState == 2) {
    background(43, 190, 236);
    displayGameOver(playerFish);

    savedScores = scores.highscores;

    json.name = userInputName;
    json.score = playerFish.playerScore;

    if (!fileIsSaved) {
      //puts the array into the json object
      savedScores.push(json);
      let output = {
        highscores: savedScores
      };
      saveJSON(output, 'scores.json'); 
      fileIsSaved = true;
    }

    count = 1;
    for (const scoreIndex in savedScores) {
      const score = savedScores[scoreIndex];
      text(score.name+" : "+score.score, width/2,(height/2-50)+30*count);
      count = count+1;
    }
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
    //draws fish
    fill(this.color);
    circle(this.fishX, this.fishY, this.fishSize);
    this.move();
  }

  move() {
    if (this.fishX > width || this.fishX < 1) {
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
      //line(otherFish.fishX, otherFish.fishY, this.fishX, this.fishY) //line-object used to test collision
      let requiredDist = (this.fishSize + otherFish.fishSize) / 2;
      let actualDist = dist(otherFish.fishX, otherFish.fishY, this.fishX, this.fishY);
      let distanceBetweenFish = Math.round(actualDist);
      if (distanceBetweenFish < requiredDist) {
        return true;
      } else {
        return false;
      }
    }
  }

}