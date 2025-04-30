"use strict";
// to add other files pa
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const readlineSync = __importStar(require("readline-sync"));
const fs = __importStar(require("fs"));
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
class Interpreter {
    constructor() {
        this.vars = new Map();
    }
    runFile(filePath) {
        const src = fs.readFileSync(filePath, 'utf-8');
        const lexer = new lexer_1.Lexer(src);
        const tokens = lexer.tokenize();
        const parser = new parser_1.Parser(tokens);
        const stmts = parser.parse();
        this.execStmts(stmts);
    }
    execStmts(stmts) {
        for (const st of stmts) {
            switch (st.kind) {
                case 'decl':
                    this.execDecl(st);
                    break;
                case 'assign':
                    this.execAssign(st);
                    break;
                case 'input':
                    this.execInput(st);
                    break;
                case 'if':
                    this.execIf(st);
                    break;
                case 'print':
                    this.execPrint(st);
                    break;
            }
        }
    }
    execDecl(st) {
        for (const d of st.decls) {
            const initVal = d.init ? this.evalExpr(d.init) : this.defaultForType(st.type);
            this.vars.set(d.name, { type: st.type, value: initVal });
        }
    }
    execAssign(st) {
        const val = this.evalExpr(st.expr);
        for (const name of st.targets) {
            const v = this.vars.get(name);
            if (!v)
                throw new Error(`Undeclared variable ${name}`);
            v.value = val;
        }
    }
    execInput(st) {
        for (const name of st.vars) {
            const v = readlineSync.question(`UNSAY VALUE NI ${name} BAI?: `);
            const variable = this.vars.get(name);
            if (!variable)
                throw new Error(`Undeclared var ${name}`);
            switch (variable.type) {
                case 'NUMERO':
                    variable.value = Number(v);
                    break;
                case 'LETRA':
                    variable.value = v;
                    break;
                case 'TINUOD':
                case 'TIPIK':
                    variable.value = /^OO$/i.test(v) ? true : false;
                    break;
            }
        }
    }
    execIf(st) {
        const B = st.branches;
        // 1) If condition on branch 0 is true
        if (B[0] && Boolean(this.evalExpr(B[0].cond))) {
            return this.execStmts(B[0].body);
        }
        // 2) Else‐if branches (1 through n−2)
        for (let i = 1; i < B.length - 1; i++) {
            if (Boolean(this.evalExpr(B[i].cond))) {
                return this.execStmts(B[i].body);
            }
        }
        // 3) Final else (cond===undefined)
        const last = B.find(b => b.cond === undefined);
        if (last) {
            return this.execStmts(last.body);
        }
    }
    execPrint(st) {
        let out = '';
        for (const p of st.parts) {
            if (p.literal !== undefined) {
                out += p.literal;
            }
            else if (p.expr) {
                const v = this.evalExpr(p.expr);
                if (typeof v === 'boolean')
                    out += v ? 'OO' : 'DILI';
                else
                    out += String(v);
            }
        }
        process.stdout.write(out + '\n');
    }
    evalExpr(e) {
        if (e.kind === 'literal')
            return e.value;
        if (e.kind === 'ident') {
            const v = this.vars.get(e.name);
            if (!v)
                throw new Error(`Undeclared var ${e.name}`);
            return v.value;
        }
        if (e.kind === 'unary') {
            const v = this.evalExpr(e.expr);
            if (e.operator === '-')
                return -v;
            if (e.operator === '!')
                return !v;
            throw new Error(`Unsupported unary ${e.operator}`);
        }
        if (e.kind === 'binary') {
            const L = this.evalExpr(e.left);
            const R = this.evalExpr(e.right);
            switch (e.operator) {
                // arithmetic
                case '+': return L + R;
                case '-': return L - R;
                case '*': return L * R;
                case '/': return L / R;
                // comparison
                case '<': return L < R;
                case '>': return L > R;
                case '<=': return L <= R;
                case '>=': return L >= R;
                case '<>': return L !== R;
                // logical (short-circuiting not needed for now)
                case 'UG': return L && R;
                case 'O': return L || R;
            }
        }
        throw new Error(`Unknown expr kind ${e.kind}`);
    }
    defaultForType(t) {
        switch (t) {
            case 'NUMERO':
            case 'TIPIK': return 0;
            case 'LETRA': return '';
            case 'TINUOD': return false;
        }
        return 0;
    }
}
exports.Interpreter = Interpreter;
