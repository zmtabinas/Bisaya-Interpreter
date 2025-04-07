import { Program, VarDeclaration } from "../../FRONTEND/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal, MK_NULL } from "../values.ts";


export function eval_program (program: Program, env: Environment): RuntimeVal {
    let lastEvalauted: RuntimeVal = MK_NULL();

    for (const statement of program.body) {
        lastEvalauted = evaluate(statement, env);
    }

    return lastEvalauted;
}

export function eval_var_declaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
    
    return env.declareVar(declaration.identifier, value, declaration.constant);
  }
  