/* -------------------------
   ELEMENTS
------------------------- */
const beforeInput = document.getElementById("beforeInput");
const afterInput = document.getElementById("afterInput");
const chooseBeforeBtn = document.getElementById("chooseBeforeBtn");
const chooseAfterBtn = document.getElementById("chooseAfterBtn");
const dropBefore = document.getElementById("dropBefore");
const dropAfter = document.getElementById("dropAfter");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const exampleButtons = document.querySelectorAll(".example-btn");
const resultCanvas = document.getElementById("resultCanvas");
const ctx = resultCanvas.getContext("2d");
const planElement = document.getElementById("afetPlan");

let beforeImg = null;
let afterImg = null;

let overlayRects = [];
let damageSummary = null;
let customPlanActive = false;
let overlayStats = { red: 0, yellow: 0, green: 0 };

/* -------------------------
   BUTTONS
------------------------- */
chooseBeforeBtn.onclick = () => beforeInput.click();
chooseAfterBtn.onclick = () => afterInput.click();
loadDemoBtn.onclick = () => loadDemo(1);

/* -------------------------
   FILE UPLOAD
------------------------- */
beforeInput.onchange = e => loadImage(e.target.files[0], "before");
afterInput.onchange = e => loadImage(e.target.files[0], "after");

function loadImage(file, type) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const img = new Image();
    img.onload = () => {
      if (type === "before") {
        beforeImg = img;
      } else {
        afterImg = img;
        overlayRects = [];
        damageSummary = null;
        customPlanActive = false;
        planElement.innerHTML = "";
        runAnalysis();
      }
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

/* -------------------------
   DRAG & DROP
------------------------- */
function addDropHandlers(dropEl, type) {
  dropEl.addEventListener("dragover", e => {
    e.preventDefault();
    dropEl.classList.add("drag-over");
  });
  dropEl.addEventListener("dragleave", e => {
    e.preventDefault();
    dropEl.classList.remove("drag-over");
  });
  dropEl.addEventListener("drop", e => {
    e.preventDefault();
    dropEl.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    loadImage(file, type);
  });
}

addDropHandlers(dropBefore, "before");
addDropHandlers(dropAfter, "after");

/* -------------------------
   RUN ANALYSIS
------------------------- */
analyzeBtn.onclick = runAnalysis;

function runAnalysis() {
  if (!afterImg) {
    alert("Upload a post-earthquake image or select an example.");
    return;
  }

  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  ctx.drawImage(afterImg, 0, 0, resultCanvas.width, resultCanvas.height);

  if (overlayRects.length === 0 && !customPlanActive) {
    generateFakeAnalysis();
  }

  drawOverlay();
  updatePlan();
}


/* ---------------------------------------
   SIMULATED DAMAGE DETECTION (DEMO ONLY)
---------------------------------------- */
function generateFakeAnalysis() {
  overlayRects = [];
  overlayStats = { red: 0, yellow: 0, green: 0 };

  const totalBoxes = 55 + Math.floor(Math.random() * 15);
  let id = 1;

  for (let i = 0; i < totalBoxes; i++) {
    const r = Math.random();
    let type = "green";
    if (r < 0.25) type = "red";
    else if (r < 0.55) type = "yellow";

    const w = 35 + Math.random() * 80;
    const h = 35 + Math.random() * 80;
    const x = 5 + Math.random() * (resultCanvas.width - w - 10);
    const y = 5 + Math.random() * (resultCanvas.height - h - 10);

    overlayRects.push({
      id: id++,
      x,
      y,
      w,
      h,
      type
    });

    overlayStats[type]++;
  }

  const reds = overlayStats.red;
  const yellows = overlayStats.yellow;

  if (reds >= 15 || reds + yellows >= 30) damageSummary = "severe";
  else if (reds + yellows >= 18) damageSummary = "moderate";
  else damageSummary = "minor";
}

/* -------------------------
   DRAW BOXES
------------------------- */
function drawOverlay() {
  overlayRects.forEach(r => {
    ctx.save();

    let stroke, fill;
    if (r.type === "red") {
      stroke = "rgba(255,0,0,1)";
      fill = "rgba(255,0,0,0.18)";
    } else if (r.type === "yellow") {
      stroke = "rgba(255,215,0,1)";
      fill = "rgba(255,215,0,0.18)";
    } else {
      stroke = "rgba(0,255,0,1)";
      fill = "rgba(0,255,0,0.18)";
    }

    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    const labelW = 24;
    const labelH = 18;
    const labelX = r.x + 4;
    const labelY = r.y + 4;

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(labelX, labelY, labelW, labelH);

    ctx.fillStyle = "#fff";
    ctx.font = "11px Poppins, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(r.id), labelX + labelW / 2, labelY + labelH / 2);

    ctx.restore();
  });
}

/* -------------------------
   DEFAULT RESPONSE PLAN
------------------------- */
function updatePlan() {
  if (customPlanActive) return;

  const total =
    overlayStats.red + overlayStats.yellow + overlayStats.green;

  let text;
  if (damageSummary === "severe") {
    text =
      "The region shows widespread severe destruction. Multiple rescue teams, aerial support, and reinforced logistics are required.";
  } else if (damageSummary === "moderate") {
    text =
      "The area shows partial structural damage. A phased and localized intervention is recommended.";
  } else {
    text =
      "The area consists mostly of lightly damaged or intact buildings. Priority is reconnaissance, safety checks, and infrastructure control.";
  }

  planElement.innerHTML = `
    <strong>Automatic Damage Summary (Simulation)</strong><br><br>
    Estimated structure count: <strong>${total}</strong><br>
    Severe (red): <strong>${overlayStats.red}</strong><br>
    Moderate (yellow): <strong>${overlayStats.yellow}</strong><br>
    Minor/Intact (green): <strong>${overlayStats.green}</strong><br><br>
    <strong>General Assessment:</strong><br>
    ${text}
  `;
}

/* -------------------------
        DEMO IMAGES
------------------------- */
const demoImages = {
  1: { before: "assets/oncesi-1.jpg", after: "assets/sonrasi-1.jpg" },
  2: { before: "assets/oncesi-2.jpg", after: "assets/sonrasi-2.jpg" },
  3: { before: "assets/oncesi-3.jpg", after: "assets/sonrasi-3.jpg" },
  4: { before: "assets/oncesi-4.jpg", after: "assets/sonrasi-4.jpg" }
};

/* -------------------------
   EXAMPLE SELECTION
------------------------- */
exampleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.example;
    loadDemo(id);
  });
});

