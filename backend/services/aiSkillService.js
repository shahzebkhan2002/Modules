import { SKILL_CATALOG, ALL_CATEGORIES } from '../config/skillCatalog.js';

// Predefined catalog lookup for matching and normalization
const CATALOG_MAP = {};
SKILL_CATALOG.forEach((cat) => {
  cat.skills.forEach((skill) => {
    CATALOG_MAP[skill.toLowerCase()] = {
      name: skill,
      category: cat.category,
    };
  });
});

/**
 * Intelligent Fallback Extractor when AI API key is missing or offline
 */
export const extractSkillsFallback = (experienceText) => {
  const text = (experienceText || '').trim().toLowerCase();

  // Vague input detection
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 5 || !/[a-zA-Z]/.test(text)) {
    return {
      isVague: true,
      message:
        'Your description is too brief. Please describe the specific tasks, tools, systems, or materials you worked with (e.g., house wiring, pipe fitting, painting, tile fixing).',
      detectedSkills: [],
      additionalSuggestions: [],
    };
  }

  // Common vague phrases check
  const vaguePhrases = [
    'i have worked',
    'worked for 3 years',
    'worked for three years',
    'worked for 2 years',
    'i do work',
    'i am hard worker',
    'i need job',
    'experienced worker',
  ];
  const isGeneric = vaguePhrases.some((vp) => text === vp || text === `${vp}.`);
  if (isGeneric && words.length <= 8) {
    return {
      isVague: true,
      message:
        'Please provide more details about your specific trade experience and daily work responsibilities.',
      detectedSkills: [],
      additionalSuggestions: [],
    };
  }

  const detected = [];
  const categoriesFound = new Set();

  // Keyword rules matching trade catalog
  const rules = [
    {
      keywords: ['wiring', 'wire', 'bijli', 'tar', 'conduit', 'electr', 'breaker', 'switch', 'db board'],
      skill: 'Electrical Wiring Installation',
      category: 'Electrical Services',
    },
    {
      keywords: ['fault', 'short circuit', 'tripping', 'repair wiring', 'testing'],
      skill: 'Electrical Fault Diagnosis',
      category: 'Electrical Services',
    },
    {
      keywords: ['solar', 'solar panel', 'photovoltaic', 'solar inverter', 'solar system'],
      skill: 'Solar Panel Installation',
      category: 'Electrical Services',
    },
    {
      keywords: ['ups', 'inverter', 'battery backup', 'generator'],
      skill: 'UPS & Inverter Installation',
      category: 'Electrical Services',
    },
    {
      keywords: ['pipe', 'piping', 'ppr', 'pvc', 'plumb', 'sanitary', 'fittings'],
      skill: 'Pipe Installation & Fitting',
      category: 'Plumbing & Sanitary',
    },
    {
      keywords: ['leak', 'leakage', 'seepage', 'dripping tap', 'flush tank'],
      skill: 'Water Leakage Repair',
      category: 'Plumbing & Sanitary',
    },
    {
      keywords: ['drain', 'drainage', 'gutter', 'sewer', 'blockage', 'clogged'],
      skill: 'Drainage Maintenance & Clearing',
      category: 'Plumbing & Sanitary',
    },
    {
      keywords: ['motor', 'pump', 'water motor', 'boring pump', 'submersible'],
      skill: 'Water Motor & Pump Repair',
      category: 'Plumbing & Sanitary',
    },
    {
      keywords: ['furniture', 'wood', 'table', 'chair', 'bed', 'carpenter', 'lakri'],
      skill: 'Furniture Assembly & Repair',
      category: 'Carpentry & Woodwork',
    },
    {
      keywords: ['door', 'window', 'chokhat', 'hinge', 'lock'],
      skill: 'Door & Window Installation',
      category: 'Carpentry & Woodwork',
    },
    {
      keywords: ['polish', 'varnish', 'wood finishing', 'deco polish'],
      skill: 'Wood Polishing & Finishing',
      category: 'Carpentry & Woodwork',
    },
    {
      keywords: ['paint', 'color', 'rang', 'distemper', 'plastic emulsion'],
      skill: 'Interior Wall Painting',
      category: 'Painting & Renovation',
    },
    {
      keywords: ['weather', 'rockwall', 'exterior paint', 'weathershield'],
      skill: 'Exterior Weather-Sheet Application',
      category: 'Painting & Renovation',
    },
    {
      keywords: ['putty', 'plaster of paris', 'wall preparation', 'base coating'],
      skill: 'Wall Putty & Surface Preparation',
      category: 'Painting & Renovation',
    },
    {
      keywords: ['seepage', 'waterproofing', 'roof leaking', 'chemical coating'],
      skill: 'Water Seepage & Proofing',
      category: 'Painting & Renovation',
    },
    {
      keywords: ['brick', 'eent', 'mason', 'masonry', 'mistri', 'wall construction'],
      skill: 'Bricklaying & Masonry',
      category: 'Construction & Masonry',
    },
    {
      keywords: ['plaster', 'cement', 'mortar'],
      skill: 'Cement Plastering',
      category: 'Construction & Masonry',
    },
    {
      keywords: ['tile', 'marble', 'flooring', 'grout', 'granite'],
      skill: 'Floor & Wall Tile Laying',
      category: 'Construction & Masonry',
    },
    {
      keywords: ['ac', 'air conditioner', 'inverter ac', 'split ac'],
      skill: 'AC Installation & Dismantling',
      category: 'AC & Refrigeration',
    },
    {
      keywords: ['gas refill', 'gas charging', 'r32', 'r410', 'cooling problem'],
      skill: 'AC Gas Refill & Servicing',
      category: 'AC & Refrigeration',
    },
    {
      keywords: ['fridge', 'refrigerator', 'deep freezer', 'compressor'],
      skill: 'Refrigerator & Freezer Repair',
      category: 'AC & Refrigeration',
    },
    {
      keywords: ['weld', 'welding', 'fabricat', 'grill', 'iron gate'],
      skill: 'Iron Gate & Grill Welding',
      category: 'Welding & Steel Fabrication',
    },
  ];

  rules.forEach((rule) => {
    const matches = rule.keywords.some((k) => text.includes(k));
    if (matches) {
      if (!detected.some((s) => s.name === rule.skill)) {
        detected.push({ name: rule.skill, category: rule.category });
        categoriesFound.add(rule.category);
      }
    }
  });

  if (detected.length === 0) {
    return {
      isVague: true,
      message:
        'Could not identify recognized trade skills from this description. Please specify technical tasks such as wiring, pipe fitting, painting, welding, or tile laying.',
      detectedSkills: [],
      additionalSuggestions: [],
    };
  }

  // Generate additional suggestions from the same categories
  const additionalSuggestions = [];
  categoriesFound.forEach((catName) => {
    const catObj = SKILL_CATALOG.find((c) => c.category === catName);
    if (catObj) {
      catObj.skills.forEach((s) => {
        if (
          !detected.some((d) => d.name === s) &&
          !additionalSuggestions.some((a) => a.name === s)
        ) {
          additionalSuggestions.push({ name: s, category: catName });
        }
      });
    }
  });

  return {
    isVague: false,
    detectedSkills: detected.slice(0, 6),
    additionalSuggestions: additionalSuggestions.slice(0, 4),
    source: 'rule-engine-fallback',
  };
};

