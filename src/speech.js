'use strict';
// Browser speech is a listening aid. Historical forms use explicitly labelled approximations.
export function createSpeech({onSpeakingChange=()=>{}}={}){
 const supported=!!(window.speechSynthesis&&window.SpeechSynthesisUtterance);
 let currentToken=0,activeButton=null,cancelVoiceWait=null;
 const selectedVoices=new Map();
 function status(message){const el=document.getElementById('speech-status');if(el)el.textContent=message;}
 function stop(){currentToken++;if(cancelVoiceWait){cancelVoiceWait();cancelVoiceWait=null;}window.speechSynthesis?.cancel();if(activeButton){activeButton.removeAttribute('aria-busy');activeButton=null;}onSpeakingChange(false);}
 function languageKey(tag){return (tag||'').toLowerCase().replace(/_/g,'-');}
 function sameLanguage(a,b){
  const base=tag=>{const code=languageKey(tag).split('-')[0];return code==='no'?'nb':code;};
  return base(a)===base(b);
 }
 function availableVoices(){try{return window.speechSynthesis.getVoices()||[];}catch{return [];}}
 function chooseVoice(value){
  const key=languageKey(value.lang),voices=availableVoices();
  // Retain the first matching speaker for this language; list order can change.
  const retained=selectedVoices.get(key);
  if(retained){
   const refreshed=voices.find(v=>sameLanguage(v.lang,retained.voice.lang)&&(v.voiceURI||v.name)===(retained.voice.voiceURI||retained.voice.name));
   if(refreshed)retained.voice=refreshed;
   return retained;
  }
  const voice=voices.find(v=>languageKey(v.lang)===key)||voices.find(v=>sameLanguage(v.lang,value.lang));
  if(voice){const choice={voice,approximation:null};selectedVoices.set(key,choice);return choice;}
  // An approximation is permitted only when explicitly declared in language data.
  if(value.fallback){
   const fallback=chooseVoice({lang:value.fallback.lang});
   if(fallback){const choice={voice:fallback.voice,approximation:value.fallback.label};selectedVoices.set(key,choice);return choice;}
  }
  return null;
 }
 function waitForVoice(value,token,ready){
  const synth=window.speechSynthesis;let poll=null,deadline=null,closed=false;
  function cleanup(){
   if(closed)return;closed=true;
   if(poll!==null)clearTimeout(poll);if(deadline!==null)clearTimeout(deadline);
   synth.removeEventListener?.('voiceschanged',check);
   if(cancelVoiceWait===cleanup)cancelVoiceWait=null;
  }
  function check(){
   if(closed)return;
   if(token!==currentToken){cleanup();return;}
   const choice=chooseVoice(value);
   if(choice){cleanup();ready(choice);return;}
   if(poll!==null)clearTimeout(poll);
   if(typeof setTimeout==='function')poll=setTimeout(check,100);
  }
  cancelVoiceWait=cleanup;synth.addEventListener?.('voiceschanged',check);
  if(typeof setTimeout==='function')deadline=setTimeout(()=>{cleanup();if(token===currentToken)ready(null);},2000);
  else{cleanup();ready(null);return;}
  check();
 }
 function speak(value,button){
  if(!value?.text)return;
  if(!supported){status('Spoken words are unavailable in this browser. Try Chrome, Edge or Safari.');return;}
  stop();const token=currentToken;
  activeButton=button||null;activeButton?.setAttribute('aria-busy','true');
  const finish=()=>{if(token!==currentToken)return;activeButton?.removeAttribute('aria-busy');activeButton=null;onSpeakingChange(false);};
  function play(choice){
   if(token!==currentToken)return;
   if(!choice){finish();status('A '+value.language+' voice is not available yet. Try again once its voice has loaded or been installed. The word will not be read in an unrelated accent.');return;}
   const voice=choice.voice,utterance=new window.SpeechSynthesisUtterance(value.text);
   // Set both fields explicitly. Never set the language from an English fallback.
   utterance.lang=voice.lang;utterance.voice=voice;
   utterance.rate=document.getElementById('speech-slow')?.checked ? .65 : .85;utterance.pitch=1;
   status((value.historical||choice.approximation?'Voice approximation: ':'Listen: ')+value.word+' · '+(voice.name||voice.lang)+' ('+voice.lang+')'+(choice.approximation?' · '+choice.approximation: value.historical?' · historical pronunciation may differ.':''));
   utterance.onend=finish;
   utterance.onstart=()=>{if(token===currentToken)onSpeakingChange(true);};
   utterance.onerror=e=>{if(token!==currentToken)return;finish();if(!['canceled','interrupted'].includes(e.error))status('Could not play this word with its selected language voice. Try again; no English substitute will be used.');};
   try{window.speechSynthesis.speak(utterance);}catch{finish();status('Could not play this word with its selected language voice.');}
  }
  const choice=chooseVoice(value);
  if(choice){play(choice);return;}
  status('Loading a '+value.language+' voice for '+value.word+'…');
  waitForVoice(value,token,play);
 }

 function bind(button,value){
  button.type='button';button.classList.add('speak-word');button.textContent=value?.historical?'🔊 Hear approximation':'🔊 Hear word';
  button.setAttribute('aria-label',(value?.historical?'Hear an approximate reading of ':'Hear ')+(value?.word||'word'));
  button.disabled=!supported;button.title=!supported?'Speech is unavailable in this browser':value?.historical?'Modern browser voice; historical pronunciation may differ':'Play spoken word';
  button.onclick=()=>speak(value,button);
 }
 return {supported,speak,bind,stop};
}
