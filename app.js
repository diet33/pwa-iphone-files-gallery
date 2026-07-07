(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const home=$('home'), viewer=$('viewer'), thumbScreen=$('thumbScreen');
  const fileInput=$('fileInput'), folderInput=$('folderInput');
  const stage=$('stage'), photo=$('photo'), count=$('count'), nameEl=$('name'), thumbs=$('thumbs');
  let list=[], index=Number(localStorage.getItem('pwaGallery:lastIndex')||0);
  let scale=1, tx=0, ty=0, startX=0, startY=0, lastX=0, lastY=0, dragging=false;
  let pointers=new Map(), pinchStart=0, pinchScale=1;
  const imageExt=/\.(jpg|jpeg|png|gif|webp|heic|heif|bmp|avif)$/i;

  function clean(){ for(const it of list) URL.revokeObjectURL(it.url); list=[]; }
  function filesToList(files){ return Array.from(files).filter(f=>f.type.startsWith('image/')||imageExt.test(f.name)).sort((a,b)=>{const x=a.webkitRelativePath||a.name;const y=b.webkitRelativePath||b.name;return x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'});}); }
  function openFiles(files){ const arr=filesToList(files); if(!arr.length){ alert('이미지 파일이 없습니다.'); return; } clean(); list=arr.map(f=>({file:f,name:f.webkitRelativePath||f.name,url:URL.createObjectURL(f)})); index=Math.min(Math.max(index,0),list.length-1); localStorage.setItem('pwaGallery:lastCount',String(list.length)); renderThumbs(); show(index); }
  function apply(){ photo.style.transform=`translate3d(${tx}px,${ty}px,0) scale(${scale})`; }
  function resetZoom(){ scale=1; tx=0; ty=0; apply(); }
  function show(i){ if(!list.length)return; index=(i+list.length)%list.length; localStorage.setItem('pwaGallery:lastIndex',String(index)); home.classList.add('hidden'); thumbScreen.classList.add('hidden'); viewer.classList.remove('hidden'); resetZoom(); photo.src=list[index].url; photo.alt=list[index].name; count.textContent=`${index+1} / ${list.length}`; nameEl.textContent=list[index].name; }
  function next(){ show(index+1); } function prev(){ show(index-1); }
  function renderThumbs(){ thumbs.innerHTML=''; list.forEach((it,i)=>{ const b=document.createElement('button'); b.className='thumb'; b.type='button'; b.innerHTML=`<img src="${it.url}" alt=""><span>${i+1}</span>`; b.onclick=()=>show(i); thumbs.appendChild(b); }); }
  function showHome(){ viewer.classList.add('hidden'); thumbScreen.classList.add('hidden'); home.classList.remove('hidden'); }
  function showThumbs(){ viewer.classList.add('hidden'); home.classList.add('hidden'); thumbScreen.classList.remove('hidden'); }

  fileInput.onchange=e=>openFiles(e.target.files);
  folderInput.onchange=e=>openFiles(e.target.files);
  $('nextBtn').onclick=next; $('prevBtn').onclick=prev; $('closeBtn').onclick=showHome; $('thumbBtn').onclick=showThumbs; $('viewerBtn').onclick=()=>show(index); $('resetBtn').onclick=()=>{clean();showHome();};

  function dist(a,b){ return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
  stage.addEventListener('pointerdown',e=>{ if(!list.length)return; stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId,e); dragging=true; startX=lastX=e.clientX; startY=lastY=e.clientY; if(pointers.size===2){const a=[...pointers.values()]; pinchStart=dist(a[0],a[1]); pinchScale=scale;} });
  stage.addEventListener('pointermove',e=>{ if(!dragging)return; pointers.set(e.pointerId,e); if(pointers.size===2){const a=[...pointers.values()]; const d=dist(a[0],a[1]); if(pinchStart){ scale=Math.max(1,Math.min(6,pinchScale*d/pinchStart)); apply(); } return;} const dx=e.clientX-lastX, dy=e.clientY-lastY, totalX=e.clientX-startX; if(scale>1){tx+=dx;ty+=dy;}else{tx=totalX*.22;} apply(); lastX=e.clientX; lastY=e.clientY; });
  function end(e){ pointers.delete(e.pointerId); if(pointers.size===0){ dragging=false; const sx=e.clientX-startX, sy=e.clientY-startY; if(scale<=1 && Math.abs(sx)>62 && Math.abs(sx)>Math.abs(sy)){ sx<0?next():prev(); } else if(scale<=1){ resetZoom(); } } }
  stage.addEventListener('pointerup',end); stage.addEventListener('pointercancel',end);
  stage.addEventListener('dblclick',()=>{ if(scale===1){scale=2;tx=0;ty=0;apply();} else resetZoom(); });
  window.addEventListener('keydown',e=>{ if(e.key==='ArrowRight')next(); if(e.key==='ArrowLeft')prev(); if(e.key==='Escape')showHome(); });

  if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
})();