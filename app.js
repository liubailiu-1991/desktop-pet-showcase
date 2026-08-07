const ACTIONS = {
  idle: { label: "待机陪伴", copy: "今天也一起慢慢来。", alt: "正在待机的像素风绿头鸭 Milo" },
  walk: { label: "桌面散步", copy: "换个位置，看看桌面另一边。", alt: "正在散步的 Milo" },
  working: { label: "专注工作", copy: "我在这里，陪你把事情做完。", alt: "正在工作的 Milo" },
  reading: { label: "安静阅读", copy: "读到重要内容时，记得停一下。", alt: "正在阅读的 Milo" },
  thinking: { label: "认真思考", copy: "让我想一想……", alt: "正在思考的 Milo" },
  success: { label: "任务完成", copy: "完成啦，值得休息一下！", alt: "庆祝完成任务的 Milo" },
  sleep: { label: "休息片刻", copy: "暂时不打扰你。", alt: "正在休息的 Milo" },
  clicked: { label: "回应互动", copy: "我听见你啦。", alt: "回应点击的 Milo" },
};

const FRAME_COUNT = 8;
const FRAME_INTERVAL = 150;
const AUTO_SEQUENCE = ["idle", "working", "reading", "thinking", "success", "sleep"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const sprite = document.querySelector("#petSprite");
const petWrap = document.querySelector("#petWrap");
const stage = document.querySelector("#desktopStage");
const bubble = document.querySelector("#speechBubble");
const label = document.querySelector("#actionLabel");
const buttons = [...document.querySelectorAll(".action-button")];

let action = "idle";
let frame = 0;
let animationTimer = null;
let autoIndex = 0;
let lastInteraction = Date.now();
let restoreTimer = null;
let dragState = null;
let wasDragged = false;

function framePath(nextAction, nextFrame) {
  return `assets/milo/${nextAction}/${String(nextFrame + 1).padStart(3, "0")}.png`;
}

function renderFrame() {
  sprite.src = framePath(action, frame);
  frame = (frame + 1) % FRAME_COUNT;
}

function startAnimation() {
  window.clearInterval(animationTimer);
  frame = 0;
  renderFrame();
  if (!reducedMotion.matches) {
    animationTimer = window.setInterval(renderFrame, FRAME_INTERVAL);
  }
}

function updateBubble(copy) {
  bubble.classList.add("is-changing");
  window.setTimeout(() => {
    bubble.textContent = copy;
    bubble.classList.remove("is-changing");
  }, 150);
}

function setAction(nextAction, { userInitiated = false } = {}) {
  if (!ACTIONS[nextAction]) return;
  action = nextAction;
  if (userInitiated) lastInteraction = Date.now();

  label.textContent = ACTIONS[nextAction].label;
  sprite.alt = ACTIONS[nextAction].alt;
  updateBubble(ACTIONS[nextAction].copy);
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.action === nextAction);
  });
  startAnimation();
}

function playClickResponse() {
  const returnAction = action === "clicked" ? "idle" : action;
  window.clearTimeout(restoreTimer);
  setAction("clicked", { userInitiated: true });
  restoreTimer = window.setTimeout(() => setAction(returnAction), 1250);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    window.clearTimeout(restoreTimer);
    setAction(button.dataset.action, { userInitiated: true });
  });
});

for (const actionName of Object.keys(ACTIONS)) {
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const image = new Image();
    image.src = framePath(actionName, i);
  }
}

petWrap.addEventListener("pointerdown", (event) => {
  const stageRect = stage.getBoundingClientRect();
  const petRect = petWrap.getBoundingClientRect();
  dragState = {
    pointerId: event.pointerId,
    stageRect,
    offsetX: event.clientX - (petRect.left + petRect.width / 2),
    offsetY: event.clientY - (petRect.top + petRect.height / 2),
    startX: event.clientX,
    startY: event.clientY,
  };
  wasDragged = false;
  petWrap.setPointerCapture(event.pointerId);
});

petWrap.addEventListener("pointermove", (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
  if (distance > 5) wasDragged = true;

  const halfWidth = petWrap.offsetWidth / 2;
  const halfHeight = petWrap.offsetHeight / 2;
  const x = Math.min(
    dragState.stageRect.width - halfWidth,
    Math.max(halfWidth, event.clientX - dragState.stageRect.left - dragState.offsetX),
  );
  const y = Math.min(
    dragState.stageRect.height - halfHeight,
    Math.max(halfHeight, event.clientY - dragState.stageRect.top - dragState.offsetY),
  );

  petWrap.style.left = `${x}px`;
  petWrap.style.top = `${y}px`;
  lastInteraction = Date.now();
});

petWrap.addEventListener("pointerup", (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  petWrap.releasePointerCapture(event.pointerId);
  dragState = null;
  if (!wasDragged) playClickResponse();
});

petWrap.addEventListener("pointercancel", () => {
  dragState = null;
});

petWrap.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    playClickResponse();
  }
});

reducedMotion.addEventListener("change", startAnimation);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(animationTimer);
  } else {
    startAnimation();
  }
});

window.setInterval(() => {
  if (Date.now() - lastInteraction < 9000 || dragState) return;
  autoIndex = (autoIndex + 1) % AUTO_SEQUENCE.length;
  setAction(AUTO_SEQUENCE[autoIndex]);
}, 7000);

setAction("idle");
