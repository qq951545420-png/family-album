'use strict';
const $ = (id) => document.getElementById(id);
let state = {members:[],memories:[]}, selectedMember='all', mediaType='all', visibleMemories=[], viewingId=null, writable=false, submitting=false, confirmAction=null;
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const memberName=(id)=>state.members.find(m=>m.id===id)?.name||'家庭共享';
const mediaUrl=(m)=>'/media/'+encodeURIComponent(m.file);
const friendlyDate=(s)=>s.slice(0,10).replaceAll('-','.');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,4000);}
function openDialog(id){$(id).showModal();}
function closeDialog(dialog){if(dialog.id==='viewer'){$('viewer-media').querySelector('video')?.pause();$('viewer-media').replaceChildren();}dialog.close();}
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{if(!submitting)closeDialog(button.closest('dialog'));}));
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d&&!submitting){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d);}});d.addEventListener('cancel',e=>{if(submitting)e.preventDefault();if(d.id==='viewer')$('viewer-media').querySelector('video')?.pause();});});
async function api(path,options={}){const response=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})},cache:'no-store'});let body;try{body=await response.json();}catch{throw new Error('连接暂时没有回应，请稍后再试。');}if(!response.ok)throw new Error(body.error||'保存失败，请稍后再试。');return body;}
function applyState(next){state=next;render();}
async function load(){try{const result=await api('state');writable=result.writable;applyState(result.state);$('notice').hidden=writable;if(!writable)$('notice').textContent='相册已打开，上传与修改功能正在连接中。';}catch(error){$('notice').hidden=false;$('notice').textContent=error.message;try{const r=await fetch('/state.json',{cache:'no-store'});if(!r.ok)throw error;applyState(await r.json());}catch{$('hero-count').textContent='暂时无法读取回忆，请点击刷新。';}}}
function render(){
  if(selectedMember!=='all'&&!state.members.some(m=>m.id===selectedMember))selectedMember='all';
  const photoCount=state.memories.filter(m=>m.type==='photo').length, videoCount=state.memories.length-photoCount;
  $('hero-count').textContent=`已经收藏 ${photoCount} 张照片 · ${videoCount} 段影像`;
  const photos=state.memories.filter(m=>m.type==='photo');
  if(photos.length){$('hero-back').src=mediaUrl(photos[Math.min(1,photos.length-1)]);$('hero-front').src=mediaUrl(photos[Math.min(3,photos.length-1)]);}
  $('member-list').innerHTML=`<button class="member-card ${selectedMember==='all'?'active':''}" data-member="all" aria-pressed="${selectedMember==='all'}"><span class="avatar all">⌂</span><span class="member-text"><b>所有家人</b><small>${state.memories.length} 个美好瞬间</small></span></button>`+state.members.map((m,i)=>`<button class="member-card ${selectedMember===m.id?'active':''}" data-member="${esc(m.id)}" aria-pressed="${selectedMember===m.id}"><span class="avatar" style="background:${['#e8e9db','#ede1d3','#dee8df','#e5e1ec','#eee6cd'][i%5]}">${esc(m.name.slice(0,1))}</span><span class="member-text"><b>${esc(m.name)}</b><small>${state.memories.filter(p=>p.memberId===m.id).length} 个美好瞬间</small></span></button>`).join('')+'<button class="member-card member-add" id="add-member"><span>＋</span> 新添一位家人</button>';
  $('member-list').querySelectorAll('[data-member]').forEach(b=>b.addEventListener('click',()=>{selectedMember=b.dataset.member;render();}));$('add-member').addEventListener('click',openMember);
  renderGallery();
}
function renderGallery(){
  const term=$('search').value.trim().toLocaleLowerCase(),direction=$('sort').value==='asc'?1:-1;
  visibleMemories=state.memories.filter(m=>(selectedMember==='all'||m.memberId===selectedMember)&&(mediaType==='all'||m.type===mediaType)&&(!term||(m.caption+' '+memberName(m.memberId)+' '+m.date).toLocaleLowerCase().includes(term))).sort((a,b)=>direction*(a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)));
  $('memories-heading').firstChild.textContent=selectedMember==='all'?'所有回忆 ':memberName(selectedMember)+'的回忆 ';
  $('count-badge').textContent=visibleMemories.length;
  $('gallery').innerHTML=visibleMemories.map(m=>`<button class="memory-card" data-memory="${esc(m.id)}" aria-label="${m.type==='video'?'播放视频':'查看照片'}：${esc(m.caption)}"><span class="card-image">${m.type==='photo'?`<img src="${mediaUrl(m)}" alt="${esc(m.caption)}" loading="lazy" decoding="async">`:`<video src="${mediaUrl(m)}#t=0.1" preload="metadata" muted playsinline aria-hidden="true"></video><span class="play-icon">▶</span>`}<span class="media-tag">${m.type==='video'?'VIDEO':'PHOTO'}</span></span><span class="card-copy"><span class="card-caption">${esc(m.caption)}</span><span class="card-meta"><span class="card-person"><i class="person-dot"></i>${esc(memberName(m.memberId))}</span><time datetime="${esc(m.date)}">${friendlyDate(m.date)}</time></span></span></button>`).join('');
  $('gallery').querySelectorAll('[data-memory]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.memory)));
  $('empty').hidden=visibleMemories.length>0;
}
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{mediaType=b.dataset.type;document.querySelectorAll('[data-type]').forEach(t=>t.classList.toggle('active',t===b));renderGallery();}));
$('search').addEventListener('input',renderGallery);$('sort').addEventListener('change',renderGallery);$('refresh').addEventListener('click',async()=>{await load();toast('相册已刷新');});
function requireWritable(){if(writable)return true;toast('上传和修改尚未启用，请稍后再试。');return false;}
function openMember(){if(!requireWritable())return;$('member-form').reset();$('member-error').textContent='';openDialog('member-dialog');}
$('member-form').addEventListener('submit',async e=>{e.preventDefault();if(submitting)return;const name=$('member-name').value.trim();if(!name)return;submitting=true;const b=e.submitter;b.disabled=true;try{const r=await api('members',{method:'POST',body:JSON.stringify({name})});selectedMember=r.memberId;applyState(r.state);closeDialog($('member-dialog'));toast('家里又多了一位成员');}catch(err){$('member-error').textContent=err.message;}finally{submitting=false;b.disabled=false;}});
function renderManage(){$('manage-list').innerHTML=state.members.map(m=>`<div class="manage-item"><span>${esc(m.name)} · ${state.memories.filter(p=>p.memberId===m.id).length} 个瞬间</span>${m.id==='shared'?'<span class="muted">默认相册</span>':`<button class="button danger" data-remove-member="${esc(m.id)}">移除</button>`}</div>`).join('');$('manage-list').querySelectorAll('[data-remove-member]').forEach(b=>b.addEventListener('click',()=>{if(!requireWritable())return;confirmDelete('移除这位成员？','这位成员的照片和视频会移到“家庭共享”，文件会继续保留。',async()=>{const r=await api('members/'+b.dataset.removeMember,{method:'DELETE'});applyState(r.state);renderManage();toast('成员已移除，回忆已保留');});}));}
$('manage-members').addEventListener('click',()=>{renderManage();openDialog('manage-dialog');});$('add-member-manage').addEventListener('click',()=>{if(!requireWritable())return;closeDialog($('manage-dialog'));openMember();});
function openUpload(){if(!requireWritable())return;$('upload-form').reset();$('upload-date').value=today();$('upload-member').innerHTML=state.members.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');$('upload-member').value=selectedMember==='all'?'shared':selectedMember;$('file-list').replaceChildren();$('upload-error').textContent='';$('upload-progress').hidden=true;openDialog('upload-dialog');}
['upload-top','upload-empty'].forEach(id=>$(id).addEventListener('click',openUpload));
function showFiles(){$('file-list').innerHTML=Array.from($('upload-files').files).map(f=>`<div><span>${esc(f.name)}</span><span>${(f.size/1024/1024).toFixed(2)} MB</span></div>`).join('');}
$('upload-files').addEventListener('change',showFiles);$('dropzone').addEventListener('dragover',()=>{$('dropzone').classList.add('dragover');});['dragleave','drop'].forEach(t=>$('dropzone').addEventListener(t,()=>$('dropzone').classList.remove('dragover')));
function base64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('无法读取文件：'+file.name));r.readAsDataURL(file);});}
$('upload-form').addEventListener('submit',async e=>{
  e.preventDefault();if(submitting)return;
  const files=Array.from($('upload-files').files), memberId=$('upload-member').value,date=$('upload-date').value,caption=$('upload-caption').value.trim();
  const supported=/\.(jpe?g|png|webp|gif|mp4)$/i;
  const invalid=files.find(f=>!supported.test(f.name)||f.size>20*1024*1024||f.size===0);
  if(invalid){$('upload-error').textContent=`“${invalid.name}”格式不支持、文件为空或超过 20 MB。`;return;}
  if(!files.length)return;submitting=true;$('upload-submit').disabled=true;$('upload-error').textContent='';$('upload-progress').hidden=false;
  let done=0;
  try{
    for(const file of files){
      $('progress').value=done/files.length*100;$('progress-text').textContent=`正在上传 ${done+1}/${files.length}：${file.name}`;
      const content=await base64(file);
      const blob=await api('blob',{method:'POST',body:JSON.stringify({content,encoding:'base64'})});
      const r=await api('memories',{method:'POST',body:JSON.stringify({blobSha:blob.sha,name:file.name,size:file.size,memberId,date,caption:caption||file.name.replace(/\.[^.]+$/,'').replaceAll('_',' ')})});
      applyState(r.state);done++;$('progress').value=done/files.length*100;
    }
    closeDialog($('upload-dialog'));toast(`已收藏 ${done} 个新瞬间`);
  }catch(err){
    const remaining=files.slice(done);const transfer=new DataTransfer();remaining.forEach(f=>transfer.items.add(f));$('upload-files').files=transfer.files;showFiles();
    $('upload-error').textContent=(done?`已有 ${done} 个文件保存成功。\n`:'')+err.message+'\n可以重试剩余文件。';
  }finally{submitting=false;$('upload-submit').disabled=false;$('progress-text').textContent=`已保存 ${done}/${files.length}`;}
});
function view(id){const m=state.memories.find(m=>m.id===id);if(!m)return;viewingId=id;$('viewer-media').querySelector('video')?.pause();const el=document.createElement(m.type==='video'?'video':'img');el.src=mediaUrl(m);if(m.type==='video'){el.controls=true;el.playsInline=true;el.preload='metadata';}else{el.alt=m.caption;}$('viewer-media').replaceChildren(el);$('viewer-caption').textContent=m.caption;$('viewer-meta').textContent=`${memberName(m.memberId)} · ${friendlyDate(m.date)} · ${(m.size/1024/1024).toFixed(2)} MB`;$('download').href=mediaUrl(m)+'?download=1';$('download').download=m.originalName||m.file;const i=visibleMemories.findIndex(m=>m.id===id);$('viewer-count').textContent=`${i+1} / ${visibleMemories.length}`;$('previous').disabled=i<=0;$('next').disabled=i>=visibleMemories.length-1;if(!$('viewer').open)openDialog('viewer');}
function step(direction){const i=visibleMemories.findIndex(m=>m.id===viewingId);if(visibleMemories[i+direction])view(visibleMemories[i+direction].id);}
$('previous').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));document.addEventListener('keydown',e=>{if($('viewer').open&&!$('confirm-dialog').open){if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);}});
function confirmDelete(title,message,action){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-error').textContent='';confirmAction=action;openDialog('confirm-dialog');}
$('confirm-submit').addEventListener('click',async()=>{if(submitting||!confirmAction)return;submitting=true;$('confirm-submit').disabled=true;try{await confirmAction();closeDialog($('confirm-dialog'));}catch(err){$('confirm-error').textContent=err.message;}finally{submitting=false;$('confirm-submit').disabled=false;}});
$('delete-media').addEventListener('click',()=>{if(!requireWritable())return;const id=viewingId;confirmDelete('删除这条回忆？','这会从共享相册和 GitHub 当前版本中移除文件。GitHub 提交历史可能保留旧版本。',async()=>{const r=await api('memories/'+id,{method:'DELETE'});applyState(r.state);closeDialog($('viewer'));toast('这条回忆已移除');});});
load();
