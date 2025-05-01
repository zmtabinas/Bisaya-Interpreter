// tests/testSuite.js
// A simple test runner for the Bisaya++ interpreter.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure fixtures directory exists
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });

// Define test cases
const tests = [
  {
    name: 'Basic Print Test',
    code: `SUGOD
IPAKITA: "Hello, World!"
KATAPUSAN`,
    input: null,
    expected: 'Hello, World!'
  },
  {
    name: 'Arithmetic Loop Test',
    code: `SUGOD
MUGNA NUMERO ctr=1
ALANG SA (ctr=1, ctr<=5, ctr++)
PUNDOK{
  IPAKITA: ctr & ' '
}
KATAPUSAN`,
    input: null,
    expected: '1 2 3 4 5 '
  },
  {
    name: 'Conditional Test',
    code: `SUGOD
MUGNA NUMERO x=10, y=20
KUNG (x < y)
PUNDOK{ IPAKITA: "x mas gamay" }
KUNG DILI (x < y)
PUNDOK{ IPAKITA: "x dili mas gamay" }
KATAPUSAN`,
    input: null,
    expected: 'x mas gamay'
  },
  {
    name: 'Evaluate All Arithmetic Operations',
    code: `SUGOD
MUGNA NUMERO a=10, b=5, c
c = a + b - 2 * 3 / 1
IPAKITA: c
KATAPUSAN`,
    input: null,
    expected: '9'
  },
  {
    name: 'Evaluate Boolean AND and OR',
    code: `SUGOD
MUGNA TINUOD x = "OO", y = "DILI", z
z = (x UG y) O x
IPAKITA: z
KATAPUSAN`,
    input: null,
    expected: 'OO'
  },
  {
    name: 'Evaluate Comparison Operators',
    code: `SUGOD
MUGNA NUMERO a=10, b=5
IPAKITA: (a < b) & ' ' & (a > b) & ' ' & (a <= b) & ' ' & (a >= b) & ' ' & (a <> b) 
KATAPUSAN`,
    input: null,
    expected: 'DILI OO DILI OO OO'
  },
  {
    name: 'Evaluate NOT Operator',
    code: `SUGOD
MUGNA TINUOD flag = "DILI", result
result = !flag
IPAKITA: result 
KATAPUSAN`,
    input: null,
    expected: 'OO'
  },
  {
    name: 'Compute Floating Point Variables (TIPIK)',
    code: `SUGOD
MUGNA TIPIK pi = 3.14, r = 2, area
area = pi * r * r
IPAKITA: area
KATAPUSAN`,
    input: null,
    expected: '12.56'
  },
];

// Write fixtures and run tests
let passed = 0;
console.log('Running Bisaya++ tests...');
tests.forEach((test, idx) => {
  const filePath = path.join(fixturesDir, `test${idx + 1}.bisaya`);
  fs.writeFileSync(filePath, test.code);

  const args = [path.resolve(__dirname, '..', 'dist', 'main.js'), filePath];
  const opts = {};
  if (test.input !== null) opts.input = test.input;

  const result = spawnSync('node', args, opts);
  const stdout = result.stdout ? result.stdout.toString() : '';
  const stderr = result.stderr ? result.stderr.toString() : '';

  const pass = stdout === test.expected;
  if (pass) {
    console.log(`✅ ${test.name}`);
    console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    console.log(`   Received: ${JSON.stringify(stdout)}`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    console.log(`   Received: ${JSON.stringify(stdout)}`);
    if (stderr) console.log(`   Stderr: ${stderr}`);
  }
});

console.log(`\n${passed}/${tests.length} tests passed.`);
process.exit(passed === tests.length ? 0 : 1);
