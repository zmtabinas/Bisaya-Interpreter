export enum TokenType {
    Keyword,
    Identifier,
    Number,
    String,
    Operator,
    Punctuation,
    EndOfFile
  }
  export class Token {
    constructor(public type: TokenType, public text: string) {}
  }
  const KEYWORDS = new Set([
    'SUGOD','KATAPUSAN','MUGNA','NUMERO','LETRA','TINUOD','TIPIK',
    'IPAKITA','DAWAT','KUNG','WALA','DILI','PUNDOK','ALANG','SA','UG','O'
  ]);
  export class Lexer {
    private pos = 0;
    constructor(private input: string) {}
    private peek(): string { return this.input[this.pos] || '\0'; }
    private advance(): string { return this.input[this.pos++] || '\0'; }
    private isAtEnd(): boolean { return this.pos >= this.input.length; }
    tokenize(): Token[] {
      //const tokens: Token[] = []; <- had to change the code from here. (Was buggy)
      this.input = this.input
    .replace(/[\u2018\u2019]/g, "'")  
    .replace(/[\u201C\u201D]/g, '"'); 
    const tokens: Token[] = [];
      while (!this.isAtEnd()) {
        let c = this.peek();
        if (/\s/.test(c)) { this.advance(); continue; }
        if (c === '-' && this.input.substr(this.pos, 2) === '--') {
          while (!this.isAtEnd() && c !== '\n') { c = this.advance(); }
          continue;
        }
        if (/[A-Za-z_]/.test(c)) {
          let id = '';
          while (/[A-Za-z0-9_]/.test(this.peek())) id += this.advance();
          const up = id.toUpperCase();
          tokens.push(new Token(KEYWORDS.has(up) ? TokenType.Keyword : TokenType.Identifier, up));
          continue;
        }
        if (/[0-9]/.test(c)) {
          let num = '';
          while (/[0-9\.]/.test(this.peek())) num += this.advance();
          tokens.push(new Token(TokenType.Number, num));
          continue;
        }
        if (c === '"' || c === "'") {
          const quote = this.advance();
          let str = '';
          while (!this.isAtEnd() && this.peek() !== quote) str += this.advance();
          this.advance();
          tokens.push(new Token(TokenType.String, str));
          continue;
        }
        const two = this.input.substr(this.pos, 2);
        if (['<=','>=','==','<>','++'].includes(two)) {
          tokens.push(new Token(TokenType.Operator, two)); this.pos += 2; continue;
        }
        if ('+-*/%<>=&$!,#(){}[]:'.includes(c)) {
          const type = '(){}[],:'.includes(c) ? TokenType.Punctuation : TokenType.Operator;
          tokens.push(new Token(type, this.advance()));
          continue;
        }
        throw new Error(`Unexpected character: ${c}`);
      }
      tokens.push(new Token(TokenType.EndOfFile, '')); return tokens;
    }
  }