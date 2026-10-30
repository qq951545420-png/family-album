'use strict';
(() => {
 const tracks=[
  {title:'Carefree',src:'/music-carefree.mp3',source:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037',description:'轻快的尤克里里，收藏阳光里的小日常。',changes:'已压缩并降低音量。'},
  {title:'Almost New',src:'/music-almost-new.mp3',source:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1800008',description:'温柔的钢琴，陪我们慢慢翻看回忆。',changes:'已压缩并降低音量。'},
  {title:'Relaxing Piano Music',src:'/music-relaxing-piano.mp3',source:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500075',description:'一段安静的钢琴时光。',changes:'节选前 4 分钟，已压缩、降低音量并淡出。'}
 ];
 const audio=document.getElementById('background-music'),button=document.getElementById('music-toggle'),next=document.getElementById('music-next'),label=document.getElementById('music-label'),status=document.getElementById('music-status'),volume=document.getElementById('music-volume');
 if(!audio||!button)return;
 let wanted=false,sequence=0,current=-1,bag=[];
 const videoPlaying=()=>Array.from(document.querySelectorAll('video')).some(v=>!v.paused&&!v.ended);
 let savedVolume=50;try{const saved=localStorage.getItem('family-album-music-volume');if(saved!==null&&Number.isFinite(Number(saved)))savedVolume=Math.max(0,Math.min(100,Number(saved)));}catch{}
 volume.value=String(savedVolume);audio.volume=savedVolume/100;
 function paint(){const playing=!audio.paused;button.classList.toggle('is-playing',playing);button.setAttribute('aria-pressed',String(wanted));label.textContent=playing?'暂停音乐':wanted&&videoPlaying()?'视频播放中':wanted&&audio.readyState<3?'音乐加载中…':'播放音乐';button.setAttribute('aria-label',wanted?'暂停背景音乐':'播放背景音乐');}
 function selectNext(){
  if(!bag.length){bag=tracks.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.length>1&&bag[bag.length-1]===current)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];}
  current=bag.pop();sequence++;audio.pause();audio.src=tracks[current].src;
  document.getElementById('music-title').textContent=tracks[current].title;
  document.getElementById('music-description').textContent=tracks[current].description;
  document.getElementById('music-source').href=tracks[current].source;
  document.getElementById('music-credit-title').textContent='“'+tracks[current].title+'”';
  document.getElementById('music-changes').textContent=tracks[current].changes;
 }
 function stopForError(){wanted=false;sequence++;audio.pause();status.textContent='音乐暂时未能播放，再点一次可以重试，或换一首。';paint();}
 async function play(){
  if(!wanted||document.hidden||videoPlaying()){paint();return;}
  if(current<0)selectNext();
  if(audio.error)audio.load();
  const ticket=++sequence;status.textContent='正在打开音乐…';paint();
  try{await audio.play();if(ticket!==sequence||!wanted||document.hidden||videoPlaying()){if(ticket===sequence)audio.pause();return;}status.textContent='随机播放 · '+tracks[current].title;paint();}
  catch(error){if(ticket!==sequence)return;if(error.name==='AbortError'){paint();return;}stopForError();}
 }
 button.addEventListener('click',()=>{wanted=!wanted;if(wanted){if(videoPlaying()){status.textContent='视频结束后会继续播放背景音乐。';paint();}else play();}else{sequence++;audio.pause();status.textContent='音乐已暂停。';paint();}});
 next.addEventListener('click',()=>{wanted=true;selectNext();if(videoPlaying()){status.textContent='已换好下一首，视频结束后播放。';paint();}else play();});
 audio.addEventListener('ended',()=>{if(wanted){selectNext();play();}});
 volume.addEventListener('input',()=>{audio.volume=Number(volume.value)/100;try{localStorage.setItem('family-album-music-volume',volume.value);}catch{}});
 audio.addEventListener('play',()=>{if(!wanted||videoPlaying()||document.hidden)audio.pause();paint();});
 audio.addEventListener('pause',paint);audio.addEventListener('waiting',()=>{if(wanted)status.textContent='音乐加载中，请稍候…';paint();});audio.addEventListener('error',stopForError);
 const reconcileVideo=event=>{if(event.target.tagName!=='VIDEO')return;if(videoPlaying()){sequence++;audio.pause();if(wanted)status.textContent='视频播放时，背景音乐暂时暂停。';paint();}else if(wanted)play();};
 ['play','pause','ended'].forEach(name=>document.addEventListener(name,reconcileVideo,true));
 document.addEventListener('visibilitychange',()=>{if(document.hidden){sequence++;audio.pause();paint();}else if(wanted)play();});
 // First playback always follows an explicit user click, including on phones.
 paint();
})();
