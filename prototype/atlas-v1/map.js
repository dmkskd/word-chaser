'use strict';
const SVG_NS='http://www.w3.org/2000/svg';
const TRAILS={
 treasure:{word:'treasure',meaning:'Something precious. Its name has a history hidden in plain sight.',stages:[{place:'england',word:'treasure',language:'English',period:'Today'},{place:'france',word:'tresor',language:'Old French',period:'Borrowed into English in the 1100s',clue:'Tresor! The sounds are close, and the history agrees: English borrowed treasure from Old French. This is an earlier stop.',hint:'Look further south-east. This French word has an older Latin ancestor.'},{place:'rome',word:'thesaurus',language:'Latin',period:'An earlier ancestor',clue:'Thesaurus meant a store of precious things. It is an ancestor of Old French tresor—and of Italian tesoro. The two branches meet here.'}],hint:'Try crossing the Channel. A French word is hiding on the other side.',complete:'English treasure ← Old French tresor ← Latin thesaurus. Italian tesoro is a relative on a different branch. The deeper history reaches Greek.'},
 piano:{word:'piano',meaning:'A musical instrument. Could its name be hiding a missing piece?',stages:[{place:'england',word:'piano',language:'English',period:'Today'},{place:'florence',word:'pianoforte',language:'Italian',period:'The longer instrument name',clue:'Piano + forte: soft + loud, in Italian. English piano is a shortened form of pianoforte. The instrument’s name gives away its special trick.'}],hint:'Head south-east to Italy. Look for the longer name of this instrument.',complete:'English piano ← Italian pianoforte. A word crossed languages and became shorter. This is the instrument-name trail; piano has a deeper history too.'},
 window:{word:'window',meaning:'An everyday opening with a surprisingly poetic name.',stages:[{place:'england',word:'window',language:'English',period:'Today'},{place:'norse',word:'vindauga',language:'Old Norse',period:'A northern ancestor',clue:'Vindr means wind. Auga means eye. This Old Norse word paints a picture: a “wind-eye”. English window belongs to this northern story.'}],hint:'Search north-east, across the sea. Norse-speaking settlers left a word clue.',complete:'English window ← a Norse word related to Old Norse vindauga, “wind-eye”. The exact first spoken form borrowed into English was not recorded.'}
};
Object.assign(TRAILS,window.GREEK_CASES?.trails||{});
const ERAS={today:{icon:'🏙️',name:'Today'},earlymodern:{icon:'🎻',name:'The 1700s'},medieval:{icon:'🏰',name:'Medieval times'},roman:{icon:'🏛️',name:'Roman times'}};
TRAILS.treasure.stages.splice(1,0,{place:'england',word:'tresour',language:'Middle English',period:'A spelling recorded from the 1100s',era:'medieval',clue:'Still in England! In Middle English, this word could be written tresour. A word can change its spelling in the same place, before we follow its borrowing history across the Channel.',hint:'Now cross the Channel. Look in France for the word English borrowed.'});
TRAILS.treasure.stages.forEach((s,i)=>s.era=['today','medieval','medieval','roman'][i]);
TRAILS.treasure.hint='First stay in England. Look for an older English spelling in Medieval times.';
TRAILS.treasure.complete='English treasure ← Middle English tresour ← Old French tresor ← Latin thesaurus. The spelling changed in England as well as travelling between languages. Italian tesoro is a related branch; the deeper history reaches Greek.';
TRAILS.piano.stages.forEach((s,i)=>s.era=['today','earlymodern'][i]);
TRAILS.window.stages.forEach((s,i)=>s.era=['today','medieval'][i]);
ERAS.nineteenth={icon:'🦴',name:'The 1800s'};
ERAS.greek={icon:'🏺',name:'Ancient Greece'};
EUROPE_MAP.places.greece=[608,536];
const PLACES=[{id:'greece',name:'Greece',point:EUROPE_MAP.places.greece},{id:'england',name:'England',point:EUROPE_MAP.places.england},{id:'france',name:'France',point:EUROPE_MAP.places.france},{id:'germany',name:'Germany',point:[450,325]},{id:'italy',name:'Italy',point:EUROPE_MAP.places.rome},{id:'spain',name:'Spain',point:[292,501]},{id:'norse',name:'Scandinavia',point:EUROPE_MAP.places.norse}];
const LOCAL_WORDS={treasure:{england:'treasure',france:'trésor',germany:'Schatz',italy:'tesoro',spain:'tesoro',norse:'skatt'},piano:{england:'piano',france:'piano',germany:'Klavier',italy:'pianoforte',spain:'piano',norse:'piano'},window:{england:'window',france:'fenêtre',germany:'Fenster',italy:'finestra',spain:'ventana',norse:'vindu'}};
Object.assign(LOCAL_WORDS,window.GREEK_CASES?.localWords||{});
const $=id=>document.getElementById(id);
const svg=$('map');
const speech=window.WordSpeech;
function stageSpeech(s){return speech.spec(s.word,s.language,s.place,s.era!=='today');}
function hearMapWord(){
 const region=findRegion(...lens);if(!region){$('speech-status').textContent='Move the glass over a word, then press P or tap the speaker.';return;}
 if(preview==='branch'&&active==='fart'&&region.id==='norse'){speech.speak(speech.spec('freta','Old Norse','norse',true),$('hear-map'));return;}
 if(preview==='branch'&&active==='school'&&region.id==='germany'){speech.speak(speech.spec(selectedEra==='medieval'?'scuola':'Schule','German','germany',selectedEra==='medieval'),$('hear-map'));return;}
 const next=!finished()?trail().stages[stage+1]:null;
 if(region.target&&next?.era===selectedEra){speech.speak(stageSpeech(next),$('hear-map'));return;}
 const known=trail().stages.slice(0,stage+1).find(s=>s.era===selectedEra&&(s.place===region.id||(region.id==='italy'&&['rome','florence'].includes(s.place))));
 if(known){speech.speak(stageSpeech(known),$('hear-map'));return;}
 if(selectedEra==='today'&&LOCAL_WORDS[active][region.id]){speech.speak(speech.spec(LOCAL_WORDS[active][region.id],region.id==='england'?'English':'Modern local word',region.id),$('hear-map'));return;}
 $('speech-status').textContent='Find a word clue in this place and time to hear it.';
}
let selectedEra='today';
let zoomed=false;let pointerStart=null;let zoomAnimation=0;let zoomVersion=0;
let active='treasure',stage=0,branchFound=false,preview=null,lastRegion=null,lens=[334,316];
const progress={};
function node(tag,attrs={},text){const n=document.createElementNS(SVG_NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
for(const country of EUROPE_MAP.countries)$('countries').append(node('path',{d:country.path,class:'country','data-name':country.name}));
for(const label of EUROPE_MAP.labels)$('labels').append(node('text',{x:label.point[0],y:label.point[1],class:'map-label'+(label.sea?' sea-label':''),'text-anchor':'middle'},label.text));
function trail(){return TRAILS[active];}
function position(s){return EUROPE_MAP.places[s.place];}
function finished(){return stage===trail().stages.length-1;}
function save(){progress[active]={stage,branchFound,era:selectedEra};}
function draw(){
 const t=trail();$('word-title').textContent=t.word;$('meaning').textContent=t.meaning;$('case-no').textContent=String(Object.keys(TRAILS).indexOf(active)+1).padStart(2,'0');
 speech.bind($('hear-start'),speech.spec(t.word));
 $('found-count').textContent=stage+' / '+(t.stages.length-1)+' earlier stops found';
 document.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===active)));
 $('breadcrumbs').replaceChildren();
 t.stages.forEach((s,i)=>{const li=document.createElement('li');li.className=i>stage?'unknown':'';const dot=document.createElement('span');dot.className='crumb-dot';dot.textContent=i>stage?'?':i===0?'•':'✓';const copy=document.createElement('span'),word=document.createElement('span'),language=document.createElement('span');word.className='crumb-word';word.textContent=i<=stage?s.word:'An earlier word…';language.className='crumb-lang';language.textContent=i<=stage?ERAS[s.era].icon+' '+s.language+' · '+s.period:'Choose a time, then search the map';copy.append(word,language);if(i<=stage){const listen=document.createElement('button');speech.bind(listen,stageSpeech(s));listen.classList.add('crumb-speaker');copy.append(listen);}li.append(dot,copy);$('breadcrumbs').append(li);});
 $('pins').replaceChildren();$('trails').replaceChildren();
 for(let i=0;i<=stage;i++){
  const s=t.stages[i],[x,y]=position(s);
  $('pins').append(node('circle',{cx:x,cy:y,r:6,class:'stop-dot'}));
  // Keep adjacent English and French labels on opposite sides of the Channel.
  const left=s.place==='england';const tx=x+(left?-14:14),anchor=left?'end':'start';const localIndex=t.stages.slice(0,i).filter(previous=>previous.place===s.place).length;const labelY=y+localIndex*34;
  $('pins').append(node('text',{x:tx,y:labelY-13,'text-anchor':anchor,class:'stop-label'},s.word));
  $('pins').append(node('text',{x:tx,y:labelY+2,'text-anchor':anchor,class:'stop-language'},s.language.toUpperCase()));
  if(i){const [a,b]=position(t.stages[i-1]);$('trails').append(node('path',{d:curve([a,b],[x,y]),class:'route'}));}
 }
 if(active==='fart'&&branchFound){const[x,y]=EUROPE_MAP.places.norse;$('trails').append(node('path',{d:curve(EUROPE_MAP.places.england,[x,y],-32),class:'branch-route'}));$('pins').append(node('circle',{cx:x,cy:y,r:5,fill:'#547a61',stroke:'#fff8e3','stroke-width':2}));$('pins').append(node('text',{x:x+13,y:y-13,class:'stop-label'},'freta'));}
 if(active==='school'&&branchFound){const [x,y]=[450,325];const root=trail().stages.findIndex(s=>s.word==='schola');const origin=stage>=root?EUROPE_MAP.places.rome:EUROPE_MAP.places.england;$('trails').append(node('path',{d:curve(origin,[x,y],-35),class:'branch-route'}));$('pins').append(node('circle',{cx:x,cy:y,r:5,fill:'#547a61',stroke:'#fff8e3','stroke-width':2}));$('pins').append(node('text',{x:x+13,y:y-13,class:'stop-label'},'Schule'));}
 if(active==='treasure'&&branchFound){const[x,y]=EUROPE_MAP.places.florence;const origin=finished()?EUROPE_MAP.places.rome:EUROPE_MAP.places.england;$('trails').append(node('path',{d:curve(origin,[x,y],-48),class:'branch-route'}));$('pins').append(node('circle',{cx:x,cy:y,r:5,fill:'#547a61',stroke:'#fff8e3','stroke-width':2}));$('pins').append(node('text',{x:x-12,y:y-12,'text-anchor':'end',class:'stop-label'},'tesoro'));}
 $('complete').hidden=!finished();$('complete-text').textContent=t.complete;renderEra();$('dinosaur-lab').hidden=active!=='dinosaur';$('partner').textContent=active==='fart'?'“I heard a noise. I suspect a dragon. Or the detective.”':'“A similar sound is a clue. Let’s see whether the history agrees.”';
}
function curve(a,b,bend=42){return `M${a[0]},${a[1]} Q${(a[0]+b[0])/2+bend},${(a[1]+b[1])/2-bend} ${b[0]},${b[1]}`;}
function card(kind,title,text){$('discovery').className='discovery'+(kind==='wrong'?' wrong':kind==='branch'?' branch-found':'');$('discovery-label').textContent={hint:'PIP’S NEXT HUNCH',correct:'AN EARLIER WORD FOUND',wrong:'A DIFFERENT TRAIL',branch:'A RELATED BRANCH',known:'ALREADY IN YOUR NOTEBOOK',complete:'THE SELECTED TRAIL IS TRACED'}[kind];$('discovery-title').textContent=title;$('discovery-text').textContent=text;
 const listen=$('hear-discovery');listen.hidden=true;
 if(kind==='correct'&&!finished()){speech.bind(listen,stageSpeech(trail().stages[stage+1]));listen.hidden=false;}
 if(kind==='branch'&&active==='fart'&&preview==='branch'){speech.bind(listen,speech.spec('freta','Old Norse','norse',true));listen.hidden=false;}
 if(kind==='branch'&&active==='school'&&preview==='branch'){speech.bind(listen,speech.spec(selectedEra==='medieval'?'scuola':'Schule','German','germany',selectedEra==='medieval'));listen.hidden=false;}
 if(kind==='branch'&&active==='treasure'&&preview==='branch'){speech.bind(listen,speech.spec('tesoro','Italian','italy'));listen.hidden=false;}
 updateAdvance();}
