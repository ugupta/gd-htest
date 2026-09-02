import { z } from 'zod';
export const schemas = {
  site: z.object({
    "brandName": z.string(),
    "navigation": z.array(z.object({
      "label": z.string(),
      "href": z.string(),
      "id": z.string()
    })),
    "footerLink": z.object({
      "label": z.string(),
      "href": z.string()
    }),
    "copyright": z.string()
  }),
  pages: {
    home: z.object({
      "hero": z.object({
        "label": z.string(),
        "title": z.string(),
        "support": z.string(),
        "footerNote": z.string(),
        "linkLabel": z.string(),
        "linkHref": z.string()
      })
    }),
    runtime_lab: z.object({
      "eyebrow": z.string(),
      "title": z.string(),
      "description": z.string(),
      "cards": z.array(z.object({
        "id": z.string(),
        "title": z.string(),
        "body": z.string(),
        "action": z.string()
      })),
      "cacheLabel": z.string(),
      "cachePlaceholder": z.string(),
      "primeLabel": z.string(),
      "primePlaceholder": z.string(),
      "outputTitle": z.string(),
      "idleMessage": z.string()
    })
  }
};
export type Schemas = typeof schemas;