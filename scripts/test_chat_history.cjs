const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../frontend-vue/src/runtime/createRuntime.ts'), 'utf8');
const start = source.indexOf('        function buildChatHistory(');
const end = source.indexOf('        async function consumeSSE(', start);
assert.ok(start >= 0 && end > start, 'Vue runtime history builder exists');
const context = vm.createContext({});
vm.runInContext(source.slice(start, end), context);
const history = context.buildChatHistory([
  {role:'user', content:'', attachments:['meeting.txt']},
  {role:'assistant', content:'x'.repeat(18000)},
  {role:'assistant', content:'错误回答', error:true},
  {role:'assistant', content:'已停止', interrupted:true}
]);
assert.equal(history.length, 2);
assert.match(history[0].content, /附件/);
assert.ok(history[1].content.length <= 12000);
assert.equal(context.buildChatHistory(Array.from({length:15}, (_,i) => ({role:'user',content:String(i)}))).length, 10);
console.log('PASS: Vue history builder handles attachments, long text, failed replies and count limit');
