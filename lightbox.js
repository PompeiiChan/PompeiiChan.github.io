/* ===== One Page 截图灯箱（mac-window 内 img 通用）=====
 * 点击 mac 窗口里的截图 → 从原图位置「飞」到屏幕中央放大；
 * 滚轮缩放（1x~5x）、放大后可拖拽平移；点空白 / ✕ / Esc 关闭并飞回原位。
 */
(function () {
  var DURATION = 1000; // ms，飞入/飞出时长（不要特别快）
  var EASE = 'cubic-bezier(.22,.61,.36,1)';
  var MAX_SCALE = 5;

  var openImg = null, clone = null, overlay = null, closeBtn = null;
  var target = { left: 0, top: 0, w: 0, h: 0 };
  var userScale = 1, tx = 0, ty = 0;
  var dragging = false, lastX = 0, lastY = 0, closing = false;

  function targetRect() {
    var vw = innerWidth, vh = innerHeight;
    var nw = openImg.naturalWidth, nh = openImg.naturalHeight;
    var aspect = (nw && nh) ? nw / nh : 1;
    var maxW = vw * 0.92, maxH = vh * 0.92;
    var w, h;
    if (maxW / aspect <= maxH) { w = maxW; h = maxW / aspect; }
    else { h = maxH; w = maxH * aspect; }
    return { left: (vw - w) / 2, top: (vh - h) / 2, w: w, h: h };
  }

  function applyTransform() {
    clone.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + userScale + ')';
  }

  function open(img) {
    if (overlay) return;
    openImg = img;
    var rect = img.getBoundingClientRect();

    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);

    clone = img.cloneNode(true);
    clone.className = 'lb-clone';
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    Object.assign(clone.style, {
      position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
      margin: '0', maxWidth: 'none', maxHeight: 'none',
      transformOrigin: 'center center', transform: 'translate(0,0) scale(1)',
      cursor: 'grab', zIndex: '10001',
      transition: 'left ' + DURATION + 'ms ' + EASE + ',top ' + DURATION + 'ms ' + EASE +
        ',width ' + DURATION + 'ms ' + EASE + ',height ' + DURATION + 'ms ' + EASE +
        ',opacity ' + DURATION + 'ms ' + EASE
    });
    overlay.appendChild(clone);
    target = targetRect();

    // 双 rAF 确保起始帧渲染后再飞向中心
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
        Object.assign(clone.style, {
          left: target.left + 'px', top: target.top + 'px',
          width: target.w + 'px', height: target.h + 'px'
        });
      });
    });

    closeBtn = document.createElement('button');
    closeBtn.className = 'lb-close';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);

    overlay.addEventListener('click', onOverlayClick);
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    clone.addEventListener('wheel', onWheel, { passive: false });
    clone.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
  }

  function onOverlayClick(e) {
    if (e.target === overlay) close();
  }

  function onWheel(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.88 : 1.14;
    userScale = Math.min(MAX_SCALE, Math.max(1, userScale * delta));
    if (userScale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }

  function onDown(e) {
    if (userScale <= 1) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    try { clone.setPointerCapture(e.pointerId); } catch (_) {}
    clone.style.cursor = 'grabbing';
    clone.addEventListener('pointermove', onMove);
    clone.addEventListener('pointerup', onUp);
    clone.addEventListener('pointercancel', onUp);
  }
  function onMove(e) {
    if (!dragging) return;
    tx += e.clientX - lastX; ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    applyTransform();
  }
  function onUp() {
    dragging = false;
    clone.style.cursor = 'grab';
    clone.removeEventListener('pointermove', onMove);
    clone.removeEventListener('pointerup', onUp);
    clone.removeEventListener('pointercancel', onUp);
  }

  function onKey(e) { if (e.key === 'Escape') close(); }

  function close() {
    if (!overlay || closing) return;
    closing = true;
    var rect = openImg.getBoundingClientRect();
    userScale = 1; tx = 0; ty = 0;
    applyTransform();
    Object.assign(clone.style, {
      left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px'
    });
    overlay.style.opacity = '0';
    setTimeout(function () {
      if (overlay) overlay.remove();
      overlay = null; clone = null; openImg = null; closing = false;
      document.removeEventListener('keydown', onKey);
    }, DURATION);
  }

  function bind() {
    document.querySelectorAll('.mac-window img').forEach(function (img) {
      if (img.dataset.lbBound) return;
      img.dataset.lbBound = '1';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () { open(img); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
