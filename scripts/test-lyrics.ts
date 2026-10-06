import { generateLyrics } from '../src/lib/lyrics/generator.ts';
import { convertToPhonetics, wordToPhonetic } from '../src/lib/lyrics/phonetics.ts';
import { DEFAULT_STRUCTURE } from '../src/lib/lyrics/types.ts';

console.log('Testing Lyrics Generator...');

const gen = generateLyrics({
  theme: 'Midnight sub bass ritual in neo-tokyo',
  genre: 'Trapstep / Hybrid Bass',
  mood: 'Dark & Menacing',
  delivery: 'Intimate to Aggressive Chant',
  structure: DEFAULT_STRUCTURE,
});

console.assert(gen.sections.length > 5, 'Should generate multiple sections');
console.assert(gen.fullText.includes('[Verse 1]'), 'Should contain [Verse 1]');
console.assert(gen.fullText.includes('[Chorus'), 'Should contain Chorus section');
console.assert(gen.fullText.includes('[Drop'), 'Should contain Drop section');
console.assert(gen.totalLines > 10, 'Should have multiple lines');
console.log(`Generated ${gen.sections.length} sections, ${gen.totalLines} lines.`);

console.log('Testing Phonetics Converter...');
const sample = `[Chorus]
In the red line glow where the streetlights freeze
Hold the frequency until the glass begins to crack
Baile funk in the favela rhythm
I probably feel the sub bass tension dropping tonight`;

const phon = convertToPhonetics(sample);
console.assert(phon.lines.length >= 5, 'Should process at least 5 lines');
console.assert(phon.lines[0].isTag === true, 'First line should be tagged as isTag');
console.assert(phon.lines[0].phonetic === '[Chorus]', 'Tags should remain untouched');
console.assert(phon.lines[3].phonetic.includes('bylee') || phon.lines[3].phonetic.includes('Bylee'), 'Baile should convert to bylee');
console.assert(phon.lines[3].phonetic.includes('fahvelah'), 'Favela should convert to fahvelah');
console.assert(phon.lines[4].phonetic.includes('problee'), 'Probably should convert to problee');
console.assert(phon.lines[4].phonetic.includes('tha'), 'The should convert to tha');
console.assert(phon.lines[4].phonetic.includes('bays'), 'Bass should convert to bays');
console.assert(phon.lines[4].phonetic.includes('tenshun'), 'Tension should convert to tenshun');
console.assert(phon.lines[4].phonetic.includes('droppin'), 'Dropping should convert to droppin');
console.assert(!phon.lines[4].phonetic.includes('-'), 'Phonetic text must not contain hyphens');

console.log('Phonetic result snippet:');
console.log(phon.fullPhonetic);

console.log('ALL LYRICS & PHONETICS TESTS PASSED!');
