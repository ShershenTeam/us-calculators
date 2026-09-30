import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in stage F (Page_Plan row for square-footage-calculator).
export default defineCalculator({
  id: 'square-footage',
  name: 'Square Footage Calculator',
  blurb: 'Area of rooms, yards and odd shapes in square feet.',
  slugs: { en: 'square-footage-calculator' },
  primaryKeyword: 'square footage calculator',
  category: 'construction',
  related: ['gravel'],
  next: ['gravel'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
