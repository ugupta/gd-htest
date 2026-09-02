import { parse } from '@babel/parser';
import type { ParseResult } from '@babel/parser';
import type { NodePath, TraverseOptions } from '@babel/traverse';
import traverseDefault from '@babel/traverse';
import type {
  CallExpression,
  File,
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
} from '@babel/types';

import { collectContentImportAliases, elementName, literalAttribute } from './primitive-compliance.js';

// Babel's traverse default export is a CJS interop shape its own types don't describe.
// Same shim in ./primitive-compliance.ts.
type TraverseFn = (ast: File, opts: TraverseOptions) => void;
const traverseModule: TraverseFn | { default: TraverseFn } = traverseDefault as unknown as
  | TraverseFn
  | { default: TraverseFn };
const traverse: TraverseFn = typeof traverseModule === 'function' ? traverseModule : traverseModule.default;

const TEXT_IMPORT_NAME: string = 'Text';
const COLLECTION_IMPORT_NAME: string = 'Collection';
const RESOLVE_FN_NAME: string = 'resolveContentValue';
const KEY_ATTRIBUTE: string = 'k';
/** Guard against a pathological JSX nest; real pages are 2-3 collections deep at most. */
const MAX_COLLECTION_DEPTH: number = 8;
const MAX_SKIPPED_TEXT: number = 80;

/** What read a key, which decides the shape its value must have. */
export type KeyUse = 'text' | 'collection' | 'resolve';

/** A content key written out in full, e.g. `<Text k="pages.home.hero.title" />`. */
export interface AuthoredKey {
  readonly key: string;
  readonly line: number;
  readonly use: KeyUse;
}

/**
 * A field read relative to an enclosing `<Collection>` via `item.k('field')`.
 *
 * The absolute key cannot be formed statically — it needs the item's runtime id — so the collection
 * root and the nested-collection fields traversed to reach it are reported separately. A resolver
 * walks `root` → each item → each `chain` step → and asks whether `field` is present.
 */
export interface AuthoredField {
  /** Literal key of the outermost enclosing `<Collection>`. */
  readonly root: string;
  /** Fields of nested collections between `root` and this read, outermost first. */
  readonly chain: readonly string[];
  readonly field: string;
  readonly line: number;
  readonly use: KeyUse;
}

/** A binding whose key cannot be determined without running the page. */
export interface SkippedKey {
  readonly line: number;
  /** Source text of the expression, so a report can name what it could not check. */
  readonly text: string;
}

export interface AuthoredKeyReport {
  readonly keys: readonly AuthoredKey[];
  readonly fields: readonly AuthoredField[];
  readonly skipped: readonly SkippedKey[];
  /**
   * Set when the source could not be parsed. Callers MUST NOT read the empty collections above as
   * "this file authors no keys" — that is the same false pass the compliance report guards against.
   */
  readonly parseError?: string;
}

function keyAttribute(node: JSXElement): JSXAttribute | undefined {
  for (const attr of node.openingElement.attributes) {
    if (attr.type !== 'JSXAttribute') continue;
    if (attr.name.type === 'JSXIdentifier' && attr.name.name === KEY_ATTRIBUTE) return attr;
  }
  return undefined;
}

/** `item` and `'field'` for a call shaped `item.k('field')`, else undefined. */
function itemKeyCall(node: CallExpression): { readonly binding: string; readonly field: string } | undefined {
  const callee: CallExpression['callee'] = node.callee;
  if (callee.type !== 'MemberExpression') return undefined;
  if (callee.property.type !== 'Identifier' || callee.property.name !== KEY_ATTRIBUTE) return undefined;
  if (callee.object.type !== 'Identifier') return undefined;
  const [arg] = node.arguments;
  if (arg === undefined || arg.type !== 'StringLiteral') return undefined;
  return { binding: callee.object.name, field: arg.value };
}

/**
 * Whether `collection`'s render callback binds its item to `binding`, e.g. `item` in
 * `{(item, index) => …}`. Checks every child expression rather than assuming the first one is the
 * callback, since a `<Collection>` may carry other JSX children around it.
 */
