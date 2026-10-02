import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in phase 2 (docs/05-roadmap.md, Construction).
export default defineCalculator({
  id: 'drywall',
  name: 'Drywall Calculator',
  blurb: 'Sheets of drywall, screws and joint compound for walls and ceilings.',
  slugs: { en: 'drywall-calculator' },
  primaryKeyword: 'drywall calculator',
  category: 'construction',
  related: ['paint', 'square-footage'],
  next: ['square-footage'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
