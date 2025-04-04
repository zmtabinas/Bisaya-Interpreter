import { RuntimeVal } from "./values.ts";


export default class Environment {
    private parent?: Environment; // ? means undefind, there might be a parent or not
    private variables: Map<string, RuntimeVal>;

    constructor (parentENV?: Environment) {
        this.parent = parentENV;
        this.variables = new Map();
    }

    public declareVar (varname: string, value: RuntimeVal): RuntimeVal {
        if (this.variables.has(varname)) {
            throw 'Cannot declare variable ${varname}. As it already is defind.';
        }

        this.variables.set(varname, value);

        return value;
    }

    public assignVar (varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname);
        env.variables.set(varname, value);
        
        return value;
    }

    public lookupVar (varname: string): RuntimeVal {
        const env = this.resolve(varname);

        return env.variables.get(varname) as RuntimeVal;
    }

    public resolve (varname: string): Environment { // traverse scope of environments
        if (this.variables.has(varname))
            return this;

        if (this.parent == undefined) {
            throw 'Cannot resolve ${varname} as it does not exist.';
        }

        return this.parent.resolve(varname);
    }
}