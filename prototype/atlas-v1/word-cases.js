'use strict';
// Additional case content. Historical forms and sources are kept with each case.
window.GREEK_CASES={
 trails:{
  fart:{word:'fart',meaning:'To let gas out of your bottom. A very old word for a very silly sound.',
   hint:'Stay in England. A medieval word clue is waiting—and Pip is already blaming a dragon.',
   stages:[
    {place:'england',word:'fart',language:'English',period:'Today · the action word',era:'today'},
    {place:'england',word:'feortan',language:'Old English',period:'An older word for the same action',era:'medieval',clue:'An older English word list gives feortan: to fart. People had this word centuries ago! The spelling changed locally. It also has relatives in other Germanic languages.',hint:'Try Scandinavia for a related Old Norse word. Similar words can be cousins, rather than one being borrowed from the other.'}
   ],
   complete:'fart ← Old English feortan. You followed the action word back within England. Old Norse freta is a related word on another branch. Pip would like everyone to know that the suspicious noise was definitely a dragon.'},
  dinosaur:{word:'dinosaur',meaning:'An ancient animal with a surprisingly modern name. Investigate a scientific report, then decode its Greek ingredients.',
   hint:'Stay in England first. Travel to the 1800s and inspect a scientific name published in 1842.',
   stages:[
    {place:'england',word:'dinosaur',language:'English',period:'Today',era:'today'},
    {place:'england',word:'Dinosauria',language:'Scientific Latin (New Latin)',period:'Owen’s report · 1842',era:'nineteenth',clue:'A scientific report published in 1842 contains Richard Owen’s new group name: Dinosauria. This is modern scientific Latin made from Greek roots. The English word dinosaur comes from this name.',hint:'Now look south-east to Greece. Find the ancient word parts that Owen used to build the new name.'},
    {place:'greece',word:'deinos + sauros',language:'Ancient Greek word parts',period:'Ancient roots reused in a modern name',era:'greek',clue:'Deinos means terrible or fearfully great; sauros means lizard. Owen combined these ancient Greek ingredients in his modern scientific name. Ancient Greeks did not use Dinosauria for these animals.'}
   ],
   complete:'dinosaur ← Dinosauria, a scientific Latin name published in England in 1842 ← Greek deinos + sauros. The animals are ancient; this scientific name is modern. New names can be built from very old word parts.'},
  school:{word:'school',meaning:'A familiar place whose word once had a surprising connection to free time.',
   hint:'Start with an older English word list. Stay in England and look back to Medieval times.',
   stages:[
    {place:'england',word:'school',language:'English',period:'Today',era:'today'},
    {place:'england',word:'scol',language:'Old English',period:'Before 900',era:'medieval',clue:'An older English word list gives scol for a place of learning. It is an earlier form in the story of school. Its source sends us to Latin.',hint:'Cross to the Italian peninsula and Roman times. Look for a Latin word for a place of instruction.'},
    {place:'rome',word:'schola',language:'Latin',period:'A place of learning',era:'roman',clue:'Latin schola meant a place of instruction or a learned discussion. English scol came from Latin. But Latin had borrowed this word too.',hint:'Go further back and east, to Ancient Greece. A word for leisure and learning is waiting there.'},
    {place:'greece',word:'skholē · σχολή',language:'Ancient Greek',period:'Leisure, discussion and learning',era:'greek',clue:'Greek skholē could mean leisure, learned discussion, and a place for lectures. That Greek word gave Latin schola its name. The meanings changed as people used the word in new ways.'}
   ],
   complete:'school ← Old English scol ← Latin schola ← Greek skholē. You traced a word through English, Latin and Greek—and discovered a change in meaning as well as spelling. This is the learning word; a school of fish has a different history.'}
 },
 localWords:{
  fart:{england:'fart',france:'péter',germany:'furzen',italy:'scoreggiare',spain:'peer',norse:'fjerte',greece:'κλάνω'},
  dinosaur:{england:'dinosaur',france:'dinosaure',germany:'Dinosaurier',italy:'dinosauro',spain:'dinosaurio',norse:'dinosaur',greece:'δεινόσαυρος'},
  school:{england:'school',france:'école',germany:'Schule',italy:'scuola',spain:'escuela',norse:'skole',greece:'σχολείο'}
 },
 contexts:{
  feortan:{icon:'💨',title:'The case of the suspicious noise',story:'Old English feortan meant to fart. The everyday English action word has a long history. Words for bodily sounds can survive through centuries, changing spelling along the way.',question:'Compare fart and feortan. Which letters stay familiar? If we find a similar word elsewhere, what evidence would help us decide whether it is a borrowed word or a relative?'},
  freta:{icon:'⛵',title:'A northern cousin',story:'Old Norse freta is related to English fart. It belongs to another branch of the word family. A family connection does not mean that English borrowed this word from Old Norse.',question:'Spot the f, r and t in both feortan and freta. Do matching letters give us a good lead? We still need historical evidence to establish the relationship.'},
  Dinosauria:{icon:'🦴',title:'A report from 1842',story:'Richard Owen grouped several fossil reptiles under the new scientific name Dinosauria. Scientific Latin was still being used to name animals in modern times. This stop belongs in England in the 1800s.',question:'How can a young word describe a very ancient animal? Separate the age of the animal from the age of its name.'},
  'deinos + sauros':{icon:'🏺',title:'Build a name with Greek',story:'Deinos and sauros are ancient Greek ingredients behind Dinosauria. Deinos can mean terrible or fearfully great; sauros means lizard. Their use in a modern name is a word-building clue.',question:'Try another name puzzle below. Can you spot sauros inside Stegosaurus and Tyrannosaurus?'},
  scol:{icon:'📜',title:'An older English learning word',story:'Old English scol is an earlier form in the history of school. The evidence takes us back within England before leading to its Latin source.',question:'Compare scol with school. Which letters can you recognise? A spelling comparison alone does not tell us exactly how everyone pronounced it.'},
  schola:{icon:'🏛️',title:'A Latin learning place',story:'Latin schola referred to instruction, learned discussion and a place of learning. It was borrowed from Greek and later passed into English.',question:'Compare schola, scol and school. What remains recognisable as the word moves through languages?'},
  'skholē · σχολή':{icon:'🏺',title:'From leisure to learning',story:'Greek skholē could refer to leisure and to the discussion and learning people used that time for. It could also refer to a place for lectures.',question:'How can a word for free time become connected with school? Notice that meaning can change along with spelling.'}
 },
 dinosaurs:[
  {name:'Triceratops',parts:'tri + cerat + ops',meaning:'three + horn + face',story:'Three-horned face: two large horns above the eyes and a smaller horn on the nose. Its scientific name uses Greek word parts.',source:'https://www.nhm.ac.uk/discover/dino-directory/triceratops.html'},
  {name:'Stegosaurus',parts:'stego + saurus',meaning:'roof + lizard',story:'Roof lizard: the name refers to its plates, which were originally thought to lie flat like a covering. Spot the lizard ingredient again!',source:'https://www.nhm.ac.uk/discover/dino-directory/stegosaurus.html'},
  {name:'Diplodocus',parts:'diplo + docus',meaning:'double + beam',story:'Double beam: the name refers to the shape of bones underneath its tail, rather than its long neck. The name uses Greek ingredients.',source:'https://www.nhm.ac.uk/discover/dino-directory/diplodocus.html'},
  {name:'T. rex',parts:'tyranno + saurus + rex',meaning:'tyrant + lizard + king',story:'T. stands for Tyrannosaurus. Its name mixes Greek ingredients for tyrant and lizard with Latin rex, meaning king.',source:'https://www.nhm.ac.uk/discover/dino-directory/tyrannosaurus.html'}
 ]
};
