// to add other files pa

import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parser, Stmt, Expr } from './parser';
import { Variable, Value } from './types';

export class Interpreter {
  private vars = new Map<string, Variable>();

  runFile(filePath: string) {
    const src = fs.readFileSync(filePath, 'utf-8');
    const lexer = new Lexer(src);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const stmts = parser.parse();
    this.execStmts(stmts);
  }

  private execStmts(stmts: Stmt[]) {
    for (const st of stmts) {
      switch (st.kind) {
        case 'decl': this.execDecl(st); break;
        case 'assign': this.execAssign(st); break;
        case 'print': this.execPrint(st); break;
      }
    }
  }

  private execDecl(st: Extract<Stmt, { kind: 'decl' }>) {
    for (const d of st.decls) {
      const initVal = d.init ? this.evalExpr(d.init) : this.defaultForType(st.type);
      this.vars.set(d.name, { type: st.type as any, value: initVal });
    }
  }

  private execAssign(st: Extract<Stmt, { kind: 'assign' }>) {
    const val = this.evalExpr(st.expr);
    for (const name of st.targets) {
      const v = this.vars.get(name);
      if (!v) throw new Error(`Undeclared variable ${name}`);
      v.value = val;
    }
  }

  private execPrint(st: Extract<Stmt, { kind: 'print' }>) {
    let out = '';
    for (const p of st.parts) {
      if (p.literal !== undefined) {
          out += p.literal;
      } else if (p.expr) {
          const v = this.evalExpr(p.expr);
          if (typeof v === 'boolean') out += v ? 'OO' : 'DILI';
          else out += String(v);
      }
  }
    process.stdout.write(out);
  }

  private evalExpr(e: Expr): Value {
    if (e.kind === 'literal') return e.value;
    if (e.kind === 'ident') {
      const v = this.vars.get(e.name);
      if (!v) throw new Error(`Undeclared var ${e.name}`);
      return v.value;
    }

    if (e.kind === 'unary') {
      const v = this.evalExpr(e.expr) as number;
      return -v;
  }
  if (e.kind === 'binary') {
      const L = this.evalExpr(e.left);
      const R = this.evalExpr(e.right);
      switch (e.operator) {
          // arithmetic
          case '+': return (L as number) + (R as number);
          case '-': return (L as number) - (R as number);
          case '*': return (L as number) * (R as number);
          case '/': return (L as number) / (R as number);
  
          // comparison
          case '<':  return (L as number) <  (R as number);
          case '>':  return (L as number) >  (R as number);
          case '<=': return (L as number) <= (R as number);
          case '>=': return (L as number) >= (R as number);
          case '<>': return (L as number) !== (R as number);
  
          // logical (short-circuiting not needed for now)
          case 'UG': return (L as boolean) && (R as boolean);
          case 'O':  return (L as boolean) || (R as boolean);
      }
  }
    throw new Error(`Unknown expr kind ${(e as any).kind}`);
  }

  private defaultForType(t: string): Value {
    switch (t) {
      case 'NUMERO': case 'TIPIK': return 0;
      case 'LETRA': return '';
      case 'TINUOD': return false;
    }
    return 0;
  }
}
