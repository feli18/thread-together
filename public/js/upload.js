const coverInput = document.getElementById('coverInput');
const coverPreview = document.getElementById('coverPreview');
const coverLabel = document.getElementById('coverLabel');
const changeBtn = document.getElementById('changeCoverBtn');

// --- helpers: image compress ---
async function compressImageFile(file, maxDim = 1280, quality = 0.72) {
  if (!file || !file.type?.startsWith('image/')) return file;
  // 小图不压缩
  if (file.size <= 600 * 1024) return file;

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    const fr = new FileReader();
    fr.onload = e => (image.src = e.target.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const canvas = document.createElement('canvas');
  let { width, height } = img;
  const ratio = width / height;
  if (width > height) {
    width = Math.min(width, maxDim);
    height = Math.round(width / ratio);
  } else {
    height = Math.min(height, maxDim);
    width = Math.round(height * ratio);
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;
  // 压缩后仍大于原文件则返回原文件
  if (blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.(png|webp)$/i, '.jpg'), { type: 'image/jpeg' });
}

function setInputFiles(inputEl, file) {
  const dt = new DataTransfer();
  dt.items.add(file);
  inputEl.files = dt.files;
}

if (coverInput) {
  coverInput.addEventListener('change', async () => {
    let file = coverInput.files[0];
    if (!file) return;
    // 压缩大图
    file = await compressImageFile(file);
    if (file) setInputFiles(coverInput, file);

    const reader = new FileReader();
    reader.onload = e => {
      coverPreview.src = e.target.result;
      coverPreview.style.display = 'block';
      coverLabel.style.display = 'none';
      changeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  });
}

if (changeBtn) {
  changeBtn.addEventListener('click', () => {
    coverInput.value = '';
    coverPreview.src = '';
    coverPreview.style.display = 'none';
    coverLabel.style.display = 'inline-block';
    changeBtn.style.display = 'none';
  });
}

const stepsContainer = document.getElementById('stepsContainer');
const addStepBtn = document.getElementById('addStepBtn');

function createStepBox(index) {
  const id = `step-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `
    <div class="step-card mt-2" id="${id}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong class="step-title">Step ${index}</strong>
        <button type="button" class="btn btn-sm btn-outline-danger remove-step">Delete</button>
      </div>

      <!-- 与封面一致的上传框结构 -->
      <div class="upload-like mb-2" data-upload-like>
        <input type="file" accept="image/*,video/*" class="d-none step-input" name="stepFiles" />
        <label class="upload-like__label step-label">+ Upload Step Media</label>

        <img class="preview-media step-img d-none" alt="step image preview" />
        <video class="preview-media step-video d-none" controls></video>

        <button type="button" class="btn btn-sm change-btn step-change-btn" title="Change / Remove">
          <i class="bi bi-trash"></i>
        </button>
      </div>

      <div class="text-muted step-filename small mb-2"></div>
      <textarea name="stepDescriptions" class="form-control" rows="2" placeholder="Add description ..." required></textarea>
    </div>`;
}

function renumberSteps() {
  stepsContainer.querySelectorAll('.step-card').forEach((box, idx) => {
    box.querySelector('.step-title').textContent = `Step ${idx + 1}`;
  });
}

function addStep() {
  const count = stepsContainer.querySelectorAll('.step-card').length;
  stepsContainer.insertAdjacentHTML('beforeend', createStepBox(count + 1));
}

if (stepsContainer) {
  window.addEventListener('load', () => {
    stepsContainer.classList.add('steps-grid');
    if (stepsContainer.children.length === 0) addStep();
  });

  if (addStepBtn) addStepBtn.addEventListener('click', addStep);

  function resetStepBox(box) {
    const input = box.querySelector('.step-input');
    const label = box.querySelector('.step-label');
    const img = box.querySelector('.step-img');
    const video = box.querySelector('.step-video');
    const changeBtn = box.querySelector('.step-change-btn');
    const nameEl = box.querySelector('.step-filename');

    if (input) input.value = '';
    if (img) { img.src = ''; img.classList.add('d-none'); }
    if (video) { video.src = ''; video.load(); video.classList.add('d-none'); }
    if (label) label.style.display = 'inline-block';
    if (changeBtn) changeBtn.style.display = 'none';
    if (nameEl) nameEl.textContent = '';
  }

  function setStepPreview(box, file) {
    const label = box.querySelector('.step-label');
    const img = box.querySelector('.step-img');
    const video = box.querySelector('.step-video');
    const changeBtn = box.querySelector('.step-change-btn');
    const nameEl = box.querySelector('.step-filename');

    if (!file) {
      resetStepBox(box);
      return;
    }

    if (nameEl) nameEl.textContent = file.name;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const url = target.result;
      if (img) { img.classList.add('d-none'); img.src = ''; }
      if (video) { video.classList.add('d-none'); video.src = ''; }

      if (file.type.startsWith('video/')) {
        if (video) {
          video.src = url;
          video.classList.remove('d-none');
          video.load();
        }
      } else {
        if (img) {
          img.src = url;
          img.classList.remove('d-none');
        }
      }

      if (label) label.style.display = 'none';
      if (changeBtn) changeBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  stepsContainer.addEventListener('click', (e) => {
    const box = e.target.closest('.step-card');
    if (!box) return;
    if (e.target.closest('.remove-step')) {
      box.remove();
      renumberSteps();
      return;
    }

    if (e.target.closest('.step-label')) {
      box.querySelector('.step-input').click();
      return;
    }

    if (e.target.closest('.step-change-btn')) {
      resetStepBox(box);
      return;
    }
  });

  stepsContainer.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('step-input')) return;
    const box = e.target.closest('.step-card');
    let file = e.target.files && e.target.files[0];
    if (!file) return;

    // 压缩图片以降低总请求体积，避免 Vercel 限制
    if (file.type.startsWith('image/')) {
      file = await compressImageFile(file);
      if (file) setInputFiles(e.target, file);
    }

    setStepPreview(box, file);
  });
}

const getTagsBtn = document.getElementById('getTagsBtn');
if (getTagsBtn) {
  getTagsBtn.addEventListener('click', async () => {
    const file = coverInput?.files?.[0];
    if (!file) {
      alert('Please upload a pic first!');
      return;
    }
    const tagDisplay = document.getElementById('tagDisplayArea');
    const tagInput = document.getElementById('tagsInput');

    tagDisplay.innerHTML = "<span class='text-muted'>Generating tags, please wait......</span>";

    const formData = new FormData();
    formData.append('image', file);

    const t0 = performance.now();
    try {
      const res = await fetch('/generate-tags', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.tags?.length) {
        tagDisplay.innerHTML = 'Recommendation tags：' + data.tags.map(t => `<span class="badge tag me-1">#${t}</span>`).join('');
        if (tagInput) tagInput.value = data.tags.map(t => `#${t}`).join(' ');

        // log suggest event batch for H1/H2/H3 metrics
        const suggested = data.tags.map(tag => ({
          tag,
          action: 'suggest',
          category: inferCategory(tag),
        }));
        try { await fetch('/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(suggested)
        }); } catch(e) { /* ignore */ }
      } else {
        tagDisplay.innerHTML = "<span class='text-muted'>No recommendation tags generated.</span>";
      }
    } catch (err) {
      tagDisplay.innerHTML = "<span class='text-danger'>Faild to generate tags</span>";
      console.error('❌ Failed to generate tags:', err);
    }
  });
}

