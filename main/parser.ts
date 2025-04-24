import { Token, TokenType } from './lexer';
import { Value } from './types';

export type Expr = { kind: 'literal', value: Value } | { kind: 'ident', name: string } | { kind: 'binary', left: Expr, operator: string, right: Expr } | { kind: 'unary',  operator: string, expr: Expr };
export type Stmt =
  | { kind: 'decl', type: string, decls: Array<{ name: string, init?: Expr }> }
  | { kind: 'assign', targets: string[], expr: Expr }
  | { kind: 'print', parts: Array<{ literal?: string, expr?: Expr }> };

export class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}
  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }
  private expect(type: TokenType, text?: string) {
    const tok = this.peek();
    if (tok.type !== type || (text && tok.text !== text)) throw new Error(`Expected ${text||type}, got ${tok.text}`);
    return this.advance();
  }

  // Place all custom statements below here guys. Thanks!
  parse(): Stmt[] {
    const stmts: Stmt[] = [];

    this.expect(TokenType.Keyword, 'SUGOD'); 
    while (!(this.peek().type === TokenType.Keyword && this.peek().text === 'KATAPUSAN')) {
      const tok = this.peek();
      if (tok.type === TokenType.Keyword && tok.text === 'MUGNA') stmts.push(this.parseDecl());
      else if (tok.type === TokenType.Keyword && tok.text === 'IPAKITA') stmts.push(this.parsePrint());
      else if (tok.type === TokenType.Identifier) stmts.push(this.parseAssign());
      else this.advance();
    }
    return stmts;
  }

  private parseDecl(): Stmt {
    this.expect(TokenType.Keyword, 'MUGNA');
    const typeTok = this.expect(TokenType.Keyword);
    const type = typeTok.text;
    const decls: Array<{ name: string, init?: Expr }> = [];
    do {
      const name = this.expect(TokenType.Identifier).text;
      let init: Expr|undefined;
      if (this.peek().text === '=') {
        this.advance();
        init = this.parseExpr();
      }
      decls.push({ name, init });
      if (this.peek().text === ',') this.advance(); else break;
    } while (true);
    return { kind: 'decl', type, decls };
  }

  private parseAssign(): Stmt {
    const targets: string[] = [];
    do {
      targets.push(this.expect(TokenType.Identifier).text);
      this.expect(TokenType.Operator, '=');
    } while (this.peek().type === TokenType.Identifier);
    const expr = this.parseExpr();
    return { kind: 'assign', targets, expr };
  }

  private parsePrint(): Stmt {
    this.expect(TokenType.Keyword, 'IPAKITA');
    this.expect(TokenType.Punctuation, ':');
    const parts: Array<{ literal?: string, expr?: Expr }> = [];
    let first = true;
    while (true) {
      if (!first) this.expect(TokenType.Operator, '&');
      first = false;
      const tok = this.peek();
      if (tok.text === '$') { parts.push({ literal: '\n' }); this.advance(); }
      else if (tok.text === '[') {
        this.advance();
        const contentTok = this.advance();
        this.expect(TokenType.Punctuation, ']');
        parts.push({ literal: contentTok.text });
      } else if (tok.type === TokenType.Number || tok.type === TokenType.String) {
        const lit = this.parseExpr(); parts.push({ expr: lit });
      } else if (tok.type === TokenType.Identifier) {
        const expr = this.parseExpr(); parts.push({ expr });
      } else break;
      if (this.peek().type === TokenType.EndOfFile) break;
      if (this.peek().type === TokenType.Keyword && this.peek().text === 'KATAPUSAN') break;
    }
    return { kind: 'print', parts };
  }

  private parseExpr(): Expr { return this.parseLogicalOr(); }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.peek().type === TokenType.Keyword && this.peek().text === 'O') {
        this.advance();
        const right = this.parseLogicalAnd();
        left = { kind: 'binary', left, operator: 'O', right };
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.Keyword && this.peek().text === 'UG') {
        this.advance();
        const right = this.parseComparison();
        left = { kind: 'binary', left, operator: 'UG', right };
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAddSub();
    const ops = new Set(['<', '>', '<=', '>=', '<>']);
    while (this.peek().type === TokenType.Operator && ops.has(this.peek().text)) {
        const op = this.advance().text;
        const right = this.parseAddSub();
        left = { kind: 'binary', left, operator: op, right };
    }
    return left;
  }

  private parseAddSub(): Expr {
    let left = this.parseMulDiv();
    while (this.peek().type === TokenType.Operator && /[+\-]/.test(this.peek().text)) {
        const op = this.advance().text;
        const right = this.parseMulDiv();
        left = { kind: 'binary', left, operator: op, right };
    }
    return left;
  }

  private parseMulDiv(): Expr {
    let left = this.parseUnary();
    while (this.peek().type === TokenType.Operator && /[*/]/.test(this.peek().text)) {
        const op = this.advance().text;
        const right = this.parseUnary();
        left = { kind: 'binary', left, operator: op, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.peek().type === TokenType.Operator && this.peek().text === '-') {
        const op = this.advance().text;
        const expr = this.parseUnary();
        return { kind: 'unary', operator: op, expr };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const tok = this.peek();
    if (tok.text === '(') {
        this.advance();
        const expr = this.parseExpr();
        this.expect(TokenType.Punctuation, ')');
        return expr;
    }
    if (tok.type === TokenType.Number) {
        this.advance();
        return { kind: 'literal', value: Number(tok.text) };
    }
    if (tok.type === TokenType.String) {
        this.advance();
        return { kind: 'literal', value: tok.text };
    }
    if (tok.type === TokenType.Identifier) {
        this.advance();
        return { kind: 'ident', name: tok.text };
    }
    throw new Error(`Unexpected expr token: ${tok.text}`);
  }
}