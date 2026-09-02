const sparseServices: unknown[] = [];
sparseServices[1] = { id: 'svc_e5f6', name: 'Second Only' };

const content: Record<string, unknown> = {
  home: {
    hero: { title: 'We Buy Houses', subtitle: 'Fast, fair cash offers' },
    stats: [{ id: 'st_1', value: '124,000+' }],
    tags: ['alpha', 'beta'],
  },
  data: {
    services: [
      { id: 'svc_a1b2', name: 'Cash Offer', blurb: 'No repairs needed' },
      { id: 'svc_c3d4', name: 'Closing Support', blurb: 'Pick your date' },
    ],
    sparseServices,
    noIds: [{ name: 'First' }, { name: 'Second' }],
    oddIds: [
      { id: 'has.dot', name: 'Unexpressible' },
      { id: 'fine_1', name: 'Expressible' },
    ],
    nested: [
      { id: 'n1', label: 'Outer One', items: [{ id: 'n1a', label: 'Inner A' }] },
      { id: 'n2', label: 'Outer Two', items: [] },
    ],
    notAnArray: { nope: true },
    posts: [
      { id: 'post_1', slug: 'first-post', title: 'First Post', tags: ['alpha', 'beta'] },
      { id: 'post_2', slug: 'second-post', title: 'Second Post', tags: ['gamma'] },
    ],
    duplicateSlugItems: [
      { slug: 'dup', name: 'Alpha' },
      { slug: 'dup', name: 'Beta' },
    ],
    blogPosts: [
      { slug: 'first-post', title: 'First Post' },
      { slug: 'second-post', title: 'Second Post' },
      { slug: 'has.dot', title: 'Unexpressible Slug' },
    ],
    duplicateIdItems: [
      { id: 'dup', title: 'A' },
      { id: 'dup', title: 'B' },
    ],
    idOverSlugItems: [
      { id: 'winner', title: 'By Id' },
      { slug: 'winner', title: 'By Slug' },
    ],
  },
};

export const collectionRoots: string[] = ['data.posts', 'posts'];

export default content;