/* -------------------------
   LOAD DEMO + CUSTOM REPORT
------------------------- */
function loadDemo(id) {

  customPlanActive = true;

  beforeImg = new Image();
  beforeImg.src = demoImages[id].before;

  afterImg = new Image();
  afterImg.onload = () => {
    overlayRects = [];
    damageSummary = null;

    if (id == 1) generateReport1();
    if (id == 2) generateReport2();
    if (id == 3) generateReport3();
    if (id == 4) generateReport4();

    runAnalysis();
  };

  afterImg.src = demoImages[id].after;
}

/* BIG CUSTOM REPORT SECTIONS ARE VERY LONG — 
   NOTE: If you want them translated, I can translate 
   all the long Turkish mid-sections as well. 
   For now I leave them as-is because you may want 
   to rewrite them shorter for the English site. 
*/

function generateReport1() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status & Response Analysis (Image #1)</h3>
The uploaded image has been processed using segmentation, contour extraction, roof deformation analysis, and debris-density estimation. A total of 58 structures have been classified.<br><br>

<strong>1.1. Damage Classification Distribution</strong><br>
<strong>Severe Damage (Level 3)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br><br>

<strong>Moderate Damage (Level 2)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br><br>

<strong>Minor / No Damage (Level 0–1)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br><br>

<h3>2. Accessibility Analysis</h3>
Road segmentation and debris-blockage detection indicate two major road closures:<br><br>

<strong>2.1. Closed Road Segments</strong><br>
• Road between structures 26–27 → completely blocked by debris.<br>
• Road between 59–26 → collapsed sections and heavy obstruction.<br><br>

These blockages critically affect access to the “central zone” containing:
6–7–8–16–17–18–20–21–22–59.<br><br>

<h3>3. Priority Assessment Engine</h3>
Priority scores consider structural damage, collapse likelihood, void-space probability, debris load, and road availability.<br><br>

<h3>4. Operational Priority List</h3>
<strong>4.1. Level 1 – Critical Intervention (Emergency)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
These structures show severe collapse indicators and high structural failure risk.<br>
<strong>Recommended teams:</strong><br>
• 5-person heavy USAR team<br>
• Dual teams recommended for the 44–45–49–50 collapse cluster.<br><br>

<strong>4.2. Level 2 – High Survivability Potential</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
These structures may retain survivable voids.<br>
<strong>Recommended teams:</strong><br>
• 3-person rapid search team<br><br>

<strong>4.3. Level 3 – Low Priority / Safe Zone</strong><br>
(List above)<br>
<strong>Recommended actions:</strong><br>
• Safety sweep<br>
• Gas/water line inspection<br>
• Environmental hazard assessment<br><br>

<h3>5. Regional Access Plan</h3>
<strong>5.1. “Middle Zone” Access (6–7–8–16–17–18–20–21–22–59)</strong><br>
Both northern and southern access routes are blocked.<br><br>

<u>A) Alternate Ground Access (Back-Street Route)</u><br>
• Because 26–27 is blocked, entry from western or southwestern corridors is advised.<br>
• Accessible streets lead to 6–7–8–17–18–21–22.<br>
• Suitable for heavy vehicles.<br><br>

