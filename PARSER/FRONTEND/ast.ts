export type NodeType = 
    | "Program" 
    | "VarDeclaration"
    | "NumericLiteral" 
    | "Identifier" 
    | "BinaryExpr" 
    | "CallExpr" 
    | "UnaryExpr" 
    | "FunctionDeclaration";

// Statements will not return a value in our program atleast
export interface Stmt {
    kind: NodeType;
}

export interface Program extends Stmt {
    kind: "Program",
    body: Stmt[];
}

export interface VarDeclaration extends Expr {
    kind: "VarDeclaration",
    constant: boolean,
    identifier: string,
    value?: Expr; // ? means this or undefined
}

export interface Expr extends Stmt {} 

export interface BinaryExpr extends Expr { // Recursive data types
    kind: "BinaryExpr"
    left: Expr,
    right: Expr,
    operator: string;
}

export interface Identifier extends Expr {
    kind: "Identifier",
    symbol: string;
}

export interface NumericLiteral extends Expr {
    kind: "NumericLiteral",
    value: number;
}
