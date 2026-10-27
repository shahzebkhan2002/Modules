export const SKILL_CATALOG = [
  {
    category: 'Electrical Services',
    description: 'Electrical wiring, diagnostics, solar, and power systems',
    skills: [
      'Electrical Wiring Installation',
      'Electrical Fault Diagnosis',
      'Solar Panel Installation',
      'Circuit Breaker & DB Board Repair',
      'UPS & Inverter Installation',
      'Home Appliance Wiring',
      'Lighting & Fan Installation',
    ],
  },
  {
    category: 'Plumbing & Sanitary',
    description: 'Pipes, drainage, fittings, and water pumps',
    skills: [
      'Pipe Installation & Fitting',
      'Water Leakage Repair',
      'Drainage Maintenance & Clearing',
      'Sanitary Fixtures Installation',
      'Water Motor & Pump Repair',
      'Geyser Installation & Repair',
    ],
  },
  {
    category: 'Carpentry & Woodwork',
    description: 'Wood repair, furniture, and fittings',
    skills: [
      'Furniture Assembly & Repair',
      'Door & Window Installation',
      'Wood Polishing & Finishing',
      'Kitchen Cabinetry',
      'Wooden Partition & False Ceiling',
      'Lock & Hardware Fitting',
    ],
  },
  {
    category: 'Painting & Renovation',
    description: 'Interior, exterior, putty, and waterproofing',
    skills: [
      'Interior Wall Painting',
      'Exterior Weather-Sheet Application',
      'Wall Putty & Surface Preparation',
      'Water Seepage & Proofing',
      'Texture Coating & Wallpaper',
    ],
  },
  {
    category: 'Construction & Masonry',
    description: 'Brickwork, plaster, tiles, and civil masonry',
    skills: [
      'Bricklaying & Masonry',
      'Cement Plastering',
      'Floor & Wall Tile Laying',
      'Concrete Mixing & Casting',
      'Demolition & Structural Repair',
    ],
  },
  {
    category: 'AC & Refrigeration',
    description: 'Cooling, compressors, and household appliances',
    skills: [
      'AC Installation & Dismantling',
      'AC Gas Refill & Servicing',
      'Refrigerator & Freezer Repair',
      'Washing Machine Maintenance',
    ],
  },
  {
    category: 'Welding & Steel Fabrication',
    description: 'Metal works, grills, sheds, and gates',
    skills: [
      'Iron Gate & Grill Welding',
      'Steel Shed Fabrication',
      'Metal Structure Assembly',
      'Arch & Argon Welding',
    ],
  },
];

export const ALL_CATEGORIES = SKILL_CATALOG.map((c) => c.category);
