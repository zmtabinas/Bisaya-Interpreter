import Parser from "./FRONTEND/parser.ts";
import Environment from "./RUNTIME/environment.ts";
import { evaluate } from "./RUNTIME/interpreter.ts";
import { MK_NULL, MK_NUMBER, MK_BOOL } from "./RUNTIME/values.ts";

repl();

function repl () {
    const parser = new Parser();
    const env = new Environment();
    env.declareVar("x", MK_NUMBER(100))
    env.declareVar("true", MK_BOOL(true));
    env.declareVar("false", MK_BOOL(false));
    env.declareVar("null", MK_NULL());
    console.log("\nRepl v0.1");

    while (true) {
        const input = prompt("> ");
        if (!input || input.includes("exit")) {
            Deno.exit(1);
        }

        const program = parser.produceAST(input);
        console.log(program);

        const result = evaluate(program, env);
        console.log(result);
    }
}