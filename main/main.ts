import * as path from 'path';
import { Interpreter } from './interpreter';
const args = process.argv.slice(2);
if (args.length !== 1) { console.error('Usage: bisaya <file>'); process.exit(1); }
const file = path.resolve(process.cwd(), args[0]);
new Interpreter().runFile(file);