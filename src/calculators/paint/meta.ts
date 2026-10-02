import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'paint',
  name: 'Paint Calculator',
  blurb: 'Gallons and quarts of paint for rooms, walls and ceilings, minus doors and windows.',
  slugs: { en: 'paint-calculator' },
  primaryKeyword: 'paint calculator',
  category: 'construction',
  related: ['square-footage', 'drywall', 'tile', 'concrete', 'cubic-yards'],
  next: ['square-footage', 'drywall', 'tile'],
  aliases: [
    'how much paint do i need',
    'paint estimator',
    'gallons of paint calculator',
    'wall paint calculator',
    'room paint calculator',
    'interior paint calculator',
    'how many gallons of paint for a room',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'PaintCalculator',
});
