import { extractSkillsFallback, extractSkillsFromExperience } from './services/aiSkillService.js';
import { SKILL_CATALOG } from './config/skillCatalog.js';

console.log('====================================================');
console.log(' DIGITAL LABOUR MARKETPLACE: MODULES 2 & 3 TEST SUITE');
console.log('====================================================\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // TEST 1: Electrician Experience Extraction
  console.log('--- TEST 1: Electrician Experience Extraction ---');
  const elecText = 'I have worked as an electrician for five years, installing house wiring, repairing electrical faults and installing solar panels.';
  const elecRes = await extractSkillsFromExperience(elecText);
  assert(!elecRes.isVague, 'Should not be marked as vague');
  assert(elecRes.detectedSkills.some(s => s.name.includes('Wiring')), 'Detects Wiring skill');
  assert(elecRes.detectedSkills.some(s => s.name.includes('Fault')), 'Detects Fault Diagnosis');
  assert(elecRes.detectedSkills.some(s => s.name.includes('Solar')), 'Detects Solar skill');
  assert(elecRes.additionalSuggestions.length > 0, 'Generates complementary suggestions');
  console.log('Detected:', elecRes.detectedSkills.map(s => s.name));
  console.log('Suggestions:', elecRes.additionalSuggestions.map(s => s.name));

  // TEST 2: Plumber Experience Extraction
  console.log('\n--- TEST 2: Plumber Experience Extraction ---');
  const plumbText = 'I have 4 years experience in plumbing, installing PPR pipes, fixing leaks and water pumps.';
  const plumbRes = await extractSkillsFromExperience(plumbText);
  assert(!plumbRes.isVague, 'Plumber not vague');
  assert(plumbRes.detectedSkills.some(s => s.category === 'Plumbing & Sanitary'), 'Matches Plumbing & Sanitary category');
  console.log('Detected:', plumbRes.detectedSkills.map(s => `${s.name} (${s.category})`));

  // TEST 3: Carpenter Experience Extraction
  console.log('\n--- TEST 3: Carpenter Experience Extraction ---');
  const carpText = 'I am a carpenter with 6 years experience in furniture assembly, doors and wooden cabinets.';
  const carpRes = await extractSkillsFromExperience(carpText);
  assert(!carpRes.isVague, 'Carpenter not vague');
  assert(carpRes.detectedSkills.some(s => s.category === 'Carpentry & Woodwork'), 'Matches Carpentry & Woodwork category');
  console.log('Detected:', carpRes.detectedSkills.map(s => `${s.name} (${s.category})`));

  // TEST 4: Painter Experience Extraction
  console.log('\n--- TEST 4: Painter Experience Extraction ---');
  const paintText = 'I have worked as a painter for 3 years doing interior painting, weather-sheet and putty.';
  const paintRes = await extractSkillsFromExperience(paintText);
  assert(!paintRes.isVague, 'Painter not vague');
  assert(paintRes.detectedSkills.some(s => s.category === 'Painting & Renovation'), 'Matches Painting category');
  console.log('Detected:', paintRes.detectedSkills.map(s => `${s.name} (${s.category})`));

  // TEST 5: Construction / Masonry Experience Extraction
  console.log('\n--- TEST 5: Construction Experience Extraction ---');
  const constText = '5 years in civil construction, bricklaying, cement plaster and tile laying.';
  const constRes = await extractSkillsFromExperience(constText);
  assert(!constRes.isVague, 'Construction not vague');
  assert(constRes.detectedSkills.some(s => s.category === 'Construction & Masonry'), 'Matches Construction category');
  console.log('Detected:', constRes.detectedSkills.map(s => `${s.name} (${s.category})`));

  // TEST 6: Vague Description Test (Crucial requirement from prompt)
  console.log('\n--- TEST 6: Vague Description Handling ---');
  const vagueText = 'I have worked for three years.';
  const vagueRes = await extractSkillsFromExperience(vagueText);
  assert(vagueRes.isVague === true, 'Vague description is flagged with isVague: true');
  assert(vagueRes.message && vagueRes.message.length > 10, 'Provides clear feedback asking for more details');
  assert(vagueRes.detectedSkills.length === 0, 'Does not hallucinate skills for vague input');
  console.log('Vague Response Message:', vagueRes.message);

  // TEST 7: Skill Catalog Integrity
  console.log('\n--- TEST 7: Skill Catalog Integrity ---');
  assert(SKILL_CATALOG.length >= 6, 'Contains at least 6 standard trade categories');
  const categories = SKILL_CATALOG.map(c => c.category);
  assert(categories.includes('Electrical Services'), 'Contains Electrical Services');
  assert(categories.includes('Plumbing & Sanitary'), 'Contains Plumbing & Sanitary');
  assert(categories.includes('Carpentry & Woodwork'), 'Contains Carpentry & Woodwork');

  console.log(`\n====================================================`);
  console.log(` TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`====================================================\n`);
}

runTests().catch(console.error);