function updateAdvance(){
 const next=!finished()?trail().stages[stage+1]:null;
 $('begin-search').hidden=!next||preview==='main'||selectedEra===next.era;
 if(next)$('begin-search').textContent='Search '+ERAS[next.era].name+' ←';
 if(next)$('follow').textContent=stage+1===trail().stages.length-1?'Finish this trail ✓':'Next stop · '+ERAS[trail().stages[stage+2].era].name+' ←';
 updateMapActions();
}
function updateMapActions(){
 // Exploration and progress happen on the map without an obstructing menu.
 $('map-actions').hidden=true;
 const next=!finished()?trail().stages[stage+1]:null;
 $('zoom-hint').textContent=preview==='main'?(zoomed?'Click again to follow this clue':'Click this clue to zoom in smoothly'):preview==='branch'?'Click to keep this related branch':next&&selectedEra!==next.era?'Click the glass to travel to '+ERAS[next.era].name:'Scroll or pinch to zoom · click for the story';
 updateLensHint();
}
function positionMapActions(){positionLensHint();}
function positionLensHint(){
 const bubble=$('lens-feedback');if(!bubble)return;
 const rect=svg.getBoundingClientRect?.();const holder=document.querySelector('.map-holder').getBoundingClientRect?.();
 if(!rect||!holder)return;
 const [vx,vy,w,h]=camera(),scale=Math.min(rect.width/w,rect.height/h);
 const x=rect.left-holder.left+(rect.width-w*scale)/2+(lens[0]-vx)*scale;
 const y=rect.top-holder.top+(rect.height-h*scale)/2+(lens[1]-vy)*scale;
 const radius=59*(w/900)*scale,panelWidth=bubble.offsetWidth||180,panelHeight=bubble.offsetHeight||70;
 let left=x+radius+10;if(left+panelWidth>holder.width-8)left=x-radius-panelWidth-10;
 bubble.style.left=Math.max(8,Math.min(holder.width-panelWidth-8,left))+'px';
 bubble.style.top=Math.max(8,Math.min(holder.height-panelHeight-8,y-20))+'px';
}
function updateLensHint(){
 const title=$('lens-feedback-title'),text=$('lens-feedback-text');if(!title||!text)return;
 const next=!finished()?trail().stages[stage+1]:null;
 const area={england:'England',france:'France',rome:'the Italian peninsula',florence:'Italy',norse:'Scandinavia',greece:'Greece'};
 const region=findRegion(...lens);
 if(preview==='main'&&!region?.target){title.textContent='Your clue is saved.';text.textContent='Return to '+area[next.place]+' to follow it.';}
 else if(preview==='main'){
  title.textContent='Found: '+next.word;
  text.textContent=zoomed?'Click again to follow this clue.':'Click the glass to look closer.';
 }else if(preview==='branch'){
  title.textContent=active==='school'?'A connected German branch!':active==='fart'?'A northern word cousin!':'A related word!';
  text.textContent=zoomed?'Click again to keep this connection.':'Click to inspect this family connection.';
 }else if(!next){title.textContent='Trail traced!';text.textContent='You can explore or choose another word.';}
 else if(selectedEra!==next.era){title.textContent='Try '+ERAS[next.era].name;text.textContent='Click the glass to travel back in time.';}
 else{
  title.textContent=$('discovery-label').textContent==='A DIFFERENT TRAIL'?'No clue at this stop.':'Where next?';
  text.textContent='Search '+area[next.place]+' · '+ERAS[selectedEra].name+'.';
 }
 positionLensHint();
}