<u>B) Aerial Access (Drone + Helicopter)</u><br>
• Due to dense structures and road blockages, aerial survey is recommended for 8, 18, 22, and 59.<br><br>

<h3>6. Operational Directive</h3>
Direct access from the center is not possible for:<br>
6, 7, 8, 17, 21, 18, 22, 59, 9, 10, 11, 26, 27, 28, 29<br><br>

Access should be via:<br>
→ Back-street ground route, or<br>
→ Aerial insertion.<br><br>
  `;
}
function generateReport2() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status & Response Analysis (Image #2)</h3>
The uploaded image has undergone segmentation, contour extraction, roof deformation detection, and debris-density estimation for 58 structures.<br><br>

<strong>1.1. Damage Classification Distribution</strong><br>

<strong>Severe Damage (Level 3 – Red)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br><br>

<strong>Moderate Damage (Level 2 – Yellow)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br><br>

<strong>Minor / No Damage (Level 0–1 – Green)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33,
34, 39, 40, 41, 42, 46, 48, 51–58<br><br>

<h3>2. Accessibility Analysis</h3>

<strong>2.1. Closed Roads</strong><br>
• 26–27 segment → fully blocked<br>
• 59–26 segment → collapsed and inaccessible<br><br>

These closures isolate the “middle zone”:
6–7–8–16–17–18–20–21–22–59<br><br>

<h3>3. Priority Module Results</h3>
Scores were computed based on:<br>
• Damage severity<br>
• Collapse likelihood<br>
• Void probability<br>
• Debris load<br>
• Cluster intensity<br>
• Road suitability<br><br>

<h3>4. Response Priority Levels</h3>

<strong>4.1. Level 1 – Critical (Emergency)</strong><br>
(List shown above)<br>
Recommendation:<br>
• Heavy USAR team<br>
• Dual teams for dense collapse clusters (44–45–49–50)<br><br>

<strong>4.2. Level 2 – High Survivability</strong><br>
(List shown above)<br>
Recommendation:<br>
• 3-person rapid assessment unit<br><br>

<strong>4.3. Level 3 – Low Priority</strong><br>
Recommendation:<br>
• Safety checks, utilities inspection<br><br>

<h3>5. Regional Access Strategy</h3>

<strong>A) Ground Route</strong><br>
Entry from west/southwest corridors only.<br><br>

<strong>B) Aerial Route</strong><br>
Recommended for 8, 18, 22, 59<br><br>

<h3>6. Operational Guidance</h3>
No direct center access for:<br>
6, 7, 8, 17, 21, 18, 22, 59, 9, 10, 11, 26, 27, 28, 29<br><br>

Access must be via:<br>
→ Back-street ground route<br>
→ Or aerial insertion<br><br>
  `;
}
function generateReport3() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status & Response Analysis (Image #3)</h3>
Satellite imagery was processed using building detection, roof deformation analysis, debris-density mapping, and structural scoring. A total of 49 structures were classified.<br><br>

<strong>1.1. Damage Distribution</strong><br>

<strong>Severely Damaged (Red – Level 3)</strong><br>
15–24, 27–31, 35, 36, 45, 46<br><br>

<strong>Moderately Damaged (Yellow – Level 2)</strong><br>
3, 4, 8, 9, 47, 48<br><br>

<strong>Minor / No Damage (Green – Level 0–1)</strong><br>
5, 6, 7, 10–14, 25, 26, 33, 34, 37–44, 49<br><br>

<h3>2. Road & Accessibility Analysis</h3>

<strong>Closed Segments:</strong><br>
• 26–27 → fully blocked<br>
• 59–26 → inaccessible<br><br>

<strong>Restricted Access Structures:</strong><br>
6–11, 17–22, 26–29, 59<br><br>

<strong>Suggested Access:</strong><br>
• Western or northern ground corridor<br>
• Drone/air access where needed<br><br>

<h3>3. Response Prioritization</h3>

<strong>Level 1 – Critical (Severe Damage)</strong><br>
15–24, 27–31, 35, 36, 45, 46<br>
Recommendation:<br>
• 5-person heavy USAR teams<br><br>

<strong>Level 2 – High Survivability</strong><br>
3, 4, 8, 9, 47, 48<br>
Recommendation:<br>
• Rapid 3-person team<br><br>

<strong>Level 3 – Low Priority</strong><br>
Remaining structures<br><br>

<h3>4. Operational Routing</h3>
A hazardous narrow corridor exists between:<br>
<strong>17–24 cluster</strong> and <strong>27–32 cluster</strong><br><br>

<strong>Why this corridor is unsafe:</strong><br>
• High debris load<br>
• Narrow street width<br>
• Limited maneuver space<br>
• Collapse risk under aftershocks<br><br>

<strong>Recommended safe routes:</strong><br>
• Eastern corridor<br>
• Western corridor<br><br>
  `;
}
function generateReport4() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status & Response Analysis (Image #4)</h3>

<h3>1. Image Processing & Classification</h3>
Processed through segmentation, object detection, deformation analysis, and structural scoring. Total structures: 78.<br><br>

<strong>1.1. Damage Classes</strong><br>

<strong>Severe Damage (Level 3 – Red)</strong><br>
78, 19, 20, 30, 31, 39–41, 48–52, 59, 60<br><br>

<strong>Moderate Damage (Level 2 – Yellow)</strong><br>
17, 18, 67, 71, 74, 75, 69, 57<br><br>

<strong>Minor / No Damage (Level 0–1 – Green)</strong><br>
(List of remaining structures)<br><br>

<h3>2. Road Conditions & Accessibility</h3>

<strong>Detected Road Issues:</strong><br>
• Partial blockage between clusters 17–24 and 27–32<br>
• Heavy debris between 19–23 and 27–31<br><br>

<strong>Recommended Routes:</strong><br>
• Ground entry from wide east/west corridors<br>
• Back-street access for 27–32<br>
• Drone/air access for critical points<br><br>

<h3>3. Priority Scoring</h3>

<strong>Level 1 – Critical (Severe Damage)</strong><br>
(List above)<br>
Recommendation:<br>
• 5-person heavy USAR team<br><br>

<strong>Level 2 – High Survivability</strong><br>
(List above)<br>
Recommendation:<br>
• 3-person rapid team<br><br>

<strong>Level 3 – Low Priority</strong><br>
• Safety checks and utilities inspection<br><br>

<h3>4. Final Operational Assessment</h3>
Direct passage between clusters:<br>
<strong>17–24</strong> and <strong>27–32</strong> is not recommended.<br><br>

<strong>Most intense collapse corridor:</strong><br>
30–41 line.<br><br>
  `;
}

