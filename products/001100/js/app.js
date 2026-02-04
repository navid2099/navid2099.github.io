/* =========================
   Elements
========================= */
const stepForm  = document.getElementById("stepForm");
const stepVideo = document.getElementById("stepVideo");

const fname  = document.getElementById("fname");
const lname  = document.getElementById("lname");
const mobile = document.getElementById("mobile");
const skill  = document.getElementById("skill");

const nextBtn   = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");

const recordBtn = document.getElementById("recordBtn");
const stopBtn   = document.getElementById("stopBtn");
const retryBtn  = document.getElementById("retryBtn");

const preview = document.getElementById("preview");
const timerEl = document.getElementById("timer");
const toast   = document.getElementById("toast");

/* =========================
   State
========================= */
let mediaRecorder;
let countdown;
let videoBlob = null;
let videoValid = false;

/* =========================
   Utils
========================= */
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function clearError(input){
  input.classList.remove("error");
}

function isValidMobile(val){
  return /^09\d{9}$/.test(val);
}

/* =========================
   STEP 1 → STEP 2
========================= */
nextBtn.onclick = () => {
  let hasError = false;

  [fname, lname, skill].forEach(input => {
    if(!input.value.trim()){
      input.classList.add("error");
      hasError = true;
    }
  });

  if(!isValidMobile(mobile.value)){
    mobile.classList.add("error");
    showToast("شماره موبایل معتبر نیست");
    return;
  }

  if(hasError){
    showToast("لطفاً تمام فیلدها را کامل کنید");
    return;
  }

  stepForm.hidden  = true;
  stepVideo.hidden = false;
};

[fname, lname, mobile, skill].forEach(i => {
  i.addEventListener("input", () => clearError(i));
});

/* =========================
   Submit (Final)
========================= */
submitBtn.onclick = () => {
  if(!videoValid){
    showToast("ضبط ویدیو الزامی است");
    return;
  }

  // داده‌ها آماده ارسال به بک‌اند:
  // fname.value
  // lname.value
  // mobile.value
  // skill.value
  // videoBlob

  showToast("رزومه با موفقیت ارسال شد");
};

/* =========================
   Record Video (HIGH QUALITY AUDIO)
========================= */
recordBtn.onclick = async () => {
  if(videoValid){
    showToast("برای ضبط مجدد ابتدا ویدیو را حذف کنید");
    return;
  }

  let time = 90;
  timerEl.style.display = "block";
  stopBtn.hidden = false;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1
    }
  });

  preview.srcObject = stream;
  preview.muted = true;   // جلوگیری از بک‌خوردن صدا
  preview.hidden = false;
  preview.play();

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9,opus",
    videoBitsPerSecond: 2_500_000, // 2.5 Mbps
    audioBitsPerSecond: 128_000    // 128 kbps
  });

  let chunks = [];

  mediaRecorder.ondataavailable = e => chunks.push(e.data);

  mediaRecorder.onstop = () => {
    clearInterval(countdown);
    timerEl.style.display = "none";
    stopBtn.hidden = true;

    videoBlob = new Blob(chunks, { type: "video/webm" });
    preview.srcObject = null;
    preview.src = URL.createObjectURL(videoBlob);
    preview.muted = false;

    videoValid = true;
    recordBtn.disabled = true;
    retryBtn.hidden = false;
  };

  mediaRecorder.start();

  countdown = setInterval(() => {
    time--;
    timerEl.textContent =
      `⏱ زمان باقی‌مانده: ${String(Math.floor(time / 60)).padStart(2,"0")}:${String(time % 60).padStart(2,"0")}`;

    if(time <= 0){
      stopRecording(stream);
    }
  }, 1000);

  stopBtn.onclick = () => stopRecording(stream);
};

function stopRecording(stream){
  if(mediaRecorder && mediaRecorder.state !== "inactive"){
    mediaRecorder.stop();
  }
  stream.getTracks().forEach(track => track.stop());
}

/* =========================
   Retry Record
========================= */
retryBtn.onclick = () => {
  preview.src = "";
  preview.hidden = true;

  videoBlob = null;
  videoValid = false;

  recordBtn.disabled = false;
  retryBtn.hidden = true;

};