function bindsItemAs(collection: JSXElement, binding: string): boolean {
  for (const child of collection.children) {
    if (child.type !== 'JSXExpressionContainer') continue;
    const expr: (typeof child)['expression'] = child.expression;
    if (expr.type !== 'ArrowFunctionExpression' && expr.type !== 'FunctionExpression') continue;
    const [first] = expr.params;
    if (first !== undefined && first.type === 'Identifier' && first.name === binding) return true;
  }
  return false;
}

/** Where an `item.k()` read sits: the literal collection root, and the nested fields above it. */
interface CollectionScope {
  readonly root: string;
  readonly chain: readonly string[];
}

/**
 * Walk up from `path` to find the `<Collection>` whose render callback binds `binding`, then express
 * that collection's position as a literal root plus the chain of nested-collection fields reaching
 * it. A collection rooted at `{parentItem.k('classes')}` resolves recursively against its own
 * parent, which is how the two-anchor keys the agent writes unprompted
 * (`…days[@day-mon].classes[@cls-1].name`) stay checkable.
 *
 * Returns undefined when the chain does not bottom out in a literal — the caller reports that as
 * skipped rather than guessing.
 */
function scopeFor(
  path: NodePath,
  binding: string,
  collectionNames: ReadonlySet<string>,
  depth: number = 0,
): CollectionScope | undefined {
  if (depth >= MAX_COLLECTION_DEPTH) return undefined;

  let child: NodePath = path;
  for (let current: NodePath | null = path.parentPath; current !== null; child = current, current = current.parentPath) {
    if (current.node.type !== 'JSXElement') continue;
    // `k={item.k(…)}` sits in the opening element, lexically outside this collection's render
    // callback — matching it here would resolve a nested collection's root against itself.
    if (child.node.type === 'JSXOpeningElement') continue;
    const element: JSXElement = current.node as JSXElement;
    const name: string | undefined = elementName(element);
    if (name === undefined || !collectionNames.has(name)) continue;
    if (!bindsItemAs(element, binding)) continue;

    const attr: JSXAttribute | undefined = keyAttribute(element);
    if (attr === undefined) return undefined;

    const literal: string | undefined = literalAttribute(attr);
    if (literal !== undefined) return { root: literal, chain: [] };

    // Nested: this collection is rooted at a field of its own parent's item.
    const value: JSXAttribute['value'] = attr.value;
    if (value === null || value === undefined || value.type !== 'JSXExpressionContainer') return undefined;
    const expr: JSXExpressionContainer['expression'] = value.expression;
    if (expr.type !== 'CallExpression') return undefined;
    const nested: { binding: string; field: string } | undefined = itemKeyCall(expr);
    if (nested === undefined) return undefined;

    const parent: CollectionScope | undefined = scopeFor(current, nested.binding, collectionNames, depth + 1);
    if (parent === undefined) return undefined;
    return { root: parent.root, chain: [...parent.chain, nested.field] };
  }
  return undefined;
}

/**
 * What consumes the key this call produces, read from the `k` prop it is passed to. A key handed to
 * something else (a helper, a variable) is `'resolve'`: still a key, but with no shape requirement
 * this checker can assert.
 */
function keyUseForCall(
  path: NodePath,
  textNames: ReadonlySet<string>,
  collectionNames: ReadonlySet<string>,
): KeyUse {
  for (let current: NodePath | null = path.parentPath; current !== null; current = current.parentPath) {
    if (current.node.type === 'JSXElement') return 'resolve';
    if (current.node.type !== 'JSXAttribute') continue;
    const attr: JSXAttribute = current.node as JSXAttribute;
    if (attr.name.type !== 'JSXIdentifier' || attr.name.name !== KEY_ATTRIBUTE) return 'resolve';
    const owner: NodePath | null = current.parentPath;
    if (owner === null || owner.node.type !== 'JSXOpeningElement') return 'resolve';
    const name: JSXElement['openingElement']['name'] = (owner.node as JSXElement['openingElement']).name;
    if (name.type !== 'JSXIdentifier') return 'resolve';
    if (textNames.has(name.name)) return 'text';
    if (collectionNames.has(name.name)) return 'collection';
    return 'resolve';
  }
  return 'resolve';
}

