import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in phase 2 (docs/05-roadmap.md, Construction).
export default defineCalculator({
  id: 'tile',
  name: 'Tile Calculator',
  blurb: 'Tiles and boxes for floors and walls, with grout lines and waste.',
  slugs: { en: 'tile-calculator' },
  primaryKeyword: 'tile calculator',
  category: 'construction',
  related: ['paint', 'square-footage'],
  next: ['square-footage'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