// --- Logging utilities for tag actions ---
function inferCategory(tag) {
  const t = String(tag).toLowerCase();
  const isMaterial = /(cotton|linen|denim|silk|wool|polyester|nylon|rayon|leather)/.test(t);
  const isTechnique = /(patchwork|quilting|embroidery|handsewn|appli|smocking|overlock)/.test(t);
  if (isMaterial) return 'Material';
  if (isTechnique) return 'Technique';
  return 'Style';
}

async function logTagAction({ tag, action, timeMs, category }) {
  try {
    await fetch('/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, action, timeMs: typeof timeMs === 'number' ? Math.round(timeMs) : null, category: category || inferCategory(tag) })
    });
  } catch (e) { /* swallow */ }
}

// Wire basic editable tag interactions if any dynamic UI renders into #tagDisplayArea
const tagDisplay = document.getElementById('tagDisplayArea');
if (tagDisplay) {
  let suggestShownAt = 0;
  const observer = new MutationObserver(() => {
    // when suggestions are inserted, start timer
    suggestShownAt = performance.now();
    // add click handler on each badge to simulate accept/remove/edit
    tagDisplay.querySelectorAll('.badge.tag').forEach(badge => {
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', () => {
        const now = performance.now();
        logTagAction({ tag: badge.textContent.replace(/^#/, ''), action: 'accept', timeMs: now - suggestShownAt });
        badge.classList.toggle('bg-success');
      }, { once: true });
    });
  });
  observer.observe(tagDisplay, { childList: true, subtree: true });
}