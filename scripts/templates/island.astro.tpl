---
/** Static wrapper that hydrates the Preact island (required by src/pages/[slug].astro). */
import {{island}} from './{{island}}';
interface Props {
  locale?: 'en' | 'es';
}
---

<{{island}} client:load />
