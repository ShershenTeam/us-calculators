import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'square-footage',
  name: 'Square Footage Calculator',
  blurb: 'Total square feet for several rooms of any shape, with cut-outs, waste and boxes.',
  slugs: { en: 'square-footage-calculator' },
  primaryKeyword: 'square footage calculator',
  category: 'construction',
  related: ['cubic-yards', 'gravel', 'concrete', 'mulch', 'topsoil'],
  next: ['cubic-yards', 'concrete', 'gravel'],
  aliases: [
    'sq ft calculator',
    'square foot calculator',
    'square feet calculator',
    'room square footage calculator',
    'house square footage calculator',
    'flooring square footage calculator',
    'area in square feet',
    'how to calculate square footage',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'SquareFootageCalculator',
});
