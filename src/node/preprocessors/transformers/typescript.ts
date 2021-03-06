import type { TransformConfig } from "../types";
import { loadLib } from "../utils/loadLib";
import { resolveFrom } from "../utils/resolvedFrom";

let ts: any;

export function getMissingDependencies({ root }: TransformConfig) {
  if (!resolveFrom(root, "typescript")) {
    return ["typescript"];
  }
}

export default async function ({ to, desc, root, content, filename, options = {} }: TransformConfig) {
  if (!ts) {
    const tsLib = await loadLib(["typescript"], {
      errorMessage: `$1 is required for <${to} ${desc}>`,
      root,
    });
    ts = tsLib.default;
  }

  const compilerOptions = {
    ...options,
    moduleResolution: "node",
    target: "es6",
    allowNonTsExtensions: true,
  };

  const { outputText: code, sourceMapText: map, diagnostics } = ts.transpileModule(content, {
    fileName: filename,
    compilerOptions: compilerOptions,
    // reportDiagnostics: true, //options.reportDiagnostics !== false,
    // transformers: TS_TRANSFORMERS,
  });

  // TODO:
  diagnostics;

  return {
    code,
    map,
  };
}
