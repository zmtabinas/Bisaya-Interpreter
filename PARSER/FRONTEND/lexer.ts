// 

export enum TokenType {
    Number,
    Identifier,
    Let,
    BinaryOperator,
    Equals,
    OpenParen, 
    CloseParen,
    EOF,    
}

// This is a dictionary
const KEYWORDS: Record<string, TokenType> = {
    "let": TokenType.Let,
}

export interface Token {
    value: string;
    type: TokenType;
}

function token (value = "", type: TokenType): Token {
    return { value, type };
}

function isAlpha (src: string) {
    // To check if it is an alphabet
    return src.toUpperCase() != src.toLowerCase(); 
}

function isSkippable (str: string) {
    return str == ' ' || str == '\n' || str == '\t';
}

function isInt (str: string) {
    const c = str.charCodeAt(0);
    const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
    // Is the character C greater than or equal to the unicode index for zero
    // And is it less than the unicode index of nine
    // This will tell if it is a numeric character
    return (c >= bounds[0] && c <= bounds[1]);
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    // Build each token until end of file, parse it all the way
    while (src.length > 0) {
        if (src[0] == "(") {
            tokens.push(token(src.shift(), TokenType.OpenParen));
        } else if (src[0] == ")") {
            tokens.push(token(src.shift(), TokenType.CloseParen));
        } else if (src[0] == "+" || src[0] == "-" || src[0] == "*" || src[0] == "/") {
            tokens.push(token(src.shift(), TokenType.BinaryOperator));
        } else if (src[0] == "=") {
            tokens.push(token(src.shift(), TokenType.Equals));
        } else {
            // Handle multicharacter tokens

            // Building number token
            if (isInt(src[0])) {
                let num = "";
                while (src.length > 0 && isInt(src[0])) {
                    num += src.shift();
                }

                tokens.push(token(num, TokenType.Number));
            } else if  (isAlpha(src[0])) {
                let ident = "";
                while (src.length > 0 && isAlpha(src[0])) {
                    ident += src.shift();
                }

                // check for reserved keyword
                const reserved = KEYWORDS[ident];
                if (reserved == undefined) {
                    tokens.push(token(ident, TokenType.Identifier));
                } else {
                    tokens.push(token(ident, reserved));
                }
            } else if (isSkippable(src[0])) {
                src.shift();
            } else {
                console.log("Unrecognized character: ", src[0]);
                Deno.exit(1);
            }
        }
    }

    tokens.push({type: TokenType.EOF, value: "EndOfFile"});
    return tokens;
}
// const source = await Deno.readTextFile("./test.txt");
// for (const token of tokenize(source)) {
//     console.log(token);
// }