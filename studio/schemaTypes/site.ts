import {defineField, defineType} from 'sanity'

export const site = defineType({
  name: 'site',
  title: 'Site',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Website Name',
      description: 'As seen on Google Search Results and Tab Bar',
      type: 'string',
    }),
    defineField({
      name: 'owner',
      title: 'Website Owner',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Website Description',
      type: 'string',
      description: 'As seen on Google Search Results (max. 160 characters)',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
      description: 'Canonical production URL, e.g. https://example.com',
    }),
    defineField({
      name: 'locale',
      title: 'Site Locale',
      type: 'string',
      description: 'Primary language/region for metadata and social previews.',
      initialValue: 'en',
      options: {
        list: [
          {title: 'English', value: 'en'},
          {title: 'English (US)', value: 'en-US'},
          {title: 'English (UK)', value: 'en-GB'},
          {title: 'German', value: 'de'},
          {title: 'German (Germany)', value: 'de-DE'},
          {title: 'German (Switzerland)', value: 'de-CH'},
          {title: 'French', value: 'fr'},
          {title: 'Italian', value: 'it'},
        ],
      },
    }),
    defineField({
      name: 'businessType',
      title: 'Business Type',
      type: 'string',
      description: 'Schema.org type used for structured data.',
      initialValue: 'Organization',
      options: {
        list: [
          {title: 'Organization', value: 'Organization'},
          {title: 'Local Business', value: 'LocalBusiness'},
          {title: 'Health And Beauty Business', value: 'HealthAndBeautyBusiness'},
          {title: 'Lodging Business', value: 'LodgingBusiness'},
          {title: 'Sports Activity Location', value: 'SportsActivityLocation'},
        ],
      },
    }),

    defineField({
      name: 'favicon',
      title: 'Favicon Source Image',
      description:
        'Upload a square image (recommended 512x512 or larger). The site will generate all favicon sizes from this source.',
      type: 'image',
      options: {
        hotspot: false,
      },
    }),
    defineField({
      name: 'shareImage',
      title: 'Share Image',
      description: 'Image used for Open Graph and Twitter previews. Recommended: 1200x630.',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Brief description for social image metadata.',
        },
      ],
    }),
    defineField({
      name: 'address',
      type: 'object',
      options: {
        columns: 3,
      },
      fields: [
        {
          name: 'street',
          title: 'Street',
          type: 'string',
          options: {columns: 3}, // full width
        },
        {
          name: 'postcode',
          title: 'Post code',
          type: 'string',
        },
        {
          name: 'city',
          title: 'City',
          type: 'string',
        },
        {
          name: 'country',
          title: 'Country',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      type: 'string',
    }),
    defineField({
      name: 'socials',
      title: 'Social Profiles',
      type: 'array',
      of: [
        {
          type: 'object',
          options: {columns: 2},
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
            },
            {
              name: 'link',
              title: 'URL',
              type: 'url',
            },
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'link',
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site'}),
  },
})
