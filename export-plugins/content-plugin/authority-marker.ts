import { statSync } from 'node:fs';
import path from 'node:path';

/**
 * Enrollment: this app is bound to the content layer. Written once and never cleared — see
 * docs/plans/2026-08-25-content-authority-v8-rollout-design.md. Its presence does not by itself
 * arm any gate.
 */
export const ENROLLMENT_MARKER_PATH: string = 'src/content/.content-authority';

/**
 * Enforcement: the gates refuse unbound copy in this app. Freely reversible, and the only lever
 * that can break a build, which is why it is a separate file from enrollment — an interrupted
 * un-enforce can never corrupt the permanent record.
 */
export const ENFORCEMENT_MARKER_PATH: string = 'src/content/.content-authority-enforce';

/**
 * `stat` failures that mean "there is no usable marker here" rather than "something is wrong".
 * Enumerated rather than caught wholesale: this runs inside the build gate, so swallowing an
 * unexpected error would silently stop policing an enrolled app, while throwing on a merely absent
 * or unreadable marker would break the build of an app that never opted in.
 *
 * Every entry but `EPERM` is pinned by a test that fails if it is removed. `EPERM` is the platform
 * variant some filesystems return where others return `EACCES`, so it is carried deliberately
 * without a fixture rather than left to a platform we do not test on.
 */
const NO_USABLE_MARKER: ReadonlySet<string> = new Set([
  'ENOENT',
  'ENOTDIR',
  'EACCES',
  'EPERM',
  'ELOOP',
  'ENAMETOOLONG',
]);

/**
 * Whether `projectRoot` arms the content-authority gates.
 *
 * Existence of a regular *file* is the whole signal, so there is nothing to parse. A directory is
 * deliberately not a marker: `existsSync` would accept one, which would arm a gate on a stray
 * `mkdir`. See {@link NO_USABLE_MARKER} for which failures count as absence; any other error is
 * rethrown, so a genuinely broken filesystem is loud rather than quietly un-enforcing.
 */
export function enforcementEnabled(projectRoot: string): boolean {
  if (projectRoot.length === 0) return false;
  try {
    return statSync(path.join(projectRoot, ENFORCEMENT_MARKER_PATH)).isFile();
  } catch (error: unknown) {
    const code: string = error instanceof Error && 'code' in error ? String(error.code) : '';
    if (NO_USABLE_MARKER.has(code)) return false;
    throw error;
  }
}