function generateUserAnalysis() {

  overlayRects = [];

  let id = 1;
  const total = 45; // ideal size for user-uploaded images

  for (let i = 0; i < total; i++) {
    let colorChance = Math.random();

    let color = "green";
    if (colorChance < 0.15) color = "red";
    else if (colorChance < 0.40) color = "yellow";

    overlayRects.push({
      id: id++,
      x: Math.random() * (resultCanvas.width - 100),
      y: Math.random() * (resultCanvas.height - 100),
      w: 50 + Math.random() * 80,
      h: 50 + Math.random() * 80,
      color
    });
  }

  const reds = overlayRects.filter(r => r.color === "red").length;
  const yellows = overlayRects.filter(r => r.color === "yellow").length;

  if (reds > 10) damageSummary = "severe";
  else if (reds + yellows > 20) damageSummary = "moderate";
  else damageSummary = "minor";

  // CUSTOM REPORT FOR USER UPLOADED IMAGE
  planElement.innerHTML = `
  <h3>AFETSONAR — User Image Analysis</h3>
  Automatic structural damage analysis has been performed on the uploaded post-earthquake image.<br><br>

  <strong>Severely Damaged Structures:</strong> ${reds}<br>
  <strong>Moderately Damaged Structures:</strong> ${yellows}<br>
  <strong>Minor / Intact Structures:</strong> ${total - reds - yellows}<br><br>

  <strong>Recommended Response:</strong><br>
  ${
    damageSummary === "severe"
      ? "• Deploy 3 heavy search-and-rescue teams<br>• Aerial/drone access strongly recommended."
      : damageSummary === "moderate"
      ? "• Deploy 2 rapid assessment teams<br>• Road access should be evaluated before entry."
      : "• 1 inspection team is sufficient<br>• Visual safety check recommended."
  }
  `;
}

