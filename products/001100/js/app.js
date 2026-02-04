/* =========================
   Elements
========================= */
const fname = document.getElementById("fname");
const lname = document.getElementById("lname");
const mobile = document.getElementById("mobile");
const submitBtn = document.getElementById("submitBtn");

const uploadBtn = document.getElementById("uploadBtn");
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");

const videoInput = document.getElementById("videoInput");
const preview = document.getElementById("preview");
const timerEl = document.getElementById("timer");
const toast = document.getElementById("toast");

/* =========================
   State
========================= */
let mediaRecorder;
let countdown;
let videoValid = false;

/* =========================
   Utilities
========================= */
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),3000);
}

function clearError(input){
  input.classList.remove("error");
}

/* =========================
   Validation (Empty only)
========================= */
submitBtn.onclick = () => {
  let hasError = false;

  [fname,lname,mobile].forEach(input=>{
    if(!input.value){
      input.classList.add("error");
      hasError = true;
    }
  });

  if(!videoValid){
    hasError = true;
    showToast("ارسال ویدیو الزامی است");
  }

  if(hasError){
    showToast("پر کردن این فیلد اجباری است");
    return;
  }

  showToast("رزومه با موفقیت ارسال شد");
};

/* remove error on typing */
[fname,lname,mobile].forEach(i=>{
  i.addEventListener("input",()=>clearError(i));
});

/* =========================
   Upload Video
========================= */
uploadBtn.onclick = () => videoInput.click();

videoInput.onchange = () => {
  const file = videoInput.files[0];
  if(!file) return;

  const v=document.createElement("video");
  v.preload="metadata";
  v.src=URL.createObjectURL(file);

  v.onloadedmetadata=()=>{
    if(v.duration > 120){
      showToast("حداکثر زمان ویدیو ۲ دقیقه است");
      return;
    }
    preview.src=v.src;
    preview.hidden=false;
    videoValid=true;
  };
};

/* =========================
   Record Video
========================= */
recordBtn.onclick = async () => {
  let time = 120;
  timerEl.style.display="block";
  stopBtn.hidden=false;

  const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  preview.srcObject = stream;
  preview.hidden=false;
  preview.play();

  mediaRecorder = new MediaRecorder(stream);
  let chunks=[];

  mediaRecorder.ondataavailable=e=>chunks.push(e.data);
  mediaRecorder.onstop=()=>{
    clearInterval(countdown);
    timerEl.style.display="none";
    stopBtn.hidden=true;

    const blob=new Blob(chunks,{type:"video/webm"});
    preview.srcObject=null;
    preview.src=URL.createObjectURL(blob);
    videoValid=true;
  };

  mediaRecorder.start();

  countdown=setInterval(()=>{
    time--;
    timerEl.textContent=`⏱ زمان باقیمانده مجاز: ${String(Math.floor(time/60)).padStart(2,"0")}:${String(time%60).padStart(2,"0")}`;
    if(time<=0) stopRecording(stream);
  },1000);

  stopBtn.onclick = ()=> stopRecording(stream);
};

function stopRecording(stream){
  mediaRecorder.stop();
  stream.getTracks().forEach(t=>t.stop());
}
