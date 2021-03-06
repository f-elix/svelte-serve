import { renderSync } from "sass";
import type { TransformConfig } from "../types";
import path from "path";
import { loadLib } from "../utils/loadLib";
import { resolveFrom } from "../utils/resolvedFrom";

let sass: { renderSync: typeof renderSync };

export function getMissingDependencies({ root }: TransformConfig) {
  if (!(resolveFrom(root, "sass") || resolveFrom(root, "node-sass"))) {
    return ["sass", "node-sass"];
  }
}

export default async function ({ to, desc, root, content, filename, options = {} }: TransformConfig) {
  if (!sass) {
    const sassLib = await loadLib(["sass", "node-sass"], {
      errorMessage: `$1 are required for <${to} ${desc}>`,
      root,
    });
    sass = sassLib.default;
  }

  const result = sass.renderSync({
    sourceMap: true,
    ...options,
    data: content,
    includePaths: [...(options.includePaths || []), "node_modules", path.dirname(filename)],
    outFile: `${filename}.css`,
  });
  return {
    code: result.css.toString(),
    map: result.map?.toString(),
    dependencies: result.stats.includedFiles,
  };
}