function sourceText(source: string, node: { start?: number | null; end?: number | null }): string {
  const start: number | null | undefined = node.start;
  const end: number | null | undefined = node.end;
  if (start === null || start === undefined || end === null || end === undefined) return '<expression>';
  return source.slice(start, end).replace(/\s+/g, ' ').slice(0, MAX_SKIPPED_TEXT);
}

/**
 * Collect every content key a page or component authors: literal `<Text k>` / `<Collection k>` /
 * `resolveContentValue()` keys, and the collection-relative fields read through `item.k()`.
 *
 * Anything whose key is computed is reported in `skipped`, never dropped. The count is what makes
 * the coverage honest — a check that silently ignores what it cannot see reads as a clean bill of
 * health on a page it never examined.
 */
export function collectAuthoredKeys(source: string): AuthoredKeyReport {
  let ast: ParseResult<File>;
  try {
    ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (err: unknown) {
    return { keys: [], fields: [], skipped: [], parseError: String(err) };
  }

  const textNames: ReadonlySet<string> = collectContentImportAliases(ast, TEXT_IMPORT_NAME);
  const collectionNames: ReadonlySet<string> = collectContentImportAliases(ast, COLLECTION_IMPORT_NAME);
  const resolverNames: ReadonlySet<string> = collectContentImportAliases(ast, RESOLVE_FN_NAME);
  const keys: AuthoredKey[] = [];
  const fields: AuthoredField[] = [];
  const skipped: SkippedKey[] = [];

  traverse(ast, {
    JSXElement(p: NodePath<JSXElement>): void {
      const name: string | undefined = elementName(p.node);
      if (name === undefined) return;
      const isText: boolean = textNames.has(name);
      const isCollection: boolean = collectionNames.has(name);
      if (!isText && !isCollection) return;

      const line: number = p.node.loc?.start.line ?? 0;
      const use: KeyUse = isText ? 'text' : 'collection';
      const attr: JSXAttribute | undefined = keyAttribute(p.node);
      if (attr === undefined) {
        skipped.push({ line, text: `<${name}> without a k prop` });
        return;
      }

      const literal: string | undefined = literalAttribute(attr);
      if (literal !== undefined) {
        keys.push({ key: literal, line, use });
        return;
      }

      // A `k={item.k('field')}` prop is collected by the CallExpression visitor below, which knows
      // how to resolve the enclosing collection. Anything else is not statically knowable.
      if (attr.value?.type === 'JSXExpressionContainer' && attr.value.expression.type === 'CallExpression') {
        if (itemKeyCall(attr.value.expression) !== undefined) return;
      }
      skipped.push({ line, text: sourceText(source, attr) });
    },

    CallExpression(p: NodePath<CallExpression>): void {
      const line: number = p.node.loc?.start.line ?? 0;

      if (p.node.callee.type === 'Identifier' && resolverNames.has(p.node.callee.name)) {
        const [arg] = p.node.arguments;
        if (arg !== undefined && arg.type === 'StringLiteral') keys.push({ key: arg.value, line, use: 'resolve' });
        else skipped.push({ line, text: sourceText(source, p.node) });
        return;
      }

      const call: { binding: string; field: string } | undefined = itemKeyCall(p.node);
      if (call === undefined) return;
      const scope: CollectionScope | undefined = scopeFor(p, call.binding, collectionNames);
      if (scope === undefined) {
        skipped.push({ line, text: sourceText(source, p.node) });
        return;
      }
      fields.push({
        root: scope.root,
        chain: scope.chain,
        field: call.field,
        line,
        use: keyUseForCall(p, textNames, collectionNames),
      });
    },
  });

  return { keys, fields, skipped };
}
