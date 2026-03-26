import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const tempDir = path.join(repoRoot, ".tmp-scripts");

const filesToTranspile = [
  path.join("src", "lib", "bottleneckForecast.ts"),
  path.join("src", "lib", "exportScenarioBundle.ts"),
  path.join("src", "types", "contracts.ts")
];

function toOutputPath(relativeFilePath) {
  return path.join(tempDir, relativeFilePath).replace(/\.(ts|tsx)$/, ".js");
}

function rewriteRelativeImports(code) {
  return code.replace(
    /(from\s+["'])(\.[^"']+)(["'])/g,
    (match, prefix, specifier, suffix) => {
      if (specifier.endsWith(".json") || specifier.endsWith(".js")) {
        return `${prefix}${specifier}${suffix}`;
      }
      if (specifier.endsWith(".ts") || specifier.endsWith(".tsx")) {
        return `${prefix}${specifier.replace(/\.(ts|tsx)$/, ".js")}${suffix}`;
      }
      return `${prefix}${specifier}.js${suffix}`;
    }
  );
}

function transpile(relativeFilePath) {
  const inputPath = path.join(repoRoot, relativeFilePath);
  const outputPath = toOutputPath(relativeFilePath);
  const source = fs.readFileSync(inputPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX
    },
    fileName: inputPath
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rewriteRelativeImports(transpiled.outputText), "utf8");
}

let modulePromise = null;

export async function loadForecastModules() {
  if (!modulePromise) {
    modulePromise = (async () => {
      for (const relativeFilePath of filesToTranspile) {
        transpile(relativeFilePath);
      }

      const bottleneckForecast = await import(
        pathToFileURL(toOutputPath(path.join("src", "lib", "bottleneckForecast.ts"))).href
      );
      const exportScenarioBundle = await import(
        pathToFileURL(toOutputPath(path.join("src", "lib", "exportScenarioBundle.ts"))).href
      );

      return {
        ...bottleneckForecast,
        ...exportScenarioBundle
      };
    })();
  }

  return modulePromise;
}
