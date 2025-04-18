import Parser from "./FRONTEND/parser.ts";
import Environment from "./RUNTIME/environment.ts";
import { evaluate } from "./RUNTIME/interpreter.ts";
import { MK_NULL, MK_BOOL } from "./RUNTIME/values.ts";

repl();

function repl() {
  const parser = new Parser();
  const env = new Environment();

  env.declareVar("true", MK_BOOL(true), true);
  env.declareVar("false", MK_BOOL(false), true);
  env.declareVar("null", MK_NULL(), true);

  console.log("\nRepl v0.1");

  while (true) {
    const input = prompt("> ");
    if (!input || input.includes("exit")) {
      Deno.exit(1);
    }

    const program = parser.produceAST(input);
    const result = evaluate(program, env);
    console.log(result);
  }
}