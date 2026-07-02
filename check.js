const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const startTabStr = "{/* Tabs Bar */}";
const lines = content.split('\n');
const startLine = lines.findIndex(l => l.includes(startTabStr));
const endLine = lines.findIndex(l => l.includes("LaunchKitTabs kit={launchKits[index]?.data}")) === -1 ? 3838 : 3130; 
// wait, the active workspace was deleted already so tabs bar is gone?
console.log(startLine);
