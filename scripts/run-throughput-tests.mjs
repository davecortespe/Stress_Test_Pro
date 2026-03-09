import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const tempDir = path.join(repoRoot, ".tmp-tests");
const filesToTranspile = [
  path.join("tests", "scenarioCsv.test.ts"),
  path.join("tests", "throughputAnalysis.test.ts"),
  path.join("src", "lib", "scenarioCsv.ts"),
  path.join("src", "lib", "throughputAnalysis.ts"),
  path.join("src", "lib", "bottleneckForecast.ts"),
  path.join("src", "simulator", "scenarioState.ts"),
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

for (const relativeFilePath of filesToTranspile) {
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

await import(pathToFileURL(toOutputPath(path.join("tests", "scenarioCsv.test.ts"))).href);
await import(pathToFileURL(toOutputPath(path.join("tests", "throughputAnalysis.test.ts"))).href);
