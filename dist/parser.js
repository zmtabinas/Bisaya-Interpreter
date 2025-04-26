"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const lexer_1 = require("./lexer");
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }
    peek() { return this.tokens[this.pos]; }
    advance() { return this.tokens[this.pos++]; }
    expect(type, text) {
        const tok = this.peek();
        if (tok.type !== type || (text && tok.text !== text))
            throw new Error(`Expected ${text || type}, got ${tok.text}`);
        return this.advance();
    }
    // Place all custom statements below here guys. Thanks!
    parse() {
        const stmts = [];
        this.expect(lexer_1.TokenType.Keyword, 'SUGOD');
        while (!(this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KATAPUSAN')) {
            const tok = this.peek();
            if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'MUGNA')
                stmts.push(this.parseDecl());
            else if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'IPAKITA')
                stmts.push(this.parsePrint());
            else if (tok.type === lexer_1.TokenType.Identifier)
                stmts.push(this.parseAssign());
            else
                this.advance();
        }
        return stmts;
    }
    parseDecl() {
        this.expect(lexer_1.TokenType.Keyword, 'MUGNA');
        const typeTok = this.expect(lexer_1.TokenType.Keyword);
        const type = typeTok.text;
        const decls = [];
        do {
            const name = this.expect(lexer_1.TokenType.Identifier).text;
            let init;
            if (this.peek().text === '=') {
                this.advance();
                init = this.parseExpr();
            }
            decls.push({ name, init });
            if (this.peek().text === ',')
                this.advance();
            else
                break;
        } while (true);
        return { kind: 'decl', type, decls };
    }
    parseAssign() {
        const targets = [];
        do {
            targets.push(this.expect(lexer_1.TokenType.Identifier).text);
            this.expect(lexer_1.TokenType.Operator, '=');
        } while (this.peek().type === lexer_1.TokenType.Identifier);
        const expr = this.parseExpr();
        return { kind: 'assign', targets, expr };
    }
    parsePrint() {
        this.expect(lexer_1.TokenType.Keyword, 'IPAKITA');
        this.expect(lexer_1.TokenType.Punctuation, ':');
        const parts = [];
        let first = true;
        while (true) {
            if (!first)
                this.expect(lexer_1.TokenType.Operator, '&');
            first = false;
            const tok = this.peek();
            if (tok.text === '$') {
                parts.push({ literal: '\n' });
                this.advance();
            }
            else if (tok.text === '[') {
                this.advance();
                const contentTok = this.advance();
                this.expect(lexer_1.TokenType.Punctuation, ']');
                parts.push({ literal: contentTok.text });
            }
            else if (tok.type === lexer_1.TokenType.Number || tok.type === lexer_1.TokenType.String) {
                const lit = this.parseExpr();
                parts.push({ expr: lit });
            }
            else if (tok.type === lexer_1.TokenType.Identifier) {
                const expr = this.parseExpr();
                parts.push({ expr });
            }
            else
                break;
            if (this.peek().type === lexer_1.TokenType.EndOfFile)
                break;
            if (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KATAPUSAN')
                break;
        }
        return { kind: 'print', parts };
    }
    parseExpr() { return this.parseLogicalOr(); }
    parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'O') {
            this.advance();
            const right = this.parseLogicalAnd();
            left = { kind: 'binary', left, operator: 'O', right };
        }
        return left;
    }
    parseLogicalAnd() {
        let left = this.parseComparison();
        while (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'UG') {
            this.advance();
            const right = this.parseComparison();
            left = { kind: 'binary', left, operator: 'UG', right };
        }
        return left;
    }
    parseComparison() {
        let left = this.parseAddSub();
        const ops = new Set(['<', '>', '<=', '>=', '<>']);
        while (this.peek().type === lexer_1.TokenType.Operator && ops.has(this.peek().text)) {
            const op = this.advance().text;
            const right = this.parseAddSub();
            left = { kind: 'binary', left, operator: op, right };
        }
        return left;
    }
    parseAddSub() {
        let left = this.parseMulDiv();
        while (this.peek().type === lexer_1.TokenType.Operator && /[+\-]/.test(this.peek().text)) {
            const op = this.advance().text;
            const right = this.parseMulDiv();
            left = { kind: 'binary', left, operator: op, right };
        }
        return left;
    }
    parseMulDiv() {
        let left = this.parseUnary();
        while (this.peek().type === lexer_1.TokenType.Operator && /[*/]/.test(this.peek().text)) {
            const op = this.advance().text;
            const right = this.parseUnary();
            left = { kind: 'binary', left, operator: op, right };
        }
        return left;
    }
    parseUnary() {
        if (this.peek().type === lexer_1.TokenType.Operator && this.peek().text === '-') {
            const op = this.advance().text;
            const expr = this.parseUnary();
            return { kind: 'unary', operator: op, expr };
        }
        return this.parsePrimary();
    }
    parsePrimary() {
        const tok = this.peek();
        if (tok.text === '(') {
            this.advance();
            const expr = this.parseExpr();
            this.expect(lexer_1.TokenType.Punctuation, ')');
            return expr;
        }
        if (tok.type === lexer_1.TokenType.Number) {
            this.advance();
            return { kind: 'literal', value: Number(tok.text) };
        }
        if (tok.type === lexer_1.TokenType.String) {
            this.advance();
            return { kind: 'literal', value: tok.text };
        }
        if (tok.type === lexer_1.TokenType.Identifier) {
            this.advance();
            return { kind: 'ident', name: tok.text };
        }
        throw new Error(`Unexpected expr token: ${tok.text}`);
    }
}
exports.Parser = Parser;
