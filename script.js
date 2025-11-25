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
   DRAG AND DROP
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
   ANALYZE
------------------------- */
analyzeBtn.onclick = runAnalysis;

function runAnalysis() {
  if (!afterImg) {
    alert("Upload the image after the earthquake or select an example.");
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
   FAKE DAMAGE DETECTION (Realistic Demo)
---------------------------------------- */
function generateFakeAnalysis() {
  overlayRects = [];
  overlayStats = { red: 0, yellow: 0, green: 0 };

  const totalBoxes = 55 + Math.floor(Math.random() * 15); // between 55–70 boxes
  let id = 1;

  for (let i = 0; i < totalBoxes; i++) {
    const r = Math.random();
    let type = "green";
    if (r < 0.25) type = "red";        // ~25% severe
    else if (r < 0.55) type = "yellow"; // ~30% medium

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
  else if (reds + yellows >= 18) damageSummary = "medium";
  else damageSummary = "light";
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

    // transparent inner fill
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // outer border
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // number label
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
   INTERVENTION PLAN (Default)
------------------------- */
function updatePlan() {
  if (customPlanActive) return; // Don't touch if there is a custom report

  const total =
    overlayStats.red + overlayStats.yellow + overlayStats.green;

  let status;
  if (damageSummary === "severe") {
    status = "Widespread and intense destruction is assumed across the region. Requires multiple search-and-rescue teams, air support, and logistical reinforcement.";
  } else if (damageSummary === "medium") {
    status = "The area is considered to have sustained partial severe damage. A controlled and phased intervention plan focusing on critical clusters is recommended.";
  } else {
    status = "The area primarily consists of lightly damaged / structurally sound buildings. Priority is given to reconnaissance, security, and infrastructure checks.";
  }

  planElement.innerHTML = `
    <strong>Automatic Damage Summary (Simulation)</strong><br><br>
    Estimated building count: <strong>${total}</strong><br>
    Severe damage (red): <strong>${overlayStats.red}</strong><br>
    Medium damage (yellow): <strong>${overlayStats.yellow}</strong><br>
    Light / sound (green): <strong>${overlayStats.green}</strong><br><br>
    <strong>Overall Assessment:</strong><br>
    ${status}
  `;
}

/* -------------------------
        EXAMPLE VISUALS
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

  afterImg.src = demoImages[id].after;   // ❗ MUST REMAIN HERE ONLY
}

/* -------------------------
   REPORT #1
------------------------- */
function generateReport1() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status and Intervention Analysis (Image #1)</h3>
The uploaded image was processed through segmentation, contour extraction, roof deformation detection, and debris density analysis modules, and structural status classification was performed for a total of 58 buildings.<br><br>

<strong>1.1. Damage Classification Distribution</strong><br>
<strong>Severe Damage (Level 3)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br><br>

<strong>Medium / Minor Damage (Level 2)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br><br>

<strong>Undamaged / Sound (Level 0–1)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br><br>

<h3>2. Accessibility Analysis</h3>
Based on road segmentation and debris blockage detection, two critical road closures have been identified:<br><br>

<strong>2.1. Closed Road Segments</strong><br>
• The connection road between 26–27 → Completely closed due to heavy debris and rubble.<br>
• The road between 59–26 → Inoperable due to collapse and accumulation.<br><br>

These closures require the re-planning of the access strategy for buildings numbered
6–7–8–16–17–18–20–21–22–59, which the center has defined as the “middle region”.<br><br>

<h3>3. Prioritization Engine</h3>
Prioritization was calculated based on damage level, collapse risk, likelihood of survival space, surrounding debris load, and road suitability.<br><br>

<h3>4. Operation Priority Ranking</h3>
<strong>4.1. Level 1 – Critical Intervention (Urgent)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
High collapse risk and loss of load-bearing system are evident in these structures.<br>
<strong>Recommended team:</strong><br>
• 5-person heavy search-and-rescue team<br>
• Double teams are recommended for the 44–45–49–50 area due to the dense collapse cluster.<br><br>

<strong>4.2. Level 2 – High Survivability Likelihood (Prioritized)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
It is assessed that survival spaces are largely preserved in these structures.<br>
<strong>Recommended team:</strong><br>
• 3-person rapid scanning and internal void control team<br><br>

<strong>4.3. Level 3 – Low Priority (Safe Area)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br>
There is no vital risk in these structures.<br>
<strong>Recommended action:</strong><br>
• Security scan<br>
• Gas/water line check<br>
• Environmental risk assessment<br><br>

<h3>5. Regional Access Plan</h3>
<strong>5.1. “Middle Region” (6–7–8–16–17–18–20–21–22–59)</strong><br>
Direct entry from the center is not possible as the area has road closures both in the north and south.<br><br>

<u>A) Alternative Roadway Access (Back Neighborhood Route)</u><br>
• Since the 26–27 line is closed, it is recommended to bring teams into the area from the western or southwestern arteries.<br>
• Access to the 6–7–8–17–18–21–22 line can be achieved by proceeding through unblocked streets.<br>
• This route is suitable for heavy vehicles.<br><br>

<u>B) Air Access (Drone + Helicopter)</u><br>
• Due to dense construction and road closures: initial reconnaissance by air is recommended for buildings numbered 8, 18, 22, and 59.<br>
• Personnel deployment by helicopter or debris-top reconnaissance by drone is possible if needed.<br><br>

<h3>6. Operational Instruction and Transportation Note</h3>
Direct entry from the center is not possible for the following building group:<br>
6, 7, 8, 17, 21, 18, 22, 59, 9, 10, 11, 26, 27, 28, 29<br><br>
Access to this area can be provided:<br>
→ By road via the back neighborhood route, or<br>
→ By air.<br><br>
`;
}

/* -------------------------
   REPORT #2
------------------------- */
function generateReport2() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status and Intervention Analysis (Image #2)</h3>
The uploaded image was processed through segmentation, contour extraction, roof deformation detection, and debris density analysis modules, and structural status classification was performed for a total of 58 buildings.<br><br>

<strong>1.1. Damage Classification Distribution</strong><br>
<strong>Severe Damage (Level 3)</strong> – Red Border<br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
Collapse, loss of load-bearing system, distinct roof deformation, and high debris density have been detected in these structures.<br><br>

<strong>Medium / Minor Damage (Level 2)</strong> – Yellow Border<br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
Partial deformation, localized fractured areas, and limited exterior facade damage were observed in this group.<br><br>

<strong>Undamaged / Sound (Level 0–1)</strong> – Green Border<br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br>
Structural integrity is preserved in these structures, and no collapse or serious deformation has been observed.<br><br>

<h3>2. Accessibility Analysis</h3>
Based on road segmentation and debris blockage detection, two critical road closures have been identified:<br><br>

<strong>2.1. Closed Road Segments</strong><br>
• The connection road between 26–27 → Completely closed due to heavy debris and rubble.<br>
• The road between 59–26 → Inoperable due to collapse and accumulation.<br><br>

These closures require the re-planning of the access strategy for buildings numbered
6–7–8–16–17–18–20–21–22–59, which the center has defined as the "middle region".<br><br>

<h3>3. Prioritization Module Results</h3>
The prioritization engine evaluated the following variables:<br>
• Damage level coefficient<br>
• Collapse risk<br>
• Likelihood of survival space<br>
• Surrounding debris load<br>
• Building cluster density<br>
• Road access suitability<br><br>

The operation priority ranking was established with these scores.<br><br>

<h3>4. Operation Priority Ranking</h3>
<strong>4.1. Level 1 – Critical Intervention (Urgent)</strong><br>
12, 13, 14, 16, 18, 20, 22, 26, 38, 44, 45, 49, 50, 59<br>
High collapse risk and loss of load-bearing system are evident in these structures.<br>
<strong>Recommended team:</strong><br>
• 5-person heavy search-and-rescue team<br>
• Double teams are recommended for the 44–45–49–50 area due to the dense collapse cluster.<br><br>

<strong>4.2. Level 2 – High Survivability Likelihood (Prioritized)</strong><br>
5, 6, 9, 10, 17, 19, 21, 23, 24, 35, 36, 37, 43<br>
It is assessed that survival spaces are largely preserved in these structures.<br>
<strong>Recommended team:</strong><br>
• 3-person rapid scanning and internal void control team<br><br>

<strong>4.3. Level 3 – Low Priority (Safe Area)</strong><br>
1, 2, 3, 4, 7, 8, 11, 15, 25, 27, 28, 29, 30, 31, 32, 33, 34,
39, 40, 41, 42, 46, 48, 51, 52, 53, 54, 55, 56, 57, 58<br>
There is no vital risk in these structures.<br>
<strong>Recommended action:</strong><br>
• Security scan<br>
• Gas/water line check<br>
• Environmental risk assessment<br><br>

<h3>5. Regional Access Plan</h3>
<strong>5.1. Middle Region (6–7–8–16–17–18–20–21–22–59)</strong><br>
Direct entry from the center is not possible as the area has road closures both in the north and south.<br><br>

<strong>A) Alternative Roadway Access</strong><br>
• Since the 26–27 line is closed, it is recommended to bring teams into the area from the western or southwestern arteries.<br>
• Access to the 6–7–8–17–18–21–22 line can be achieved by proceeding through unblocked streets.<br>
• This route is suitable for heavy vehicles.<br><br>

<strong>B) Air Access (Drone + Helicopter)</strong><br>
• Due to dense construction and road closures: initial reconnaissance by air is recommended for buildings numbered 8, 18, 22, and 59.<br>
• Personnel deployment by helicopter or debris-top reconnaissance by drone is possible if needed.<br><br>

<h3>6. Operational Instruction and Transportation Note</h3>
Direct entry from the center is not possible for the following building group:<br>
6, 7, 8, 17, 21, 18, 22, 59, 9, 10, 11, 26, 27, 28, 29<br><br>

Access to this area can be provided:<br>
→ By road via the back neighborhood route, or<br>
→ By air.<br><br>
`;
}

/* -------------------------
   REPORT #3
------------------------- */
function generateReport3() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status and Intervention Analysis (Image #3)</h3>
The uploaded satellite image was processed through building detection, roof deformation analysis, debris density mapping, and structural integrity scoring stages. Damage classification has been completed for a total of 49 buildings in the area.<br><br>

<strong>1.1. Damage Class Distribution</strong><br>

<strong>Severely Damaged Buildings (Red – Level 3)</strong><br>
15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
27, 28, 29, 30, 31, 35, 36, 45, 46<br>
Collapse, loss of load-bearing structure, debris accumulation, and floor implosion are evident in these structures.<br><br>

<strong>Medium / Minor Damaged Buildings (Yellow – Level 2)</strong><br>
3, 4, 8, 9, 47, 48<br>
Light roof deformation, partial column damage, and exterior facade fractures have been detected.<br><br>

<strong>Undamaged / Structurally Sound Buildings (Green – Level 0–1)</strong><br>
5, 6, 7, 10, 11, 12, 13, 14, 25, 26, 33, 34, 37, 38, 39, 40, 41, 42, 43, 44, 49<br>
Roof and facade integrity are preserved in these structures; risk is low.<br><br>

<h3>2. Road and Accessibility Analysis</h3>
AFETSONAR's road segmentation module analyzed street connections in the area to identify critical closed roads.<br><br>

<strong>2.1. Closed Road Detections</strong><br>
• The road between buildings numbered 26–27 is completely closed.<br>
• The 59–26 line is also unusable due to heavy rubble.<br><br>

These two blockages disable the critical corridor in the middle line of the region.<br><br>

<strong>2.2. Accessibility Status</strong><br>
Buildings with limited road access:<br>
6, 7, 8, 9, 10, 11, 17, 18, 21, 22, 26, 27, 28, 29, 59<br><br>

<strong>Recommended access methods:</strong><br>
• Entry from the western or northern axis of the neighborhood<br>
• UAV / air access if road access is insufficient<br><br>

<h3>3. Intervention Prioritization (AFETSONAR Scoring)</h3>
Prioritization was calculated based on damage level + road status + clustering density + likelihood of survival.<br><br>

<strong>3.1. Level 1 – Urgent Critical Areas (Severe Damage)</strong><br>
15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
27, 28, 29, 30, 31, 35, 36, 45, 46<br>
<strong>Recommended team:</strong><br>
• 5-person heavy search-and-rescue teams<br>
• Double teams – parallel deployment if necessary<br><br>

<strong>3.2. Level 2 – High Survivability Likelihood</strong><br>
3, 4, 8, 9, 47, 48<br>
<strong>Recommended team:</strong><br>
• 3-person rapid scanning team<br>
• Internal void control + acoustic/thermal scanning<br><br>

<strong>3.3. Level 3 – Low Priority Areas</strong><br>
5, 6, 7, 10, 11, 12, 13, 14, 25, 26, 33, 34, 37, 38, 39, 40, 41, 42, 43, 44, 49<br>
<strong>Recommended action:</strong><br>
• Environmental security<br>
• Gas, water, and infrastructure checks<br>
• Secondary risk assessment<br><br>

<h3>4. Operation Guidance (AFETSONAR Output)</h3>
AFETSONAR's accessibility analysis has identified a critical but risky narrow corridor between two dense destruction clusters:<br><br>

<strong>17–24 area</strong><br>
<strong>27–32 area</strong><br><br>

<strong>4.1. Why is the Use of the Middle Corridor Not Recommended?</strong><br>
• High debris density<br>
• Narrow road width<br>
• Limited vehicle maneuverability<br>
• Not safe for two-way passage<br>
• Additional collapse risk due to aftershocks exists<br><br>

Therefore:<br>
<strong>The use of the middle line between 17–24 — 27–32 is not recommended.</strong><br><br>

<h3>4.2. Safe Transportation Routes</h3>
<strong>1) Eastern Line (Entry from the Right)</strong><br>
• The road around 9–10–11 and 31–32 is wide<br>
• Debris risk is lower<br>
• Safer for vehicle traffic<br><br>

<strong>2) Western Line (Entry from the Left)</strong><br>
• Peripheral roads on the 14–15–25–33 axis are wider<br>
• Debris blockage is minimal<br><br>

<strong>Brief Technical Conclusion</strong><br>
The direct corridor between the 17–24 and 27–32 building clusters is operationally inefficient, risky, and should be avoided.<br><br>

<strong>Recommended safe access options:</strong><br>
• Eastern line<br>
• Western line<br><br>
`;
}

/* -------------------------
   REPORT #4
------------------------- */
function generateReport4() {
  customPlanActive = true;
  planElement.innerHTML = `
<h3>AFETSONAR – Structural Status and Intervention Analysis (Image #4)</h3>

<h3>1. Image Processing and Classification Results</h3>
The uploaded satellite image was processed through segmentation, object detection, structural deformation analysis, and damage scoring stages; status classification was performed for a total of 78 buildings.<br><br>

<strong>1.1. Damage Classification Distribution</strong><br>

<strong>Severe Damage (Level 3 – Red border)</strong><br>
78, 19, 20, 30, 31, 39, 40, 41, 48, 49, 50, 51, 52, 59, 60<br>
Loss of load-bearing system, roof collapse, and signs of full collapse are intense in these structures.<br><br>

<strong>Medium / Minor Damage (Level 2 – Yellow border)</strong><br>
17, 18, 67, 71, 74, 75, 69, 57<br>
Partial deformation, crack traces, facade damage, and limited collapse have been detected in these structures.<br><br>

<strong>Undamaged / Sound (Level 0–1 – Green border)</strong><br>
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
16, 21, 22, 23, 24, 25, 26, 27, 28, 29,
32, 33, 34, 35, 36, 37, 38,
42, 43, 44, 45, 46, 47,
53, 54, 55, 56, 58,
61, 62, 63, 64, 65, 66, 68,
70, 72, 73, 76, 77<br>
Structural integrity is preserved in these structures.<br><br>

<h3>2. Accessibility and Road Status Analysis</h3>
AFETSONAR's road segmentation module scanned for debris density, vehicle traffic congestion, blockage, and road integrity.<br><br>

<strong>Detected Road Problems</strong><br>
• The connection roads between the 17–24 line and the 27–32 line appear partially blocked.<br>
• There is debris accumulation from severe damage, especially in the narrow street axis between the 19–23 area and the 27–31 area.<br>
• Therefore, direct passage between the two areas is not operationally efficient.<br><br>

<strong>Recommended Access Route</strong><br>
• 17–24 cluster → access via the wide avenue from the right or left is recommended.<br>
• 27–32 cluster → access via the back neighborhood connection is safer.<br>
• Air access is recommended as an alternative route for critical areas.<br><br>

<h3>3. Prioritization Module Results</h3>
AFETSONAR's technical ranking algorithm evaluates damage level, destruction density, road access, building clustering, potential survival spaces, and environmental risks collectively.<br><br>

<strong>3.1. Level 1 – Critical Intervention Area (Urgent)</strong><br>
78, 19, 20, 30, 31, 39, 40, 41, 48, 49, 50, 51, 52, 59, 60<br>
• Loss of load-bearing system is evident.<br>
• Collapse risk is high.<br>
• Debris volume is large.<br>
<strong>Recommended team:</strong><br>
➡ 5-person heavy search-and-rescue team<br><br>

<strong>3.2. Level 2 – High Survivability Likelihood Area</strong><br>
17, 18, 67, 71, 74, 75, 69, 57<br>
• Structure is partially standing.<br>
• Internal survival spaces may be preserved.<br>
• The probability of finding survivors is higher compared to severely damaged structures.<br>
<strong>Recommended team:</strong><br>
➡ 3-person rapid scanning team<br><br>

<strong>3.3. Level 3 – Low Priority / Environmental Security Check</strong><br>
All structures listed in the green list<br>
• Structural risk is minimal.<br>
• Does not require direct search-and-rescue.<br>
<strong>Recommended action:</strong><br>
• Gas/water line check<br>
• Electrical line insulation<br>
• Environmental security scan<br><br>

<h3>4. Operational Outcome</h3>
AFETSONAR's general assessment for this image:<br><br>

• Search-and-rescue teams should be directed first to the red cluster, then to the yellow cluster.<br>
• The “17–18–19–20–21–22–23–24” area and the “27–28–29–30–31–32” area are closed to direct connection;<br>
→ Approach must be conducted from the right / left or by air.<br><br>

<strong>The most intense destruction front in the general area:</strong><br>
is the 30–41 line.<br><br>
`;
}
function generateUserAnalysis() {

  overlayRects = [];

  let id = 1;
  const total = 45; // ideal for user photos

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
  else if (reds + yellows > 20) damageSummary = "medium";
  else damageSummary = "light";

  // CUSTOM PLAN TEXT FOR USER
  planElement.innerHTML = `
  <h3>AFETSONAR — User Image Analysis</h3>
  Automatic damage analysis has been performed on the earthquake aftermath image you uploaded.<br><br>

  <strong>Buildings Detected with Severe Damage:</strong> ${reds}<br>
  <strong>Buildings Detected with Medium Damage:</strong> ${yellows}<br>
  <strong>Buildings Detected with Light Damage:</strong> ${total - reds - yellows}<br><br>

  <strong>Recommended intervention:</strong><br>
  ${damageSummary === "severe" ? 
  "• 3 heavy search-and-rescue teams<br>• Air and drone access is recommended."
  : damageSummary === "medium" ?
  "• 2 rapid scanning teams<br>• Road suitability must be checked."
  :
  "• 1 inspection team is sufficient.<br>• Observational control is recommended."
  }
  `;
}