function camera(){return svg.getAttribute('viewBox').split(/\s+/).map(Number);}
function zoomAt(factor,anchor=lens,smooth=false){
 const [x,y,width,height]=camera();
 const w=Math.max(225,Math.min(900,width*factor)),h=w*650/900;
 const nx=Math.max(0,Math.min(900-w,anchor[0]-(anchor[0]-x)*w/width));
 const ny=Math.max(0,Math.min(650-h,anchor[1]-(anchor[1]-y)*h/height));
 const destination=[nx,ny,w,h];
 const apply=view=>{
  svg.setAttribute('viewBox',view.join(' '));zoomed=view[2]<899.9;
  document.querySelector('.atlas').setAttribute('data-zoomed',String(zoomed));$('zoom-out').hidden=!zoomed;
  setLens(...lens);updateMapActions();
 };
 const version=++zoomVersion;
 if(zoomAnimation&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(zoomAnimation);
 zoomAnimation=0;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!smooth||reduced||typeof requestAnimationFrame!=='function'){apply(destination);return;}
 const from=[x,y,width,height];let start;
 const frame=now=>{
  if(version!==zoomVersion)return;
  if(start===undefined)start=now;
  const t=Math.min(1,(now-start)/450),eased=t*t*(3-2*t);
  apply(from.map((v,i)=>v+(destination[i]-v)*eased));
  if(t<1)zoomAnimation=requestAnimationFrame(frame);else zoomAnimation=0;
 };
 zoomAnimation=requestAnimationFrame(frame);
}

