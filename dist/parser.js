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
    parse() {
        const stmts = [];
        this.expect(lexer_1.TokenType.Keyword, 'SUGOD');
        while (!(this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KATAPUSAN')) {
            const tok = this.peek();
            if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'MUGNA')
                stmts.push(this.parseDecl());
            else if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'DAWAT')
                stmts.push(this.parseInput());
            else if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'KUNG')
                stmts.push(this.parseIf());
            else if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'ALANG')
                stmts.push(this.parseFor());
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
    parseInput() {
        this.expect(lexer_1.TokenType.Keyword, 'DAWAT');
        this.expect(lexer_1.TokenType.Punctuation, ':');
        const vars = [];
        vars.push(this.expect(lexer_1.TokenType.Identifier).text);
        while (this.peek().type === lexer_1.TokenType.Punctuation
            && this.peek().text === ',') {
            this.advance();
            vars.push(this.expect(lexer_1.TokenType.Identifier).text);
        }
        return { kind: 'input', vars };
    }
    parseIf() {
        const branches = [];
        this.expect(lexer_1.TokenType.Keyword, 'KUNG');
        this.expect(lexer_1.TokenType.Punctuation, '(');
        const ifCond = this.parseExpr();
        this.expect(lexer_1.TokenType.Punctuation, ')');
        const ifBody = this.parseBlock();
        branches.push({ cond: ifCond, body: ifBody });
        while (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KUNG' &&
            ((this.tokens[this.pos + 1].text === 'DILI') || (this.tokens[this.pos + 1].text === '('))) {
            this.advance();
            if (this.peek().text === 'DILI') {
                this.advance();
                this.expect(lexer_1.TokenType.Punctuation, '(');
                const raw = this.parseExpr();
                this.expect(lexer_1.TokenType.Punctuation, ')');
                let condExpr;
                if (raw.kind === 'binary' && ['<', '>', '<=', '>=', '<>'].includes(raw.operator)) {
                    const invertOp = {
                        '<': '>',
                        '>': '<',
                        '<=': '>=',
                        '>=': '<=',
                        '<>': '==='
                    };
                    condExpr = {
                        kind: 'binary',
                        left: raw.left,
                        operator: invertOp[raw.operator],
                        right: raw.right
                    };
                }
                else {
                    condExpr = { kind: 'unary', operator: '!', expr: raw };
                }
                const elifBody = this.parseBlock();
                branches.push({ cond: condExpr, body: elifBody });
            }
            else if (this.peek().text === '(') {
                this.expect(lexer_1.TokenType.Punctuation, '(');
                const elifCond = this.parseExpr();
                this.expect(lexer_1.TokenType.Punctuation, ')');
                const elifBody = this.parseBlock();
                branches.push({ cond: elifCond, body: elifBody });
            }
            else {
                break;
            }
        }
        if (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KUNG') {
            this.advance();
            this.expect(lexer_1.TokenType.Keyword, 'WALA');
            const elseBody = this.parseBlock();
            branches.push({ cond: undefined, body: elseBody });
        }
        return { kind: 'if', branches };
    }
    parseBlock() {
        this.expect(lexer_1.TokenType.Keyword, 'PUNDOK');
        this.expect(lexer_1.TokenType.Punctuation, '{');
        const stmts = [];
        while (!(this.peek().type === lexer_1.TokenType.Punctuation && this.peek().text === '}')) {
            const tok = this.peek();
            if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'DAWAT')
                stmts.push(this.parseInput());
            else if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'KUNG')
                stmts.push(this.parseIf());
            else if (tok.type === lexer_1.TokenType.Keyword && tok.text === 'IPAKITA')
                stmts.push(this.parsePrint());
            else if (tok.type === lexer_1.TokenType.Identifier)
                stmts.push(this.parseAssign());
            else
                this.advance();
        }
        this.expect(lexer_1.TokenType.Punctuation, '}');
        return stmts;
    }
    parseFor() {
        this.expect(lexer_1.TokenType.Keyword, 'ALANG');
        this.expect(lexer_1.TokenType.Keyword, 'SA');
        this.expect(lexer_1.TokenType.Punctuation, '(');
        const initStmt = this.parseAssign();
        this.expect(lexer_1.TokenType.Punctuation, ',');
        const condExpr = this.parseExpr();
        this.expect(lexer_1.TokenType.Punctuation, ',');
        let updateStmt;
        const next = this.peek();
        if (next.type === lexer_1.TokenType.Identifier && this.tokens[this.pos + 1].text.match(/\+\+|--/)) {
            const name = this.expect(lexer_1.TokenType.Identifier).text;
            const opTok = this.expect(lexer_1.TokenType.Operator);
            const op = opTok.text;
            const one = { kind: 'literal', value: 1 };
            const expr = { kind: 'binary', left: { kind: 'ident', name }, operator: op === '++' ? '+' : '-', right: one };
            updateStmt = { kind: 'assign', targets: [name], expr };
        }
        else {
            updateStmt = this.parseAssign();
        }
        this.expect(lexer_1.TokenType.Punctuation, ')');
        const body = this.parseBlock();
        return { kind: 'for', init: initStmt, cond: condExpr, update: updateStmt, body };
    }
    parseAssign() {
        const targets = [];
        targets.push(this.expect(lexer_1.TokenType.Identifier).text);
        this.expect(lexer_1.TokenType.Operator, '=');
        while (this.peek().type === lexer_1.TokenType.Identifier
            && this.tokens[this.pos + 1].text === '=') {
            targets.push(this.advance().text);
            this.expect(lexer_1.TokenType.Operator, '=');
        }
        const expr = this.parseExpr();
        return { kind: 'assign', targets, expr };
    }
    parsePrint() {
        this.expect(lexer_1.TokenType.Keyword, 'IPAKITA');
        this.expect(lexer_1.TokenType.Punctuation, ':');
        const parts = [];
        let first = true;
        while (true) {
            if (!first) {
                const next = this.peek();
                if (next.type === lexer_1.TokenType.Operator && next.text === '&') {
                    this.advance();
                }
                else {
                    break;
                }
            }
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
            else if (tok.text === '(') {
                const expr = this.parseExpr();
                parts.push({ expr });
            }
            else if (tok.type === lexer_1.TokenType.Number || tok.type === lexer_1.TokenType.String || tok.type === lexer_1.TokenType.Identifier) {
                parts.push({ expr: this.parseExpr() });
            }
            else {
                break;
            }
            const peek = this.peek();
            if (peek.type === lexer_1.TokenType.EndOfFile)
                break;
            if (peek.type === lexer_1.TokenType.Keyword && peek.text === 'KATAPUSAN')
                break;
            if (peek.type === lexer_1.TokenType.Punctuation && peek.text === '}')
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
        if (this.peek().type === lexer_1.TokenType.Operator && /[-!]/.test(this.peek().text)) {
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
            const s = tok.text;
            const up = s.toUpperCase();
            this.advance();
            if (up === 'OO')
                return { kind: 'literal', value: true };
            if (up === 'DILI')
                return { kind: 'literal', value: false };
            return { kind: 'literal', value: s };
        }
        if (tok.type === lexer_1.TokenType.Identifier) {
            this.advance();
            return { kind: 'ident', name: tok.text };
        }
        throw new Error(`Unexpected expr token: ${tok.text}`);
    }
}
exports.Parser = Parser;
