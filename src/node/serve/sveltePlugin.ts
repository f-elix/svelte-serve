import Koa from "koa";
import path from "path";
import { init, parse } from "es-module-lexer";
import { compile, preprocess } from "svelte/compiler";
import getStream from "get-stream";
import MagicString from "magic-string";
import { getMissingDependenciesPreprocessor, getTransformCodePreprocessor } from "../preprocessors";

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    if (!ctx.resolvedPath) return next();
    if (!ctx.resolvedPath.endsWith(".svelte")) return next();

    await next();

    if (ctx.status === 304) {
      // Not modified
      return;
    }

    await init;

    const svelteCode = await getStream(ctx.body);

    const { code: preprocessedCode, dependencies } = await preprocess(
      svelteCode,
      [getMissingDependenciesPreprocessor(root), getTransformCodePreprocessor(root)],
      {
        filename: path.basename(ctx.path),
      }
    );
    const { js } = compile(preprocessedCode, {});

    // TODO: watch these files too
    dependencies;
    // console.log("dependencies", dependencies);

    // set sourcemap
    // cache.set(req.url + '.map', js.map);
    let jsCode = js.code;
    // jsCode = jsCode + `\n\n//# sourceMappingURL=${req.url}.map`;
    let magicJsCode = new MagicString(jsCode);
    const [imports] = parse(jsCode);
    for (const { s, e, d } of imports) {
      if (d > -1) {
        // TODO: dynamic import
      }
      const importee = jsCode.substring(s, e);
      if (!importee.startsWith("./") && !importee.startsWith("../")) {
        magicJsCode.overwrite(s, e, "/@modules/" + importee);
      }
    }
    jsCode = magicJsCode.toString();

    ctx.body = jsCode;
    ctx.set("Content-Type", "text/javascript");
  });
}