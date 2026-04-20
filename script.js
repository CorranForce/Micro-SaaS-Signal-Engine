const fs = require('fs');
let content = fs.readFileSync('lib/gemini-schemas.ts', 'utf8');
content = content.replace(/Type\.OBJECT/g, '"OBJECT"')
                 .replace(/Type\.STRING/g, '"STRING"')
                 .replace(/Type\.ARRAY/g, '"ARRAY"')
                 .replace(/Type\.NUMBER/g, '"NUMBER"')
                 .replace(/import \{ Type \} from "@google\/genai";\n/g, '');
fs.writeFileSync('lib/gemini-schemas.ts', content);
