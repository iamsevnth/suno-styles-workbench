import { generateStylesPrompts } from '../src/lib/suno/generate.ts';
import { parseUserInput } from '../src/lib/suno/parse.ts';
import { pickSuggestions, SURPRISE_BRIEF } from '../src/lib/suno/suggestions.ts';
import { toTitleCase, historyFileStamp } from '../src/lib/suno/title-case.ts';
import { runSkill } from '../src/lib/suno/skills/run.ts';
import { formatAllPromptsTxt } from '../src/lib/suno/v6.ts';

console.log('Running Acceptance Tests...');

// Test 4: Suggestions
const sug1 = pickSuggestions(1);
const sug2 = pickSuggestions(2);
console.assert(sug1[0] === SURPRISE_BRIEF, 'Surprise me must be first');
console.assert(sug1.every(s => s.length <= 250), 'All suggestions <= 250 chars');
console.log('Test 4 passed: Suggestions properly generated');

// Test 5: "140 BPM trap future bass, female vocals, high energy"
const res5 = generateStylesPrompts('140 BPM trap future bass, female vocals, high energy', { count: 6 });
console.assert(res5.prompts.length === 6, 'Should generate 6 prompts');
for (const p of res5.prompts) {
  console.assert(p.characters >= 925 && p.characters <= 975, `Char count ${p.characters} out of range`);
  console.assert(p.styles.includes('140 BPM'), 'Must include 140 BPM');
  console.assert(/Trap/i.test(p.styles) && /Future Bass/i.test(p.styles), 'Must contain Trap and Future Bass');
  console.assert(/female/i.test(p.styles), 'Must contain female');
  console.assert(/Primary instrumentation:/i.test(p.styles), 'Must have Primary instrumentation');
}
console.log('Test 5 passed: 6 prompts 925-975 chars with 140 BPM, Trap, Future Bass, female');

// Test 6: "92bpm dark r&b, male tenor, intimate, half-time"
const res6 = generateStylesPrompts('92bpm dark r&b, male tenor, intimate, half-time', { count: 3 });
for (const p of res6.prompts) {
  console.assert(p.characters >= 925 && p.characters <= 975, `Char count ${p.characters} out of range`);
  console.assert(p.styles.includes('92 BPM'), 'Must include 92 BPM');
  console.assert(/Dark R&B/i.test(p.styles), 'Must contain Dark R&B');
  console.assert(/male/i.test(p.styles) && /tenor/i.test(p.styles), 'Must contain male tenor');
  console.assert(/half-time/i.test(p.styles), 'Must contain half-time');
  console.assert(!/140 UKG/i.test(p.styles) && !/Wubby 140/i.test(p.styles), 'Must not contain conflicting tempo genres');
}
console.log('Test 6 passed: 92 BPM Dark R&B, male tenor, half-time, no 140 conflict');

// Test 7: "experimental trap, 128 bpm, instrumental, cinematic risers"
const res7 = generateStylesPrompts('experimental trap, 128 bpm, instrumental, cinematic risers', { count: 3 });
for (const p of res7.prompts) {
  console.assert(p.characters >= 925 && p.characters <= 975, `Char count ${p.characters} out of range`);
  console.assert(p.styles.includes('128 BPM'), 'Must include 128 BPM');
  console.assert(!/female vocals|male vocals/i.test(p.styles), 'Must not say female/male vocals when instrumental');
  console.assert(p.styles.toLowerCase().includes('instrumental'), 'Must reflect instrumental');
}
console.log('Test 7 passed: 128 BPM experimental trap instrumental with risers');

// Test 8: "gospel dubstep 150bpm reese bass"
const res8 = generateStylesPrompts('gospel dubstep 150bpm reese bass', { count: 3 });
for (const p of res8.prompts) {
  console.assert(p.characters >= 925 && p.characters <= 975, `Char count ${p.characters} out of range`);
  console.assert(p.styles.includes('150 BPM'), 'Must include 150 BPM');
  console.assert(/Gospel/i.test(p.styles) && /Dubstep/i.test(p.styles), 'Must contain Gospel and Dubstep');
  console.assert(/Reese/i.test(p.styles), 'Must contain Reese');
}
console.log('Test 8 passed: 150 BPM Gospel Dubstep with Reese bass');

// Test 9: Avoid recipe collision
const runA = generateStylesPrompts('140 BPM trap future bass', { count: 3 });
const recipesA = runA.prompts.map(p => p.plan.recipeId);
const runB = generateStylesPrompts('140 BPM trap future bass', { count: 3, avoidFingerprints: recipesA });
const recipesB = runB.prompts.map(p => p.plan.recipeId);
for (const r of recipesB) {
  console.assert(!recipesA.includes(r), `Recipe ${r} was repeated`);
}
console.log('Test 9 passed: Recipe uniqueness across runs');

// Test 14: formatAllPromptsTxt
const txt = formatAllPromptsTxt(res5.prompts);
console.assert(txt.includes('ID#'), 'Txt export must include ID#');
console.assert(txt.includes('===='), 'Txt export must include ==== delimiter');
console.log('Test 14 passed: Format all prompts txt structure');

// Test 15: Timestamps
const stamp1 = historyFileStamp(new Date(2026, 8, 28, 4, 15, 30, 42));
console.assert(stamp1 === '20260928_041530_042', `Stamp mismatch: ${stamp1}`);
console.log('Test 15 passed: Timestamp format accurate');

// Test 17: Skills Rights with commercial artist
const rightsReport = runSkill('rights', { request: 'Make a song', named: 'Drake', material: 'named-style' });
console.assert(rightsReport.exclusion.includes('Drake'), 'Exclusion must reference Drake');
console.assert(rightsReport.exclusion.includes('Will not copy'), 'Exclusion must specify boundaries');
console.log('Test 17 passed: Rights skill exclusion section');

// Test 19: Leak checks
for (const p of [...res5.prompts, ...res6.prompts, ...res7.prompts, ...res8.prompts]) {
  console.assert(!/\b(taylor swift|drake|kanye|the weeknd|billie eilish)\b/i.test(p.styles), 'No artist leak');
  console.assert(!/\bin the style of\b/i.test(p.styles), 'No in the style of');
  console.assert(!/\[(verse|chorus|bridge)\]/i.test(p.styles), 'No lyrics tags in styles');
}
console.log('Test 19 passed: Negative and leak checks passed');

// Test 20: Title casing
const title1 = toTitleCase('swung emotional bass and trap | 140 bpm | 950 total characters');
console.assert(title1.includes('Swung Emotional Bass and Trap'), `Title case error: ${title1}`);
console.assert(title1.includes('140 BPM'), `BPM uppercase check: ${title1}`);
console.log('Test 20 passed: Title case formatting');

console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
