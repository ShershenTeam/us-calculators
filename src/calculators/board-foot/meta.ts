import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'board-foot',
  name: 'Board Foot Calculator',
  blurb: 'Board feet, linear feet and cost for a whole lumber list, by nominal size.',
  slugs: { en: 'board-foot-calculator' },
  primaryKeyword: 'board foot calculator',
  category: 'construction',
  related: ['square-footage', 'concrete', 'paint', 'cubic-yards', 'drywall'],
  next: ['square-footage', 'concrete', 'paint'],
  aliases: [
    'board feet calculator',
    'lumber calculator',
    'board foot formula',
    'how to calculate board feet',
    'bf calculator',
    'hardwood board foot calculator',
    'lumber cost calculator',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'BoardFootCalculator',
});
