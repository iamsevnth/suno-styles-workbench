// Resolves the build folder named on the command line. Only folders inside the project or the
// system temp folder (used by the tests) are accepted, so a mistyped argument cannot make the
// build scripts read or write anywhere else on the machine.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function resolveBuildDir(arg = 'dist') {
  const dir = fs.realpathSync(path.resolve(arg));
  const roots = [process.cwd(), os.tmpdir()].map((root) => fs.realpathSync(root));
  const root = roots.find((r) => dir === r || dir.startsWith(r + path.sep));
  if (!root) throw new Error(`Build folder must be inside the project or the temp folder: ${arg}`);
  return { dir, root };
}

/** Joins a file name onto the build folder, refusing anything that would land outside it. */
export function fileInBuildDir(dir, name) {
  const file = path.resolve(dir, name);
  if (!file.startsWith(dir + path.sep)) throw new Error(`Path is outside the build folder: ${name}`);
  return file;
}
