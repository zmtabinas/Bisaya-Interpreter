"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.Token = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Keyword"] = 0] = "Keyword";
    TokenType[TokenType["Identifier"] = 1] = "Identifier";
    TokenType[TokenType["Number"] = 2] = "Number";
    TokenType[TokenType["String"] = 3] = "String";
    TokenType[TokenType["Operator"] = 4] = "Operator";
    TokenType[TokenType["Punctuation"] = 5] = "Punctuation";
    TokenType[TokenType["EndOfFile"] = 6] = "EndOfFile";
})(TokenType || (exports.TokenType = TokenType = {}));
class Token {
    constructor(type, text) {
        this.type = type;
        this.text = text;
    }
}
exports.Token = Token;
const KEYWORDS = new Set([
    'SUGOD', 'KATAPUSAN', 'MUGNA', 'NUMERO', 'LETRA', 'TINUOD', 'TIPIK',
    'IPAKITA', 'DAWAT', 'KUNG', 'WALA', 'DILI', 'PUNDOK', 'ALANG', 'SA', 'UG', 'O'
]);
class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
    }
    peek() { return this.input[this.pos] || '\0'; }
    advance() { return this.input[this.pos++] || '\0'; }
    isAtEnd() { return this.pos >= this.input.length; }
    tokenize() {
        //const tokens: Token[] = []; <- had to change the code from here. (Was buggy)
        this.input = this.input
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');
        const tokens = [];
        while (!this.isAtEnd()) {
            let c = this.peek();
            if (/\s/.test(c)) {
                this.advance();
                continue;
            }
            if (c === '-' && this.input.substr(this.pos, 2) === '--') {
                while (!this.isAtEnd() && c !== '\n') {
                    c = this.advance();
                }
                continue;
            }
            if (/[A-Za-z_]/.test(c)) {
                let id = '';
                while (/[A-Za-z0-9_]/.test(this.peek()))
                    id += this.advance();
                const up = id.toUpperCase();
                tokens.push(new Token(KEYWORDS.has(up) ? TokenType.Keyword : TokenType.Identifier, up));
                continue;
            }
            if (/[0-9]/.test(c)) {
                let num = '';
                while (/[0-9\.]/.test(this.peek()))
                    num += this.advance();
                tokens.push(new Token(TokenType.Number, num));
                continue;
            }
            if (c === '"' || c === "'") {
                const quote = this.advance();
                let str = '';
                while (!this.isAtEnd() && this.peek() !== quote)
                    str += this.advance();
                this.advance();
                tokens.push(new Token(TokenType.String, str));
                continue;
            }
            const two = this.input.substr(this.pos, 2);
            if (['<=', '>=', '==', '<>', '++'].includes(two)) {
                tokens.push(new Token(TokenType.Operator, two));
                this.pos += 2;
                continue;
            }
            if ('+-*/%<>=&$!,#(){}[]:'.includes(c)) {
                const type = '(){}[],:'.includes(c) ? TokenType.Punctuation : TokenType.Operator;
                tokens.push(new Token(type, this.advance()));
                continue;
            }
            throw new Error(`Unexpected character: ${c}`);
        }
        tokens.push(new Token(TokenType.EndOfFile, ''));
        return tokens;
    }
}
exports.Lexer = Lexer;
