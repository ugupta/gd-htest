export {};

throw new Error(
  "[airo-content] 'virtual:content-runtime' has no test fixture in this app. " +
    'A unit test must not read real app content — mock the module instead: ' +
    "vi.mock('virtual:content-runtime', () => ({ default: { pages: { home: { hero: { title: 'x' } } } }, collectionRoots: [] }))",
);