/**
 * Main AI Skill Extraction using OpenAI API (with Gemini & Heuristic Fallback)
 */
export const extractSkillsFromExperience = async (experienceText) => {
  const text = (experienceText || '').trim();
  if (!text) {
    return {
      isVague: true,
      message: 'Experience description cannot be empty.',
      detectedSkills: [],
      additionalSuggestions: [],
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const systemInstruction = `You are an expert AI skill profiler for a Digital Labour Marketplace in Pakistan.
Analyze the worker's work experience description and extract structured technical skills.

Agreed Trade Categories:
${SKILL_CATALOG.map((c) => `- ${c.category}: ${c.skills.join(', ')}`).join('\n')}

Rules:
1. If the text is vague, generic (e.g. "I worked for 3 years", "I am a worker", "hard working guy"), or lacks actionable technical details, set "isVague": true, explain why in "message", and return empty arrays for detectedSkills and additionalSuggestions.
2. If specific skills are mentioned or clearly implied, list them in "detectedSkills". Match each skill name and category to the predefined categories above.
3. Suggest up to 3 complementary skills that logically pair with the worker's trade in "additionalSuggestions".
4. Do NOT mark any skill as verified. Output strict JSON only.

JSON format:
{
  "isVague": false,
  "message": "",
  "detectedSkills": [
    { "name": "Exact skill name", "category": "Trade Category" }
  ],
  "additionalSuggestions": [
    { "name": "Suggested complementary skill", "category": "Category" }
  ]
}`;

  // 1. Try OpenAI API if key is present
  if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            isVague: Boolean(parsed.isVague),
            message: parsed.message || '',
            detectedSkills: Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills : [],
            additionalSuggestions: Array.isArray(parsed.additionalSuggestions)
              ? parsed.additionalSuggestions
              : [],
            source: `openai-${model}`,
          };
        }
      } else {
        const errBody = await response.text();
        console.warn('OpenAI API call returned error:', errBody);
      }
    } catch (err) {
      console.warn('Error connecting to OpenAI service:', err.message);
    }
  }

  // 2. Secondary AI check (Gemini) if configured
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nInput:\n"${text}"` }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return {
            isVague: Boolean(parsed.isVague),
            message: parsed.message || '',
            detectedSkills: Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills : [],
            additionalSuggestions: Array.isArray(parsed.additionalSuggestions)
              ? parsed.additionalSuggestions
              : [],
            source: 'gemini-ai',
          };
        }
      }
    } catch (error) {
      console.warn('Error connecting to Gemini service:', error.message);
    }
  }

  // 3. Graceful Catalog Heuristic Fallback
  return extractSkillsFallback(text);
};
