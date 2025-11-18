(function(){
    const bar1 = document.getElementById('bar1');
    const bar2 = document.getElementById('bar2');
    const opsEl = document.getElementById('ops');
    const valEl = document.getElementById('val');
    const expectEl = document.getElementById('expect');
    const okEl = document.getElementById('ok');
    const startRace = document.getElementById('startRace');
    const startSync = document.getElementById('startSync');
    const resetDemo = document.getElementById('resetDemo');
    let counter = 0; let ops = 0; let running = false;

    function reset(){ counter = 0; ops = 0; running = false; bar1.style.width = '0%'; bar2.style.width = '0%'; opsEl.textContent = '0'; valEl.textContent = '0'; expectEl.textContent = '0'; okEl.textContent = '未开始'; okEl.className = 'result-bad'; }
    function update(){ opsEl.textContent = String(ops); valEl.textContent = String(counter); expectEl.textContent = String(ops); okEl.textContent = (counter === ops ? '正确' : '错误'); okEl.className = (counter === ops ? 'result-ok' : 'result-bad'); }
    function runWorker(step, total, updateBar){ return new Promise(resolve => { let done = 0; function loop(){ if (!running) return resolve(); if (done >= total) return resolve(); const before = counter; counter = before + 1; ops++; if (done % 50 === 0) updateBar(done / total * 100); done++; setTimeout(loop, step); } loop(); }); }
    function runWorkerSync(step, total, updateBar){ return new Promise(resolve => { let done = 0; function loop(){ if (!running) return resolve(); if (done >= total) return resolve(); counter++; ops++; if (done % 50 === 0) updateBar(done / total * 100); done++; setTimeout(loop, step); } loop(); }); }
    function start(isSync){ if (running) return; running = true; const total = 1000; expectEl.textContent = String(total * 2); ops = 0; counter = 0; const w1 = isSync ? runWorkerSync(1, total, p => bar1.style.width = p + '%') : runWorker(1, total, p => bar1.style.width = p + '%'); const w2 = isSync ? runWorkerSync(1, total, p => bar2.style.width = p + '%') : runWorker(1, total, p => bar2.style.width = p + '%'); const tick = setInterval(update, 50); Promise.all([w1,w2]).then(()=>{ clearInterval(tick); running = false; update(); }); }
    startRace && startRace.addEventListener('click', function(){ start(false); });
    startSync && startSync.addEventListener('click', function(){ start(true); });
    resetDemo && resetDemo.addEventListener('click', reset);
    document.addEventListener('slidechange', function(){ reset(); });
    reset();
})();

(function(){
    const blockBtn = document.getElementById('blockBtn');
    const threadBtn = document.getElementById('threadBtn');
    const status = document.getElementById('status');
    const progress = document.getElementById('progress');
    if (!blockBtn) return;
    function setBusy(on){
        blockBtn.disabled = threadBtn.disabled = on;
        status.textContent = on ? '任务进行中…' : '准备就绪';
        progress.style.width = '0%';
    }
    blockBtn.onclick = function(){
        setBusy(true);
        let p = 0;
        const id = setInterval(()=>{
            p += 2;
            progress.style.width = p + '%';
            if (p >= 100){ clearInterval(id); setBusy(false); }
        }, 50);
        const end = Date.now() + 5000;
        while(Date.now() < end){}
    };
    threadBtn.onclick = function(){
        setBusy(true);
        let p = 0;
        const id = setInterval(()=>{
            p += 2;
            progress.style.width = p + '%';
            if (p >= 100){ clearInterval(id); setBusy(false); }
        }, 50);
    };
})();

(function(){
    const raceBtn = document.getElementById('raceBtn');
    const safeBtn = document.getElementById('safeBtn');
    const raceRes = document.getElementById('raceRes');
    const bar1 = document.getElementById('r1');
    const bar2 = document.getElementById('r2');
    if (!raceBtn) return;
    let counter = 0, running = false;
    function resetRace(){
        counter = 0; running = false;
        bar1.style.width = bar2.style.width = '0%';
        raceRes.textContent = '未开始'; raceRes.className = 'result-bad';
    }
    async function raceTask(total, bar, safe){
        for(let i = 0; i < total; i++){
            if (!running) break;
            if (safe){ counter++; } else { const t = counter; counter = t + 1; }
            if (i % 100 === 0){ bar.style.width = (i / total * 100) + '%'; await new Promise(r => setTimeout(r, 1)); }
        }
    }
    async function start(safe){
        if (running) return;
        resetRace(); running = true;
        const total = 100000;
        await Promise.all([
            raceTask(total, bar1, safe),
            raceTask(total, bar2, safe)
        ]);
        running = false;
        raceRes.textContent = String(counter);
        raceRes.className = (counter === total * 2 ? 'result-ok' : 'result-bad');
    }
    raceBtn.onclick = () => start(false);
    safeBtn.onclick = () => start(true);
})();

(function(){
    const prodSpeed = document.getElementById('prodSpeed');
    const consSpeed = document.getElementById('consSpeed');
    const capEl = document.getElementById('cap');
    const warn = document.getElementById('warn');
    const boxes = document.getElementById('boxes');
    if (!prodSpeed) return;
    const CAP = 10;
    let q = 0, running = true, prodInt, consInt;
    function render(){
        capEl.textContent = q;
        warn.textContent = q >= CAP ? '（爆仓！）' : q === 0 ? '（缺货！）' : '';
        warn.style.color = q >= CAP ? '#c62828' : q === 0 ? '#2e7d32' : '#666';
        boxes.innerHTML = '';
        for(let i = 0; i < CAP; i++){
            const d = document.createElement('div');
            d.style.flex = '1'; d.style.border = '1px solid #ccc';
            d.style.background = i < q ? '#52c41a' : '#fff';
            boxes.appendChild(d);
        }
    }
    function start(){
        clearInterval(prodInt); clearInterval(consInt);
        const pTime = 1100 - prodSpeed.value * 100;
        const cTime = 1100 - consSpeed.value * 100;
        prodInt = setInterval(()=>{
            if(q < CAP){ q++; render(); }
        }, pTime);
        consInt = setInterval(()=>{
            if(q > 0){ q--; render(); }
        }, cTime);
    }
    prodSpeed.oninput = consSpeed.oninput = start;
    start();
})();

(function(){
  const imgs = document.querySelectorAll('.media-block__visual img');
  if (!('IntersectionObserver' in window)) {
    imgs.forEach(img => {
      img.classList.add('fade-in', 'is-visible');
    });
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fade-in', 'is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  imgs.forEach(img => io.observe(img));
})();