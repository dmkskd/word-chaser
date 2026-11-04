'use strict';
const CASES = [
  {
    id:'treasure',word:'treasure',name:'The travelling treasure',type:'A travelling word',icon:'✧',
    title:'The case of the travelling treasure',premise:'A word has arrived with a very old passport. Follow its trail back through time.',
    definition:'Something precious, like gold, jewels… or your favourite things.',
    question:'Which language passed this word to English?',choices:['Italian','Old French','Old Norse'],answer:1,
    clues:[
      {title:'The old passport',symbol:'▤',text:'An old French document says TRESOR. Say “tresor” and “treasure”. Their sounds are close. Could this be a stop on our journey?'},
      {title:'A Roman connection',symbol:'⌛',text:'Go further back and you find Latin THESAURUS: a store of precious things. This word travelled into French before reaching English.'},
      {title:'The arrival record',symbol:'✉',text:'Around the 1100s, English borrowed this word from Old French. The spelling kept changing. Today we write TREASURE.'}
    ],proof:['It describes something shiny.','The arrival record says English borrowed it from Old French.','It has eight letters.'],proofAnswer:1,
    partner:'“Treasure! I brought a shovel. Apparently we need a dictionary.”',
    explanation:'You followed the evidence! Treasure reached English through Old French. Earlier in its journey, it was a Latin word. Words can make more than one stop.',
    journey:[['Latin','thesaurus','a store of precious things'],['Old French','tresor','a hoard or treasure'],['English','treasure','borrowed around the 1100s']],
    note:'Selected stages: the deeper story goes back to Greek. The modern English spelling came later.',
    relatedTitle:'A thesaurus is a treasure chest of words.',related:'English “thesaurus” also comes from Latin thesaurus. And Italian “tesoro” belongs to this family too: a different branch of the same story.',
    sources:[['Online Etymology Dictionary · treasure','https://www.etymonline.com/word/treasure'],['Académie française · trésor','https://www.dictionnaire-academie.fr/article/A9T2128']]
  },
  {
    id:'piano',word:'piano',name:'The missing half',type:'An Italian connection',icon:'♫',
    title:'The case of the missing half',premise:'Someone has shortened this word. Find the missing piece and discover what its name means.',
    definition:'A keyboard instrument with hammers that hit strings to make music.',
    question:'Which language gave English the name piano?',choices:['Old Norse','Italian','Old French'],answer:1,
    clues:[
      {title:'A longer name',symbol:'✂',text:'An old label calls the instrument PIANOFORTE. Today we usually say PIANO. What happened to the second half?'},
      {title:'A musical trick',symbol:'♫',text:'A pianist can make a note soft or loud by changing how they press a key. Could the old name describe that trick?'},
      {title:'An Italian note',symbol:'▤',text:'In Italian musical instructions, PIANO means soft and FORTE means loud. Put the words together: PIANOFORTE.'}
    ],proof:['It has black and white keys.','Music is fun to listen to.','Pianoforte combines the Italian words for soft and loud.'],proofAnswer:2,
    partner:'“I checked inside the piano. No missing words. Quite a lot of strings.”',
    explanation:'Piano is a shortened version of Italian pianoforte. Its name describes an instrument that can play softly and loudly. The word travelled, and its everyday name became shorter.',
    journey:[['Italian','pianoforte','soft + loud'],['English','piano','the shorter instrument name']],
    note:'A shortened journey. “Piano” has a deeper Latin history too; the instrument’s name is Italian.',
    relatedTitle:'Piano → pianissimo',related:'Pianissimo means very softly in music. Next time you see “p” or “pp” on a music sheet, you have already found a clue.',
    sources:[['American Heritage · piano','https://www.ahdictionary.com/word/search.html?q=piano'],['American Heritage · pianoforte','https://ahdictionary.com/word/search.html?q=pianoforte']]
  },
  {
    id:'window',word:'window',name:'The wind’s eye',type:'A Viking word trail',icon:'▥',
    title:'The case of the wind’s eye',premise:'This ordinary word is hiding a wonderfully strange picture. A clue has washed in from the north.',
    definition:'An opening in a wall or roof that lets in light, usually covered with glass.',
    question:'Which language is behind the word window?',choices:['Latin','Italian','Old Norse'],answer:2,
    clues:[
      {title:'A northern visitor',symbol:'≈',text:'Norse-speaking settlers brought words to England. Our mystery word belongs to that northern trail.'},
      {title:'Two little words',symbol:'＋',text:'In Old Norse, VINDR means wind and AUGA means eye. Together, they make VIND-AUGA. Say it slowly. Does it remind you of WINDOW?'},
      {title:'A house without glass',symbol:'▥',text:'Long ago, a window could be an opening without glass. Wind could come through it. “Wind-eye” is a picture made out of words!'}
    ],proof:['The Old Norse words for wind and eye form vindauga.','Windows are usually rectangles.','Some houses have many windows.'],proofAnswer:0,
    partner:'“A house with eyes? I’m watching it. It might be watching me.”',
    explanation:'Window has a Norse story! Old Norse vindauga combines wind and eye. A familiar English word carries a little picture from a language spoken centuries ago.',
    journey:[['Old Norse','vindauga','wind + eye'],['Middle English','windowe','the borrowed word changes'],['English','window','our everyday word']],
    note:'Selected forms. The exact spoken form first borrowed into English was not recorded.',
    relatedTitle:'Another northern clue: Grimsby.',related:'Old Norse left clues in place names as well as everyday words. Open the Grimsby case and inspect its ending.',
    sources:[['American Heritage · window','https://www.ahdictionary.com/word/search.html?q=window'],['Dictionaries of the Scots Language · window forms','https://www.dsl.ac.uk/entry/dost00092171']]
  },
  {
    id:'grimsby',word:'Grimsby',name:'The town with a clue',type:'A place-name mystery',icon:'⚑',
    title:'The case of the town with a clue',premise:'A signpost can be a time machine. What does the ending of this English town’s name reveal?',
    definition:'A town on the east coast of England, near the mouth of the River Humber.',
    question:'What does the old ending -by tell us here?',choices:['A Roman road','A Norse settlement','An Italian market'],answer:1,
    clues:[
      {title:'Split the signpost',symbol:'✂',text:'Try splitting GRIMSBY into GRIMS + BY. The first part points to the Old Norse personal name GRÍMR. It is not a clue about a gloomy town!'},
      {title:'A tiny dictionary',symbol:'▤',text:'In Old Norse place names, BY means a farm or settlement. Grimsby means a settlement belonging to someone called Grímr.'},
      {title:'A very old record',symbol:'⌛',text:'The town appears in the Domesday Book of 1086 as GRIMESBI. Its name preserves evidence of Scandinavian settlement in England.'}
    ],proof:['The town is by the sea.','Grim sounds like gloomy.','The name combines a Norse personal name with by, meaning settlement.'],proofAnswer:2,
    partner:'“I thought it meant a grumpy town. The signpost has proved me wrong.”',
    explanation:'You found a Norse clue in an English place name! Grimsby combines the name Grímr with an element meaning farm or settlement. A name can preserve evidence of who settled somewhere.',
    journey:[['Old Norse elements','Grímr + by','a person + a settlement'],['Recorded in 1086','Grimesbi','a Domesday Book spelling'],['Today','Grimsby','an English town']],
    note:'A naming trail, not the date the town was founded. Stories about Grim the fisherman are legends, not proof of his identity.',
    relatedTitle:'Two cases, one northern connection.',related:'Window and Grimsby both contain Norse clues. One is an everyday word; the other is a place name. Language history is all around you.',
    sources:[['University of Nottingham · Vikings in the East Midlands','https://emidsvikings.ac.uk/items/great-grimsby/'],['English Place-Name Society · Grimsby','https://www.nottingham.ac.uk/research/groups/epns/documents/coates-citynames-grimsby.pdf']]
  }
];
const ART = {
 treasure:'<path d="M25 40 Q25 17 50 17H94Q119 17 119 40Z" fill="#b67b39"/><path d="M25 40H119V83H25Z" fill="#b67b39"/><path d="M25 43H119M42 19V83M101 19V83" stroke="#ead396" stroke-width="7"/><rect x="65" y="37" width="15" height="20" rx="2" fill="#eac674"/><circle cx="72" cy="44" r="2" fill="#604a2a"/><path d="M14 18v12m-6-6h12M129 5v12m-6-6h12M130 67v10m-5-5h10" stroke="#b67b39" stroke-width="2"/>',
 piano:'<path d="M30 18H111V70H30Z" fill="#344f45"/><path d="M24 63H119V79H24Z" fill="#f6f1da" stroke="#344f45" stroke-width="3"/><path d="M36 65v13m12-13v13m12-13v13m12-13v13m12-13v13m12-13v13m12-13v13" stroke="#8c987c"/><path d="M40 64v9m12-9v9m24-9v9m12-9v9m12-9v9" stroke="#344f45" stroke-width="5"/><path d="M35 80v14m73-14v14" stroke="#344f45" stroke-width="6"/><path d="M63 29h18v23H63Z" fill="#eadfbd"/><path d="M127 22v20m0-20l12-3v19" stroke="#b67b39" stroke-width="2"/><ellipse cx="123" cy="42" rx="4" ry="3" fill="#b67b39"/><ellipse cx="135" cy="38" rx="4" ry="3" fill="#b67b39"/>',
 window:'<path d="M40 16H105V87H40Z" fill="#b9d0cc" stroke="#536f60" stroke-width="5"/><path d="M72 17V86M40 50H105" stroke="#fff6d9" stroke-width="5"/><path d="M32 89h81" stroke="#536f60" stroke-width="5"/><path d="M9 38c8-7 17 7 26 0M2 50c9-7 19 7 29 0M13 62c8-7 13 4 22-1" fill="none" stroke="#8da89e" stroke-width="2"/><path d="M85 27l11 9M85 35l7 6" stroke="#f4f7e6" stroke-width="2"/>',
 grimsby:'<path d="M70 13V95" stroke="#786444" stroke-width="6"/><path d="M25 22h96l12 15-12 15H25Z" fill="#436651"/><text x="78" y="42" fill="#fff7df" text-anchor="middle" font-family="Georgia" font-size="14">GRIMSBY</text><path d="M42 62h54l-8 13H42Z" fill="#c49657"/><path d="M30 96q20-13 44 0q20-13 42 0" stroke="#8a9d70" stroke-width="2" fill="none"/>'
};
const $ = id => document.getElementById(id);
const STORAGE='word-investigator-v1';
function cleanState(raw){
 const result={current:0,cases:{}};
 if(!raw||typeof raw!=='object')return result;
 if(Number.isInteger(raw.current)&&raw.current>=0&&raw.current<CASES.length)result.current=raw.current;
 for(const c of CASES){const s=raw.cases?.[c.id];if(s&&typeof s==='object')result.cases[c.id]={found:Array.isArray(s.found)?[...new Set(s.found.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[],theory:s.theory===true,solved:s.solved===true};}
 return result;
}
let state;try{state=cleanState(JSON.parse(localStorage.getItem(STORAGE)));}catch{state=cleanState(null);}
let openClue=0;
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{/* The game works without storage. */}}
function current(){return CASES[state.current];}
function progress(){const c=current();return state.cases[c.id]||(state.cases[c.id]={found:[],theory:false,solved:false});}
function button(text,handler,className=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=className;b.addEventListener('click',handler);return b;}
function render(){
 const c=current(),p=progress();
 $('case-list').replaceChildren(...CASES.map((item,i)=>{
  const b=button('',()=>selectCase(i),'file'+(state.current===i?' active':''));
  b.setAttribute('aria-label',item.name+(state.cases[item.id]?.solved?', solved':''));if(state.current===i)b.setAttribute('aria-current','page');
  const icon=document.createElement('span');icon.className='file-icon';icon.textContent=item.icon;icon.setAttribute('aria-hidden','true');
  const copy=document.createElement('span');copy.className='file-copy';
  for(const [cls,text] of [['file-small','CASE '+String(i+1).padStart(3,'0')],['file-title',item.name],['file-status',state.cases[item.id]?.solved?'✓ Case solved':state.cases[item.id]?.found.length?'Investigation started':'Ready to investigate']]){const s=document.createElement('span');s.className=cls;s.textContent=text;copy.append(s);}b.append(icon,copy);return b;
 }));
 $('count').textContent=CASES.filter(c=>state.cases[c.id]?.solved).length+' / '+CASES.length;
 $('case-number').textContent='CASE NO. '+String(state.current+1).padStart(3,'0');
 for(const [id,text] of [['case-type',c.type],['case-title',c.title],['case-premise',c.premise],['case-word',c.word],['definition',c.definition],['question',c.question],['partner-line',c.partner]])$(id).textContent=text;
 $('word-art').innerHTML='<svg viewBox="0 0 150 105" aria-hidden="true">'+ART[c.id]+'</svg>';
 $('clue-count').textContent=p.found.length+' / 3 found';
 const stamp=document.querySelector('.paper-stamp');stamp.textContent=p.solved?'STORY DISCOVERED':'ORIGIN UNKNOWN';stamp.classList.toggle('is-solved',p.solved);
 $('clues').replaceChildren(...c.clues.map((clue,i)=>{
  const b=button('',()=>showClue(i),'clue-card'+(p.found.includes(i)?' collected':''));
  b.setAttribute('aria-label',clue.title+(p.found.includes(i)?', collected':', inspect clue'));
  const symbol=document.createElement('span');symbol.className='clue-symbol';symbol.textContent=clue.symbol;symbol.setAttribute('aria-hidden','true');
  const copy=document.createElement('span');const small=document.createElement('small');small.textContent='CLUE '+String(i+1).padStart(2,'0');const strong=document.createElement('strong');strong.textContent=clue.title;copy.append(small,strong);b.append(symbol,copy);return b;
 }));
 $('theory').hidden=p.solved;$('solved').hidden=!p.solved;$('proof').hidden=!p.theory;
 $('theory-help').textContent=p.found.length===3?'You have the evidence. What do you think?':'Collect the three clues, then make your case.';
 $('feedback').textContent='';
 $('answers').replaceChildren(...c.choices.map((choice,i)=>{
  const b=button(choice,()=>guess(i),'answer');b.disabled=p.found.length<3||p.theory;b.setAttribute('aria-pressed',String(p.theory&&i===c.answer));return b;
 }));
 $('proof-answers').replaceChildren(...c.proof.map((text,i)=>button(text,()=>prove(i))));
 if(p.solved)renderSolution();
 $('speak').hidden=!('speechSynthesis' in window);
}
function selectCase(i){state.current=i;persist();render();}
function showClue(i){openClue=i;const c=current(),clue=c.clues[i];$('clue-dialog-number').textContent='EVIDENCE · CLUE '+String(i+1).padStart(2,'0');$('clue-dialog-title').textContent=clue.title;$('clue-dialog-text').textContent=clue.text;$('collect-clue').textContent=progress().found.includes(i)?'Back to the case →':'Add to my evidence ＋';$('clue-dialog').showModal();}
function collectClue(){const p=progress();if(!p.found.includes(openClue))p.found.push(openClue);persist();$('clue-dialog').close();render();const remaining=[0,1,2].find(i=>!p.found.includes(i));if(remaining===undefined){$('answers').querySelector('button').focus();$('feedback').textContent='All three clues collected. Time for a theory!';}else document.querySelectorAll('.clue-card')[remaining].focus();}
function guess(i){const c=current(),p=progress();if(p.found.length<3||p.solved||p.theory)return;if(i===c.answer){p.theory=true;persist();render();$('feedback').textContent='That fits! Now show Pip the evidence.';$('proof-answers').querySelector('button').focus();}else{$('feedback').textContent='A theory worth checking! Look at “'+c.clues[1].title+'” again, then try another answer.';}}
function prove(i){const c=current(),p=progress();if(!p.theory||p.found.length<3||p.solved)return;if(i!==c.proofAnswer){$('feedback').textContent='That fact doesn’t explain the word’s history. Which clue connects the word to the language?';return;}p.solved=true;persist();render();$('solved').setAttribute('tabindex','-1');$('solved').focus({preventScroll:true});$('solved').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}
function renderSolution(){const c=current();$('explanation').textContent=c.explanation;$('journey-note').textContent=c.note;$('related-title').textContent=c.relatedTitle;$('related-text').textContent=c.related;$('journey').replaceChildren(...c.journey.map(([language,word,meaning])=>{const d=document.createElement('div');d.className='journey-stop';for(const [tag,text] of [['small',language],['b',word],['span',meaning]]){const node=document.createElement(tag);node.textContent=text;d.append(node);}return d;}));const remaining=CASES.some(item=>!state.cases[item.id]?.solved);$('next-case').textContent=remaining?'Open the next case →':'See all my discoveries →';}
function openNotebook(){const solved=CASES.filter(c=>state.cases[c.id]?.solved);$('discoveries').replaceChildren();if(!solved.length){const p=document.createElement('p');p.textContent='Your notebook is waiting for its first discovery. Inspect three clues and solve a case to start your collection.';$('discoveries').append(p);}for(const c of solved){const d=document.createElement('div');d.className='discovery';const h=document.createElement('h3');h.textContent='✓ '+c.word;const p=document.createElement('p');p.textContent=c.journey.map(s=>s[1]).join(' → ');const link=button('Reopen the case →',()=>{$('notebook-dialog').close();selectCase(CASES.indexOf(c));},'text-button');d.append(h,p,link);$('discoveries').append(d);}$('notebook-dialog').showModal();}
$('collect-clue').addEventListener('click',collectClue);
$('notebook-open').addEventListener('click',openNotebook);
$('sources-open').addEventListener('click',()=>{$('reset-confirm').hidden=true;$('sources-dialog').showModal();});
$('speak').addEventListener('click',()=>{if(!window.speechSynthesis)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(current().word);utterance.lang='en-GB';utterance.rate=.8;speechSynthesis.speak(utterance);});
$('next-case').addEventListener('click',()=>{let next=-1;for(let offset=1;offset<=CASES.length;offset++){const i=(state.current+offset)%CASES.length;if(!state.cases[CASES[i].id]?.solved){next=i;break;}}if(next<0){openNotebook();return;}selectCase(next);document.querySelector('.case-area').scrollIntoView({block:'start',behavior:'auto'});const first=document.querySelector('.clue-card');first.focus({preventScroll:true});});
$('reset').addEventListener('click',()=>{$('reset-confirm').hidden=false;$('reset-yes').focus();});
$('reset-no').addEventListener('click',()=>{$('reset-confirm').hidden=true;$('reset').focus();});
$('reset-yes').addEventListener('click',()=>{state=cleanState(null);persist();$('sources-dialog').close();render();});
for(const c of CASES){const d=document.createElement('div');d.className='source-item';const title=document.createElement('strong');title.textContent=c.word;d.append(title);for(const [name,url] of c.sources){const a=document.createElement('a');a.textContent=name+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';d.append(a);}$('source-list').append(d);}
render();
