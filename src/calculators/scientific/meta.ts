import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built later (docs/05-roadmap.md).
export default defineCalculator({
  id: 'scientific',
  name: 'Scientific Calculator',
  blurb: 'A full scientific calculator with history, keyboard input and memory.',
  slugs: { en: 'scientific-calculator' },
  primaryKeyword: 'scientific calculator',
  category: 'math',
  related: ['percentage'],
  next: ['percentage'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
