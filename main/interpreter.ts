import * as readlineSync from 'readline-sync';
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
        case 'decl':   this.execDecl(st);   break;
        case 'assign': this.execAssign(st); break;
        case 'input':  this.execInput(st);  break;
        case 'if':     this.execIf(st);     break;
        case 'for':    this.execFor(st);    break;
        case 'print':  this.execPrint(st);  break;
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

  private execInput(st: Extract<Stmt, { kind: 'input' }>) {
    for (const name of st.vars) {
      const variable = this.vars.get(name);
      if (!variable) throw new Error(`Undeclared var ${name}`);
  
      const raw = readlineSync.question(
        `UNSAY VALUE NI ${name.toUpperCase()} BAI?: `
      );
  
      switch (variable.type) {
        case 'NUMERO':
          variable.value = Number(raw);
          break;
        case 'TIPIK':
          variable.value = parseFloat(raw);
          break;
        case 'LETRA':
          variable.value = raw.charAt(0);
          break;
        case 'TINUOD':
          variable.value = /^OO$/i.test(raw) ? true : false;
          break;
      }
    }
  }
  
  private execIf(st: Extract<Stmt, { kind: 'if' }>) {
    const B = st.branches;
    if (B[0] && Boolean(this.evalExpr(B[0].cond!))) {
      return this.execStmts(B[0].body);
    }
    for (let i = 1; i < B.length - 1; i++) {
      if (Boolean(this.evalExpr(B[i].cond!))) {
        return this.execStmts(B[i].body);
      }
    }
    const last = B.find(b => b.cond === undefined);
    if (last) {
      return this.execStmts(last.body);
    }
  }

  private execFor(st: Extract<Stmt, { kind: 'for' }>) {
    this.execStmts([ st.init ]);
  
    while (this.evalExpr(st.cond) as boolean) {
      this.execStmts(st.body);
      this.execStmts([ st.update ]);
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
      const v = this.evalExpr(e.expr);
      if (e.operator === '-') return -(v as number);
      if (e.operator === '!') return !(v as boolean);
      throw new Error(`Unsupported unary ${e.operator}`);
  }

    if (e.kind === 'binary') {
        const L = this.evalExpr(e.left);
        const R = this.evalExpr(e.right);
        switch (e.operator) {
            case '+': return (L as number) + (R as number);
            case '-': return (L as number) - (R as number);
            case '*': return (L as number) * (R as number);
            case '/': return (L as number) / (R as number);
            case '<':  return (L as number) <  (R as number);
            case '>':  return (L as number) >  (R as number);
            case '<=': return (L as number) <= (R as number);
            case '>=': return (L as number) >= (R as number);
            case '<>': return (L as number) !== (R as number);
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