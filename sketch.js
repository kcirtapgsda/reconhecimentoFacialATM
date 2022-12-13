let mobilenet;
let video;
let classifier;
let predictions = [];
let probabilities = [];
let classButtons = [];
let trainButton;
let trainingProgress;
let canvas;
let cut;
let ctracker;
let classes = ["Feliz", "Triste", "Bravo"];
let classesCount = [0, 0, 0];

function setup() {
  video = createCapture(VIDEO);
  video.parent("mainCanvas");
  video.size(649, 480);
  video.position(0, 0);
  video.hide();
  canvas = createCanvas(640, 480);
  canvas.parent("mainCanvas");
  background(20);

  mobilenet = ml5.featureExtractor(
    "MobileNet",
    {
      version: 1,
      alpha: 1.0,
      topk: 3,
      learningRate: 0.0001,
      hiddenUnits: 100,
      epochs: 20,
      numClasses: 3,
      batchSize: 0.4,
    },
    () => {
      console.log("Model is ready!");
    }
  );

  mobilenet.numClasses = 3;

  classifier = mobilenet.classification(video, () =>
    console.log("Video is ready!")
  );

  trainingProgress = select("#training-progress");

  for (let i = 0; i < 3; i++) {
    predictions.push(select("#class" + (i - -1) + "-name"));
    probabilities.push(select("#class" + (i - -1) + "-probability"));
    classButtons.push(select("#class" + (i - -1) + "button"));
    classButtons[i].mousePressed(function () {
      classifier.addImage(classes[i], () => {});
      classButtons[i].html(classes[i] + " (" + ++classesCount[i] + ")");
    });
  }
  trainButton = select("#train-button");
  trainButton.mousePressed(function () {
    let progress = 0;
    classifier.train((loss) => {
      if (loss === null) {
        trainingProgress.attribute("style", "width:100%");
        trainingProgress.html("Concluído");
        console.log("Training finished!");
        classifier.classify(gotResults);
      } else {
        progress = lerp(progress, 100, 0.2);
        trainingProgress.attribute("style", "width:" + progress + "%");
        console.log(loss);
      }
    });
  });

  ctracker = new clm.tracker();
  ctracker.init(pModel);
  ctracker.start(video.elt);

  noStroke();
}

function draw() {
  clear();
  image(video, 0, 0);
  let positions = ctracker.getCurrentPosition();

  let minx = width,
    miny = height,
    maxx = 0,
    maxy = 0;

  for (let i = 0; i < positions.length; i++) {
    if (positions[i][0] > maxx) {
      maxx = positions[i][0];
    }

    if (positions[i][1] > maxy) {
      maxy = positions[i][1];
    }

    if (positions[i][0] < minx) {
      minx = positions[i][0];
    }

    if (positions[i][1] < miny) {
      miny = positions[i][1];
    }
  }

  let cw = maxx - minx,
    ch = maxy - miny;
  if (cw > 0 && ch > 0) {
    cut = get(minx, miny, cw, ch);
    cut.loadPixels();
    cut.updatePixels();
    noFill();
    stroke(255, 255, 0);
    rect(minx, miny, cw, ch);
    background(0, 0, 0, 100);
    image(cut, minx, miny);
  }
}

function gotResults(error, result) {
  if (error) {
    console.log(error);
  } else {
    for (let i = 0; i < 3; i++) {
      predictions[i].html(classes[i]);
      probabilities[i].html((result == classes[i] ? 100 : 0) + "%");
      probabilities[i].attribute(
        "aria-valuenow",
        result == classes[i] ? 100 : 0
      );
      probabilities[i].attribute(
        "style",
        "width:" + (result == classes[i] ? 100 : 0) + "%"
      );
    }
    classifier.classify(gotResults);
  }
}