function mapPoint(clientX,clientY){
 const r=svg.getBoundingClientRect(),[x,y,w,h]=camera();
 const scale=Math.min(r.width/w,r.height/h);
 return [x+(clientX-r.left-(r.width-w*scale)/2)/scale,y+(clientY-r.top-(r.height-h*scale)/2)/scale];
}
function clickAtMap(){
 if(zoomAnimation)return;
 const next=!finished()?trail().stages[stage+1]:null;
 if(!zoomed){
  if(preview!=='branch'&&next&&selectedEra!==next.era)chooseEra(next.era);
  zoomIn();return;
 }
 if((preview==='main'&&findRegion(...lens)?.target)||preview==='branch'||(next&&selectedEra!==next.era)||finished()){advanceAtMap();return;}
 zoomIn();
}

function advanceAtMap(){
 if(preview==='main'){$('follow').click();return;}
 if(preview==='branch'){
  $('branch-follow').click();preview=null;lastRegion=null;
  const next=trail().stages[stage+1];if(next&&next.era!==selectedEra)chooseEra(next.era);else hunch();
  updateMapActions();return;
 }
 if(finished()){
  const ids=Object.keys(TRAILS);select(ids[(ids.indexOf(active)+1)%ids.length]);return;
 }
 const next=trail().stages[stage+1];
 if(next.era!==selectedEra){chooseEra(next.era);return;}
 zoomOut();hunch();
}
const CONTEXT={
 tresour:{icon:'🏰',title:'England, earlier in time',story:'In Middle English, tresour was one way of spelling the word we now write treasure. We have stayed in England and moved back in time: local language change is part of the investigation too.',question:'Compare tresour and treasure. What changed on the page? This is evidence about spelling; it does not by itself prove exactly how a person pronounced the word.'},
 tresor:{icon:'🏰',title:'A medieval French clue',story:'English speakers borrowed this word from Old French around the 1100s. A word can cross into another language and slowly change its sound and spelling.',question:'Say tresor, then treasure. Which sounds stay close? Compare the beginning “tres-” and “treas-”. Next, look for the older Latin ancestor.'},
 thesaurus:{icon:'🏛️',title:'A Latin treasure store',story:'Latin thesaurus described a store of precious things. It lies behind French tresor and Italian tesoro. These are different branches of a shared word history.',question:'Does thesaurus look familiar? In English, a thesaurus is a book of related words—a treasure store of words. The deeper history of this family reaches Greek.'},
 pianoforte:{icon:'🎻',title:'Soft and loud in Italy',story:'In Italian musical language, piano means soft and forte means loud. The instrument’s longer name describes the ability to play at different volumes.',question:'Which half survives in the usual English instrument name? Try whispering “piano” and saying “forte” loudly.'},
 vindauga:{icon:'🏰',title:'A northern word picture',story:'Old Norse vindauga combines words for wind and eye. It describes an opening in a wonderfully visual way. English window belongs to this Norse story.',question:'Imagine an opening that lets wind into a house. Why might someone call it a wind-eye? The exact spoken form first borrowed into English was not recorded.'}
};
Object.assign(CONTEXT,window.GREEK_CASES?.contexts||{});
function zoomIn(){
 zoomAt(.62,lens,true);
 const region=findRegion(...lens);
 const found=region?.target&&trail().stages[stage+1]?.era===selectedEra?trail().stages[stage+1]:trail().stages.slice(0,stage+1).find(s=>s.era===selectedEra&&(s.place===region?.id||(region?.id==='italy'&&['rome','florence'].includes(s.place))));
 const context=found&&CONTEXT[found.word];
 $('place-context').hidden=false;$('context-era').textContent=ERAS[selectedEra].icon+' '+ERAS[selectedEra].name+' · '+(found?.language||region?.name||'Europe');
 $('context-icon').textContent=context?.icon||ERAS[selectedEra].icon;
 $('context-title').textContent=context?.title||'Look at this place and time';
 $('context-story').textContent=context?.story||$('discovery-text').textContent;
 $('context-question').textContent=context?.question||'Do you have the right place and the right time? The era buttons and Pip’s hint can help you decide where to look next.';
 updateMapActions();
}
function zoomOut(){
 zoomVersion++;if(zoomAnimation&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(zoomAnimation);zoomAnimation=0;
 zoomed=false;svg.setAttribute('viewBox','0 0 900 650');document.querySelector('.atlas').setAttribute('data-zoomed','false');$('zoom-out').hidden=true;$('place-context').hidden=true;$('zoom-hint').textContent='Scroll or pinch to zoom';setLens(...lens);updateMapActions();
}
function hunch(){
 preview=null;$('follow').hidden=true;$('branch-choice').hidden=true;
 if(finished()){card('complete','Look how far back you went.',trail().complete);return;}
 const next=trail().stages[stage+1];
 const hint=stage?trail().stages[stage].hint:trail().hint;
 card('hint',selectedEra===next.era?'Right time. Where next?':'Travel back in time.',selectedEra===next.era?hint:'Choose '+ERAS[next.era].icon+' '+ERAS[next.era].name+' below the map. Then follow the place clue: '+hint);
}
function renderEra(){
 document.querySelector('.atlas').setAttribute('data-era',selectedEra);
 $('map-era').textContent=ERAS[selectedEra].icon+' '+ERAS[selectedEra].name.toUpperCase();
 svg.setAttribute('aria-label','Search Europe with a movable magnifying glass · '+ERAS[selectedEra].name);
 document.querySelectorAll('[data-era]').forEach(b=>{
  if(b.tagName.toLowerCase()!=='button')return;
  const used=trail().stages.some(s=>s.era===b.dataset.era);
  b.hidden=(window.GREEK_CASES?.trails[active]||['earlymodern','nineteenth','greek'].includes(b.dataset.era))?!used:false;
  b.setAttribute('aria-pressed',String(b.dataset.era===selectedEra));
  const words=trail().stages.slice(0,stage+1).filter(s=>s.era===b.dataset.era).map(s=>s.word);
  b.querySelector('.era-stamps').textContent=words.length?'✓ '+words.join(' · '):'';
 });
 const next=!finished()?trail().stages[stage+1]:null;
 $('era-hint').textContent=next?(selectedEra===next.era?'You are in the right era. Move the glass to find the earlier word.':'Looking in '+ERAS[selectedEra].name+'. Your next time clue: '+ERAS[next.era].name+'.'):'All selected stops found. Tap an era to revisit its clues.';
 const historical={roman:{FRANCE:'GAUL / ROMAN WORLD',ITALY:'ROMAN ITALY','GREAT BRITAIN':'BRITAIN',GERMANY:'GERMANIC REGIONS',POLAND:'',GREECE:'GREECE'},medieval:{FRANCE:'FRANCE REGION',ITALY:'ITALIAN PENINSULA','GREAT BRITAIN':'BRITAIN',GERMANY:'GERMAN-SPEAKING REGIONS',POLAND:'',GREECE:'GREECE'}};
 [...$('labels').children].forEach((label,i)=>{const original=EUROPE_MAP.labels[i].text;label.textContent=historical[selectedEra]?.[original]??original;});

}
function chooseEra(era){
 if(!ERAS[era]||(['earlymodern','nineteenth','greek'].includes(era)&&!trail().stages.some(s=>s.era===era)))return;
 zoomOut();selectedEra=era;preview=null;lastRegion=null;save();renderEra();$('lens-word').textContent='';hunch();
 // Recheck the current search location without requiring the mouse to wiggle.
 const region=findRegion(...lens);if(region)inspect(region);
}
function lensWord(region){
 if(!region)return '';
 if(region.target&&trail().stages[stage+1]?.era===selectedEra)return trail().stages[stage+1].word;
 if(selectedEra==='today')return LOCAL_WORDS[active][region.id]||'';
 const known=trail().stages.slice(0,stage+1).find(s=>s.era===selectedEra&&(s.place===region.id||(region.id==='italy'&&['rome','florence'].includes(s.place))));
 return known?.word||'⌛';
}

function setLens(x,y){
 const [vx,vy,w,h]=camera(),scale=w/900;
 lens=[Math.max(vx+60*scale,Math.min(vx+w-85*scale,x)),Math.max(vy+82*scale,Math.min(vy+h-85*scale,y))];
 const[a,b]=lens;
 $('glass').setAttribute('transform',`translate(${a} ${b}) scale(${scale})`);
 for(const id of ['clip-circle','glass-tint']){$(id).setAttribute('cx',a);$(id).setAttribute('cy',b);$(id).setAttribute('r',57*scale);}
 $('magnified').setAttribute('transform',`translate(${a} ${b}) scale(1.45) translate(${-a} ${-b})`);
 positionLensHint();
}

function findRegion(x,y){
 const target=!finished()?trail().stages[stage+1]:null;
 if(target&&Math.hypot(x-position(target)[0],y-position(target)[1])<34)return {id:target.place==='rome'||target.place==='florence'?'italy':target.place,name:target.language,point:position(target),target:true};
 return PLACES.find(p=>Math.hypot(x-p.point[0],y-p.point[1])<36)||null;
}
function inspect(region){
 const t=trail();preview=null;$('follow').hidden=true;$('branch-choice').hidden=true;
 if(active==='fart'&&region.id==='norse'){
  preview='branch';$('branch-follow').hidden=false;$('lens-word').textContent='freta';
  card('branch','Freta · an Old Norse cousin','Old Norse freta is related to English fart and Old English feortan. This is a historical word shown for comparison. It is a family link, rather than the route by which English got its word.');
  $('branch-choice').hidden=false;return;
 }

 if(active==='school'&&region.id==='germany'){
  preview='branch';$('branch-follow').hidden=false;
  const old=selectedEra==='medieval';$('lens-word').textContent=old?'scuola':'Schule';
  card('branch',old?'Scuola · an older German relative':'Schule · a modern German relative',old?'Old High German scuola and English scol both lead back to Latin schola. This is a connected branch of the same family.':'German Schule belongs to the same family as English school. Through older German forms, it also leads back to Latin schola. Schule is a modern word shown here as a comparison; English did not borrow school from modern German.');
  $('branch-choice').hidden=false;return;
 }

 if(region.target&&!finished()&&t.stages[stage+1].era!==selectedEra){
  const next=t.stages[stage+1];$('lens-word').textContent=lensWord(region);
  card('wrong','Right place. A different time!', 'You are searching '+ERAS[selectedEra].name+'. This earlier word’s clue belongs to '+ERAS[next.era].icon+' '+ERAS[next.era].name+'. Change the time below the map, then look here again.');
  $('temperature').textContent='Try another time';return;
 }
 if(selectedEra!=='today'&&!region.target){
  const known=t.stages.slice(0,stage+1).find(s=>s.era===selectedEra&&(s.place===region.id||(region.id==='italy'&&['rome','florence'].includes(s.place))));
  $('lens-word').textContent=known?.word||'⌛';
  if(known)card('known',ERAS[selectedEra].icon+' '+known.word+' · '+known.language,'A word you have already traced in '+ERAS[selectedEra].name+'. '+(finished()?'Try another era to revisit the journey.':t.stages[stage].hint||t.hint));
  else card('wrong','Another place, another time.', 'We do not have a clue for this place in this chapter of the case. '+(!finished()?'Look in '+ERAS[t.stages[stage+1].era].name+' and follow Pip’s place hint.':'You can revisit a discovered word or choose another case.'));
  return;
 }
 if(region.target&&!finished()){ 
  const next=t.stages[stage+1];preview='main';$('lens-word').textContent=next.word;card('correct',ERAS[next.era].icon+' '+next.word+' · '+next.language,next.clue);$('follow').hidden=false;$('temperature').textContent='Clue found · click the glass to look closer';return;
 }
 const known=t.stages.slice(0,stage+1).find(s=>s.era===selectedEra&&(s.place===region.id||(region.id==='italy'&&['rome','florence'].includes(s.place))));
 if(known){$('lens-word').textContent=known.word;card('known',known.word+' · '+known.language,finished()?'You have traced this trail. Explore other places for more word clues, or choose another word.':'This is a stop you already know. '+(stage?t.stages[stage].hint:t.hint));return;}
 const local=LOCAL_WORDS[active][region.id];$('lens-word').textContent=local||'';
 if(selectedEra==='today'){
  const historic=t.stages.slice(0,stage+1).find(s=>s.era!=='today'&&(s.place===region.id||(region.id==='italy'&&['rome','florence'].includes(s.place))));
  if(historic){card('known',local+' · Today','This is a present-day word here. To revisit '+historic.word+', choose '+ERAS[historic.era].icon+' '+ERAS[historic.era].name+'.');return;}
 }
 if(active==='treasure'&&region.id==='italy'){
  preview='branch';$('branch-follow').hidden=false;card('branch','Tesoro… a family resemblance!', 'Italian tesoro is related to treasure. Both lead back to Latin thesaurus. It is a different branch—not proof that English borrowed treasure directly from Italian.');$('branch-choice').hidden=false;return;
 }
 if(active==='piano'&&['france','spain','norse'].includes(region.id)){
  card('branch','Piano here too!', 'The same instrument name is used here. That makes it a lead to explore, but this English word’s earlier name is Italian pianoforte. Try tracing back to Italy.');return;
 }
 if(active==='treasure'&&region.id==='spain'){
  card('branch','Tesoro in Spanish, too.', 'Another related word! Spanish tesoro also belongs to this Latin family. For the English borrowing trail, look for Old French first.');return;
 }
 if(window.GREEK_CASES?.trails[active]){
  const hint=t.stages[stage].hint||t.hint;
  card('branch',(local||'A word clue')+' · '+region.name,'A modern word is a lead to compare. To follow this case’s historical evidence: '+hint);return;
 }
 const text=active==='treasure'&&region.id==='germany'?'Schatz is a German word for treasure. The sound differs, and our historical evidence sends this English word through Old French. Try looking west.':active==='window'?'This is another word for a window. For our English word’s history, follow the evidence north to the Norse-speaking world.':'Klavier is a German name for the instrument. Our English name has an Italian source. Try looking further south.';
 card('wrong',(local||'Another word')+' · '+region.name,text);$('temperature').textContent='Try another trail';
}
function explore(x,y){
 setLens(x,y);
 const target=!finished()?position(trail().stages[stage+1]):null;
 if(target){
  const d=Math.hypot(lens[0]-target[0],lens[1]-target[1]);
  $('temperature').textContent=d<70?'Getting warmer…':d<170?'A lead nearby…':'Keep looking…';
 }
 const region=findRegion(...lens);
 const key=region?(region.id+(region.target?'target':'')):'empty';
 // A newly found main-trail clue always takes priority over a related branch.
 // Check this before the region cache: the pending card may have changed in place.
 if(region?.target&&trail().stages[stage+1].era===selectedEra&&preview!=='main'){
  lastRegion=key;
  inspect(region);
  return;
 }
 if(lastRegion===key)return;
 lastRegion=key;
 // Preserve pending actions when travelling across other places to the notebook.
 if(preview==='main'||preview==='branch'){
  $('lens-word').textContent=preview==='branch'&&active==='fart'&&region?.id==='norse'?'freta':preview==='branch'&&active==='school'&&region?.id==='germany'?(selectedEra==='medieval'?'scuola':'Schule'):lensWord(region);
  updateLensHint();return;
 }
 if(region)inspect(region);
 else{$('lens-word').textContent='';hunch();}
}
function pointer(event){
 if(zoomAnimation)return;
 if(event.pointerType==='touch'&&!dragging)return;
 const point=mapPoint(event.clientX,event.clientY);explore(...point);
}
let dragging=false;
const touches=new Map();let pinchDistance=null,pinching=false;
svg.addEventListener('pointerdown',e=>{
 pointerStart=[e.clientX,e.clientY];dragging=true;svg.setPointerCapture?.(e.pointerId);
 if(e.pointerType==='touch')touches.set(e.pointerId,[e.clientX,e.clientY]);
 if(touches.size===2){const[a,b]=[...touches.values()];pinchDistance=Math.hypot(a[0]-b[0],a[1]-b[1]);pinching=true;pointerStart=null;return;}
 pointer(e);
});
svg.addEventListener('pointermove',e=>{
 if(touches.has(e.pointerId))touches.set(e.pointerId,[e.clientX,e.clientY]);
 if(touches.size===2){
  const[a,b]=[...touches.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(pinchDistance&&distance>0){const anchor=mapPoint((a[0]+b[0])/2,(a[1]+b[1])/2);zoomAt(pinchDistance/distance,anchor);}
  pinchDistance=distance;return;
 }
 if(!pinching)pointer(e);
});
svg.addEventListener('pointerup',e=>{
 touches.delete(e.pointerId);dragging=touches.size>0;
 if(!pinching&&pointerStart&&Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])<10)clickAtMap();
 if(touches.size===0){pinching=false;pinchDistance=null;}
 pointerStart=null;
});
svg.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);dragging=false;pointerStart=null;if(!touches.size){pinching=false;pinchDistance=null;}});
svg.addEventListener('wheel',event=>{
 event.preventDefault();const point=mapPoint(event.clientX,event.clientY);explore(...point);
 const unit=event.deltaMode===1?16:event.deltaMode===2?650:1;
 zoomAt(Math.exp(Math.max(-100,Math.min(100,event.deltaY*unit))*.002),point);
},{passive:false});
svg.addEventListener('keydown',event=>{
 if(event.key.toLowerCase()==='p'){event.preventDefault();hearMapWord();return;}
 if(event.key==='Enter'||event.key===' '){event.preventDefault();clickAtMap();return;}
 if(['+','=','-','_'].includes(event.key)){event.preventDefault();zoomAt(['+','='].includes(event.key)?.85:1/.85);return;}
 if(event.key==='Escape'){zoomOut();return;}
 const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!moves[event.key])return;
 event.preventDefault();const m=moves[event.key],step=(event.shiftKey?35:12)*camera()[2]/900;explore(lens[0]+m[0]*step,lens[1]+m[1]*step);
});
$('follow').addEventListener('click',()=>{if(preview!=='main'||finished()||trail().stages[stage+1].era!==selectedEra)return;zoomOut();stage++;if(!finished())selectedEra=trail().stages[stage+1].era;save();draw();lastRegion=null;$('lens-word').textContent='';hunch();svg.focus({preventScroll:true});});
$('branch-follow').addEventListener('click',()=>{
 if(preview!=='branch')return;branchFound=true;save();draw();
 if(active==='fart')card('branch','A northern cousin: freta.', 'You found an Old Norse relative. Keep the dashed family link between the English and Norse branches. Pip is requesting that all future evidence be collected upwind.');
 else if(active==='school')card('branch','A related branch: Schule ← schola.', 'Schule reaches Latin schola through older German forms. Keep this German connection: the English and German branches meet at their Latin source. Continue the main trail towards Latin, then Greek.');
 else card('branch','A second branch: tesoro ← thesaurus.', 'You found an Italian relative. Keep this dashed connection in your notebook. Return to the main trail to see where the branches meet.');
 $('branch-follow').hidden=true;
});
$('main-follow').addEventListener('click',()=>{hunch();lastRegion=null;svg.focus({preventScroll:true});});
function select(id){if(!TRAILS[id])return;speech.stop();zoomOut();save();active=id;stage=progress[id]?.stage||0;branchFound=progress[id]?.branchFound||false;selectedEra=progress[id]?.era||'today';preview=null;lastRegion=null;$('branch-follow').hidden=false;draw();setLens(...position(trail().stages[stage]));$('lens-word').textContent=trail().stages[stage].era===selectedEra?trail().stages[stage].word:'';hunch();}
for(const b of document.querySelectorAll('[data-case]'))b.addEventListener('click',()=>select(b.dataset.case));
$('again').addEventListener('click',()=>{zoomOut();stage=0;branchFound=false;selectedEra='today';save();lastRegion=null;draw();setLens(...position(trail().stages[0]));$('lens-word').textContent=trail().word;hunch();});
for(const place of PLACES){const b=document.createElement('button');b.textContent='Search '+place.name;b.type='button';b.addEventListener('click',()=>{const target=!finished()?trail().stages[stage+1]:null;const p=place.id==='italy'&&target&&['rome','florence'].includes(target.place)?position(target):place.point;lastRegion=null;explore(...p);});$('place-buttons').append(b);}
$('zoom-out').addEventListener('click',()=>{zoomOut();updateMapActions();});
$('map-advance').addEventListener('click',advanceAtMap);
$('map-look').addEventListener('click',()=>{
 if(preview==='branch'){preview=null;lastRegion=null;const next=trail().stages[stage+1];if(next&&next.era!==selectedEra)chooseEra(next.era);else hunch();return;}
 if(zoomed){zoomOut();updateMapActions();return;}
 // A pending clue's detail belongs to its stop even after the pointer has moved.
 if(preview==='main'&&!finished())setLens(...position(trail().stages[stage+1]));
 zoomIn();
});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(positionMapActions).observe(document.querySelector('.map-holder'));
$('begin-search').addEventListener('click',()=>{if(finished())return;chooseEra(trail().stages[stage+1].era);});
for(const specimen of window.GREEK_CASES?.dinosaurs||[]){
 const b=document.createElement('button');b.type='button';b.textContent=specimen.name;b.setAttribute('aria-pressed','false');
 b.addEventListener('click',()=>{
  document.querySelectorAll('#dinosaur-puzzles button').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));
  $('dino-name').textContent=specimen.name;$('dino-parts').textContent=specimen.parts+' → '+specimen.meaning;$('dino-story').textContent=specimen.story;
  speech.bind($('hear-dinosaur'),speech.spec(specimen.name));$('dino-source').href=specimen.source;$('dino-result').hidden=false;
 });$('dinosaur-puzzles').append(b);
}
for(const b of document.querySelectorAll('button[data-era]'))b.addEventListener('click',()=>chooseEra(b.dataset.era));
$('hear-map').disabled=!speech.supported;
if(!speech.supported)$('speech-status').textContent='Spoken words are unavailable in this browser. Try Chrome, Edge or Safari.';
$('hear-map').addEventListener('click',hearMapWord);
window.addEventListener('pagehide',()=>speech.stop());
select('treasure');
