import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'gravel',
  name: 'Gravel Calculator',
  blurb: 'Cubic yards, tons and bags for one or several areas, with waste included.',
  slugs: { en: 'gravel-calculator' },
  primaryKeyword: 'gravel calculator',
  category: 'construction',
  related: ['cubic-yards', 'mulch', 'concrete', 'square-footage', 'topsoil'],
  next: ['cubic-yards', 'mulch', 'concrete'],
  aliases: [
    'gravel estimator',
    'crushed stone calculator',
    'pea gravel calculator',
    'gravel driveway calculator',
    'gravel tonnage calculator',
    'rock calculator',
    'how much gravel do i need',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'GravelCalculator',
});
