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
        // 1) expect the keyword
        this.expect(lexer_1.TokenType.Keyword, 'DAWAT');
        // 2) expect the colon punctuation
        this.expect(lexer_1.TokenType.Punctuation, ':');
        // 3) collect one-or-more identifiers
        const vars = [];
        // first variable name
        vars.push(this.expect(lexer_1.TokenType.Identifier).text);
        // additional names if “, name”
        while (this.peek().type === lexer_1.TokenType.Punctuation
            && this.peek().text === ',') {
            this.advance(); // consume the comma
            vars.push(this.expect(lexer_1.TokenType.Identifier).text);
        }
        // done—return an input statement node
        return { kind: 'input', vars };
    }
    parseIf() {
        const branches = [];
        // 1) the “if” branch
        this.expect(lexer_1.TokenType.Keyword, 'KUNG');
        this.expect(lexer_1.TokenType.Punctuation, '(');
        const ifCond = this.parseExpr();
        this.expect(lexer_1.TokenType.Punctuation, ')');
        const ifBody = this.parseBlock();
        branches.push({ cond: ifCond, body: ifBody });
        // 2) zero or more "else-if" (only if it's KUNG DILI (...) or KUNG (...)—not KUNG WALA)
        while (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KUNG' &&
            // look ahead one token to see if it really is DILI or an expression:
            ((this.tokens[this.pos + 1].text === 'DILI') || (this.tokens[this.pos + 1].text === '('))) {
            // consume the KUNG
            this.advance();
            if (this.peek().text === 'DILI') {
                // KUNG DILI(x<y) → we want x>y (strict greater)
                this.advance(); // consume 'DILI'
                this.expect(lexer_1.TokenType.Punctuation, '(');
                const raw = this.parseExpr(); // e.g. {kind:'binary', left, op:'<', right}
                this.expect(lexer_1.TokenType.Punctuation, ')');
                // If it's a simple comparison, flip it:
                let condExpr;
                if (raw.kind === 'binary' && ['<', '>', '<=', '>=', '<>'].includes(raw.operator)) {
                    const invertOp = {
                        '<': '>',
                        '>': '<',
                        '<=': '>=',
                        '>=': '<=',
                        '<>': '===' // inequality invert → strict equality
                    };
                    condExpr = {
                        kind: 'binary',
                        left: raw.left,
                        operator: invertOp[raw.operator],
                        right: raw.right
                    };
                }
                else {
                    // fallback to boolean NOT if it wasn't a simple compare
                    condExpr = { kind: 'unary', operator: '!', expr: raw };
                }
                const elifBody = this.parseBlock();
                branches.push({ cond: condExpr, body: elifBody });
            }
            else if (this.peek().text === '(') {
                // alternate else-if written as KUNG (<expr>)
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
        // 3) optional “else” – written KUNG WALA PUNDOK{…}
        if (this.peek().type === lexer_1.TokenType.Keyword && this.peek().text === 'KUNG') {
            this.advance();
            this.expect(lexer_1.TokenType.Keyword, 'WALA');
            const elseBody = this.parseBlock();
            branches.push({ cond: undefined, body: elseBody });
        }
        return { kind: 'if', branches };
    }
    parseBlock() {
        // consume PUNDOK{
        this.expect(lexer_1.TokenType.Keyword, 'PUNDOK');
        this.expect(lexer_1.TokenType.Punctuation, '{');
        const stmts = [];
        // gather until matching }
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
        // consume ALANG SA
        this.expect(lexer_1.TokenType.Keyword, 'ALANG');
        this.expect(lexer_1.TokenType.Keyword, 'SA');
        // parentheses
        this.expect(lexer_1.TokenType.Punctuation, '(');
        // init: assignment stmt (identifier = expr)
        const initStmt = this.parseAssign();
        this.expect(lexer_1.TokenType.Punctuation, ',');
        // cond: boolean expr
        const condExpr = this.parseExpr();
        this.expect(lexer_1.TokenType.Punctuation, ',');
        // update: either a unary ++/-- or assign
        let updateStmt;
        const next = this.peek();
        if (next.type === lexer_1.TokenType.Identifier && this.tokens[this.pos + 1].text.match(/\+\+|--/)) {
            // unary update: e.g. ctr++
            const name = this.expect(lexer_1.TokenType.Identifier).text;
            const opTok = this.expect(lexer_1.TokenType.Operator);
            const op = opTok.text; // '++' or '--'
            // transform to assign: ctr = ctr + 1 or -1
            const one = { kind: 'literal', value: 1 };
            const expr = { kind: 'binary', left: { kind: 'ident', name }, operator: op === '++' ? '+' : '-', right: one };
            updateStmt = { kind: 'assign', targets: [name], expr };
        }
        else {
            // normal assign
            updateStmt = this.parseAssign();
        }
        // close paren
        this.expect(lexer_1.TokenType.Punctuation, ')');
        // body block
        const body = this.parseBlock();
        return { kind: 'for', init: initStmt, cond: condExpr, update: updateStmt, body };
    }
    parseAssign() {
        // parse a chain like x=y=z or a single assignment a = expr
        const targets = [];
        // first target
        targets.push(this.expect(lexer_1.TokenType.Identifier).text);
        // we must see exactly one '=' next
        this.expect(lexer_1.TokenType.Operator, '=');
        // support x=y=z by repeating: but only if the next token is IDENTIFIER *and* the following is '='
        while (this.peek().type === lexer_1.TokenType.Identifier
            && this.tokens[this.pos + 1].text === '=') {
            // consume the identifier target
            targets.push(this.advance().text);
            // consume the '='
            this.expect(lexer_1.TokenType.Operator, '=');
        }
        // now the RHS expression
        const expr = this.parseExpr();
        return { kind: 'assign', targets, expr };
    }
    parsePrint() {
        this.expect(lexer_1.TokenType.Keyword, 'IPAKITA');
        this.expect(lexer_1.TokenType.Punctuation, ':');
        // const parts: Array<{ literal?: string, expr?: Expr }> = [];
        // let first = true;
        // while (true) {
        //   if (!first) this.expect(TokenType.Operator, '&');
        //   first = false;
        //   const tok = this.peek();
        //   if (tok.text === '$') { parts.push({ literal: '\n' }); this.advance(); }
        //   else if (tok.text === '[') {
        //     this.advance();
        //     const contentTok = this.advance();
        //     this.expect(TokenType.Punctuation, ']');
        //     parts.push({ literal: contentTok.text });
        //   } else if (tok.type === TokenType.Number || tok.type === TokenType.String) {
        //     const lit = this.parseExpr(); parts.push({ expr: lit });
        //   } else if (tok.type === TokenType.Identifier) {
        //     const expr = this.parseExpr(); parts.push({ expr });
        //   } else break;
        //   if (this.peek().type === TokenType.EndOfFile) break;
        //   if (this.peek().type === TokenType.Keyword && this.peek().text === 'KATAPUSAN') break;
        // }
        // return { kind: 'print', parts };
        const parts = [];
        let first = true;
        while (true) {
            // Only consume '&' if it's actually next
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
                // bracket literal: any single token inside
                this.advance();
                const contentTok = this.advance();
                this.expect(lexer_1.TokenType.Punctuation, ']');
                parts.push({ literal: contentTok.text });
            }
            else if (tok.text === '(') {
                // allow parenthesized expression inside a print part
                const expr = this.parseExpr();
                parts.push({ expr });
            }
            else if (tok.type === lexer_1.TokenType.Number || tok.type === lexer_1.TokenType.String || tok.type === lexer_1.TokenType.Identifier) {
                // parseExpr will advance for numbers, strings, identifiers
                parts.push({ expr: this.parseExpr() });
            }
            else {
                // no more print parts
                break;
            }
            // stop if block/EOF follows
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
            const op = this.advance().text; // "-" or "!"
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
            // special-case Bisaya boolean literals
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
