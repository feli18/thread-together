// Cover image preview
const coverInput = document.getElementById('coverInput');
const coverPreviewBox = document.getElementById('coverPreviewBox');
const coverPreview = document.getElementById('coverPreview');


coverInput.addEventListener('change', () => {
  const file = coverInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      coverPreview.src = e.target.result;
      coverPreview.style.display = 'block';
      coverText.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

// Dynamic step add
const stepsContainer = document.getElementById("stepsContainer");
const addStepBtn = document.getElementById("addStepBtn");
let stepIndex = 2;

addStepBtn.addEventListener("click", () => {
  const stepHTML = `
    <div class="step-item border rounded p-3 mb-3">
      <h5>Step ${stepIndex}</h5>
      <input type="file" name="stepFiles" accept="image/*,video/*" class="form-control mb-2 step-file" />
      <div class="step-preview mb-2"></div>
      <textarea name="stepDescriptions" class="form-control" placeholder="Add description ..." required></textarea>
    </div>
  `;
  stepsContainer.insertAdjacentHTML("beforeend", stepHTML);
  stepIndex++;
});

// Image/video preview for each step
stepsContainer.addEventListener("change", (e) => {
  if (e.target.classList.contains("step-file")) {
    const file = e.target.files[0];
    const previewBox = e.target.closest(".step-item").querySelector(".step-preview");
    previewBox.innerHTML = "";

    if (file) {
      const reader = new FileReader();
      reader.onload = e2 => {
        if (file.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = e2.target.result;
          img.style.maxWidth = "100%";
          img.style.borderRadius = "6px";
          previewBox.appendChild(img);
        } else if (file.type.startsWith("video/")) {
          const video = document.createElement("video");
          video.src = e2.target.result;
          video.controls = true;
          video.style.maxWidth = "100%";
          previewBox.appendChild(video);
        }
      };
      reader.readAsDataURL(file);
    }
  }
});
