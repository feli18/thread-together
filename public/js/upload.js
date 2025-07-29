
const coverInput = document.getElementById('coverInput');
const coverPreview = document.getElementById('coverPreview');
const coverLabel = document.getElementById('coverLabel');

coverInput.addEventListener('change', () => {
  const file = coverInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      coverPreview.src = e.target.result;
      coverPreview.style.display = 'block';
      coverLabel.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

// Add step logic
let stepIndex = 1;
const stepsContainer = document.getElementById('stepsContainer');
const addStepBtn = document.getElementById('addStepBtn');

function createStepBox(index) {
  const stepId = `step-${Date.now()}-${index}`;
  return `
    <div class="step-box mt-3" id="${stepId}">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <p class="mb-0"><strong>Step ${index}</strong></p>
        <button type="button" class="btn btn-sm btn-outline-danger remove-step" data-step-id="${stepId}">
          <i class="bi bi-trash"></i> Delete
        </button>
      </div>
      <input type="file" name="stepFiles" accept="image/*,video/*" class="form-control step-file mb-2" />
      <div class="step-preview mb-2"></div>
      <textarea name="stepDescriptions" class="form-control" placeholder="Add description ..." required></textarea>
    </div>
  `;
}

function addStep() {
  const newStep = createStepBox(stepIndex);
  stepsContainer.insertAdjacentHTML('beforeend', newStep);
  stepIndex++;
}

addStepBtn.addEventListener('click', addStep);
window.addEventListener('load', () => {
  addStep(); // 初始加载一个 step
});

// 删除 step
stepsContainer.addEventListener("click", function (e) {
  if (e.target.closest(".remove-step")) {
    const stepId = e.target.closest(".remove-step").dataset.stepId;
    const stepDiv = document.getElementById(stepId);
    if (stepDiv) stepDiv.remove();
  }
});

// Step 预览图逻辑
stepsContainer.addEventListener('change', function (e) {
  if (e.target.classList.contains('step-file')) {
    const container = e.target.closest('.step-box');
    const preview = container.querySelector('.step-preview');
    const file = e.target.files[0];
    preview.innerHTML = "";

    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (file.type.startsWith("video/")) {
          preview.innerHTML = `<video controls class="step-media"><source src="${event.target.result}" type="${file.type}"/></video>`;
        } else if (file.type.startsWith("image/")) {
          preview.innerHTML = `<img src="${event.target.result}" class="step-media" />`;
        }
      };
      reader.readAsDataURL(file);
    }
  }
});

// AI 
const getTagsBtn = document.getElementById("getTagsBtn");
if (getTagsBtn) {
  getTagsBtn.addEventListener("click", async () => {
    const file = coverInput.files[0];
    if (!file) {
      alert("请先上传封面图！");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/generate-tags", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    const tagInput = document.getElementById("tagsInput");
    const tagDisplay = document.getElementById("tagDisplayArea");

    if (data.tags && data.tags.length > 0) {
      tagDisplay.innerHTML = "推荐标签：" + data.tags.map(tag => `<span class="badge bg-primary me-1">${tag}</span>`).join("");
      tagInput.value = data.tags.join(", ");
    } else {
      tagDisplay.innerHTML = "<span class='text-muted'>无推荐结果</span>";
    }
  });
}
getTagsBtn.addEventListener("click", async () => {
  const file = coverInput.files[0];
  if (!file) {
    alert("请先上传封面图！");
    return;
  }

  const tagDisplay = document.getElementById("tagDisplayArea");
  tagDisplay.innerHTML = "<span class='text-muted'>Generating tags, please wait......</span>"; 

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("/generate-tags", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    const tagInput = document.getElementById("tagsInput");

    if (data.tags && data.tags.length > 0) {
      tagDisplay.innerHTML = "推荐标签：" + data.tags.map(tag => `<span class="badge bg-primary me-1">${tag}</span>`).join("");
      tagInput.value = data.tags.join(", ");
    } else {
      tagDisplay.innerHTML = "<span class='text-muted'>无推荐结果</span>";
    }
  } catch (err) {
    tagDisplay.innerHTML = "<span class='text-danger'>生成标签失败</span>";
    console.error("标签生成失败", err);
  }
});

