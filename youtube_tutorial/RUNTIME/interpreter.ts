import { NumberVal, RuntimeVal } from "./values.ts"
import { AssignmentExpr, BinaryExpr, Identifier, NumericLiteral, Program, Stmt, VarDeclaration } from "../FRONTEND/ast.ts"
import Environment from "./environment.ts";
import { eval_assignment, eval_identifier, evaluate_binary_expr } from "./EVAL/expressions.ts";
import { eval_program, eval_var_declaration } from "./EVAL/statements.ts";


export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
    switch (astNode.kind) {
      case "NumericLiteral":
        return {
          value: ((astNode as NumericLiteral).value),
          type: "number",
        } as NumberVal;
      case "Identifier":
        return eval_identifier(astNode as Identifier, env);
      case "AssignmentExpr":
        return eval_assignment(astNode as AssignmentExpr, env);
      case "BinaryExpr":
        return evaluate_binary_expr(astNode as BinaryExpr, env);
      case "Program":
        return eval_program(astNode as Program, env);
      case "VarDeclaration":
        return eval_var_declaration(astNode as VarDeclaration, env);
      default:
        console.error(
          "This AST Node has not yet been setup for interpretation.",
          astNode,
        );
        Deno.exit(0);
    }
  }

