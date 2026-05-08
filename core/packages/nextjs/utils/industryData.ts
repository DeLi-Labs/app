export const INDUSTRIES = [
  // Medicine
  { industry: "Chemistry", parentCategory: "Medicine" },
  { industry: "Life Sciences", parentCategory: "Medicine" },
  { industry: "Biology", parentCategory: "Medicine" },
  { industry: "Biotechnology", parentCategory: "Medicine" },
  { industry: "Pharmaceuticals", parentCategory: "Medicine" },
  { industry: "Medical Devices", parentCategory: "Medicine" },
  { industry: "Diagnostics and Laboratory Technology", parentCategory: "Medicine" },
  { industry: "Clinical Technology and Healthcare Services", parentCategory: "Medicine" },
  { industry: "Veterinary Medicine", parentCategory: "Medicine" },
  { industry: "Cosmetics", parentCategory: "Medicine" },
  { industry: "Bioinformatics", parentCategory: "Medicine" },
  { industry: "Neuroscience", parentCategory: "Medicine" },
  { industry: "Synthetic Biology", parentCategory: "Medicine" },
  { industry: "Longevity & Anti-Aging", parentCategory: "Medicine" },
  { industry: "Digital Therapeutics", parentCategory: "Medicine" },

  // Engineering
  { industry: "Mechanical Engineering", parentCategory: "Engineering" },
  { industry: "Industrial Manufacturing", parentCategory: "Engineering" },
  { industry: "Materials Science", parentCategory: "Engineering" },
  { industry: "Robotics and Automation", parentCategory: "Engineering" },
  { industry: "Automotive / Mobility", parentCategory: "Engineering" },
  { industry: "Aerospace", parentCategory: "Engineering" },
  { industry: "Space Technology", parentCategory: "Engineering" },
  { industry: "Defense and Dual Use Technology", parentCategory: "Engineering" },
  { industry: "Construction and Infrastructure", parentCategory: "Engineering" },
  { industry: "Logistics and Supply Chain", parentCategory: "Engineering" },
  { industry: "Additive Manufacturing (3D Printing)", parentCategory: "Engineering" },
  { industry: "Drone Technology (UAV)", parentCategory: "Engineering" },
  { industry: "Maritime & Subsea Tech", parentCategory: "Engineering" },
  { industry: "Smart Cities", parentCategory: "Engineering" },

  // Technology
  { industry: "Artificial Intelligence", parentCategory: "Technology" },
  { industry: "Software / Information Technology", parentCategory: "Technology" },
  { industry: "Electronics / Semiconductors", parentCategory: "Technology" },
  { industry: "Telecommunications", parentCategory: "Technology" },
  { industry: "Cybersecurity", parentCategory: "Technology" },
  { industry: "Blockchain and Cryptography", parentCategory: "Technology" },
  { industry: "Quantum Computing", parentCategory: "Technology" },
  { industry: "Internet of Things (IoT)", parentCategory: "Technology" },
  { industry: "Photonics and Optics", parentCategory: "Technology" },
  { industry: "Nanotechnology", parentCategory: "Technology" },
  { industry: "Consumer Electronics", parentCategory: "Technology" },
  { industry: "Big Data & Analytics", parentCategory: "Technology" },
  { industry: "Virtual & Augmented Reality", parentCategory: "Technology" },
  { industry: "FinTech & EdTech", parentCategory: "Technology" },

  // Energy
  { industry: "Energy / Renewables", parentCategory: "Energy" },
  { industry: "Battery Technology and Energy Storage", parentCategory: "Energy" },
  { industry: "Hydrogen Technology", parentCategory: "Energy" },
  { industry: "Nuclear Technology", parentCategory: "Energy" },
  { industry: "Environmental Technology", parentCategory: "Energy" },
  { industry: "Water Treatment", parentCategory: "Energy" },
  { industry: "Carbon Capture & Storage", parentCategory: "Energy" },
  { industry: "Smart Grid Technology", parentCategory: "Energy" },
  { industry: "Superconductivity", parentCategory: "Energy" },
  { industry: "Geoengineering", parentCategory: "Energy" },

  // Resources
  { industry: "Agriculture", parentCategory: "Resources" },
  { industry: "Food Tech", parentCategory: "Resources" },
  { industry: "Mining and Metallurgy", parentCategory: "Resources" },
  { industry: "Smart Farming", parentCategory: "Resources" },
  { industry: "Vertical Farming", parentCategory: "Resources" },
  { industry: "Sustainable Forestry", parentCategory: "Resources" },
  { industry: "Circular Economy Tech", parentCategory: "Resources" },

  // Creative
  { industry: "Industrial Design", parentCategory: "Creative" },
  { industry: "Textiles and Smart Fabrics", parentCategory: "Creative" },
  { industry: "UI/UX Design", parentCategory: "Creative" },
  { industry: "Creative IP & Media Tech", parentCategory: "Creative" },
  { industry: "Gaming & Metaverse", parentCategory: "Creative" },
  { industry: "Architecture & Spatial Design", parentCategory: "Creative" },
] as const;

export type IndustryParentCategory = (typeof INDUSTRIES)[number]["parentCategory"];

const industryNameToParent = new Map<string, IndustryParentCategory>(
  INDUSTRIES.map(row => [row.industry, row.parentCategory]),
);

/** Parent category for an industry string that matches `INDUSTRIES[].industry` exactly. */
export function getParentCategoryForIndustryLabel(label: string): IndustryParentCategory | undefined {
  return industryNameToParent.get(label);
}
