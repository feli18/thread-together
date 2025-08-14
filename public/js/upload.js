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
  updateAddStepButton();
}

function updateAddStepButton() {
  if (!addStepBtn) return;
  const count = stepsContainer.querySelectorAll('.step-card').length;
  if (count === 0) {
    addStepBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i>Add First Step';
  } else {
    addStepBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i>Add Another Step';
  }
}

if (stepsContainer) {
  window.addEventListener('load', () => {
    stepsContainer.classList.add('steps-grid');
    updateAddStepButton();
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
      updateAddStepButton();
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
let _suggestedTags = [];
let _suggestShownAt = 0;

document.addEventListener('DOMContentLoaded', () => {
  const expGroupBadge = document.querySelector('.badge');
  if (expGroupBadge && expGroupBadge.textContent.includes('Group')) {
    console.log(`🧪 A/B Test - You are in: ${expGroupBadge.textContent.trim()}`);
  }
});
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

        // cache for later diff at form submit
        _suggestedTags = data.tags.map(t => String(t).toLowerCase());
        _suggestShownAt = performance.now();
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

// --- Diff final tags vs suggestions on form submit ---
(function registerFormSubmitDiff() {
  const form = document.querySelector('form[action="/upload"]');
  if (!form) return;
  form.addEventListener('submit', async () => {
    const input = document.getElementById('tagsInput');
    if (!input || !_suggestedTags.length) return;
    const finalTags = parseTags(input.value);
    const now = performance.now();

    const suggestedSet = new Set(_suggestedTags);
    const finalSet = new Set(finalTags);

    // accept: intersection
    const accepted = finalTags.filter(t => suggestedSet.has(t));
    // removed: suggested not in final
    const removed = _suggestedTags.filter(t => !finalSet.has(t));
    // added: final not in suggested
    const added   = finalTags.filter(t => !suggestedSet.has(t));

    // try to infer edits by pairing removed and added with high similarity
    const edits = [];
    const remainingAdded = [];
    added.forEach(a => {
      const match = removed.find(r => isLikelyEdit(r, a));
      if (match) {
        edits.push({ from: match, to: a });
        // remove matched r from removed list
        const idx = removed.indexOf(match);
        if (idx >= 0) removed.splice(idx, 1);
      } else {
        remainingAdded.push(a);
      }
    });

    const events = [];
    accepted.forEach(tag => events.push({ tag, action: 'accept', timeMs: now - (_suggestShownAt || suggestShownAt), category: inferCategory(tag) }));
    removed.forEach(tag  => events.push({ tag, action: 'remove', timeMs: now - (_suggestShownAt || suggestShownAt), category: inferCategory(tag) }));
    remainingAdded.forEach(tag => events.push({ tag, action: 'add', timeMs: now - (_suggestShownAt || suggestShownAt), category: inferCategory(tag) }));
    edits.forEach(pair => events.push({ tag: pair.to, action: 'edit', timeMs: now - (_suggestShownAt || suggestShownAt), category: inferCategory(pair.to) }));

    if (events.length) {
      try { await fetch('/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(events) }); } catch(e){}
    }
  });

  function parseTags(text) {
    if (!text) return [];
    return text
      .split(/[#,\s]+/).map(s => s.trim()).filter(Boolean)
      .map(s => s.toLowerCase());
  }

  function isLikelyEdit(fromTag, toTag) {
    if (!fromTag || !toTag) return false;
    if (fromTag === toTag) return false;
    // quick checks
    if (toTag.includes(fromTag) || fromTag.includes(toTag)) return true;
    // simple Levenshtein threshold <=2
    return levenshtein(fromTag, toTag) <= 2;
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n; if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }
})();