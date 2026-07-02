const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const startTabStr = "{/* Tabs Bar */}";
const lines = content.split('\n');
const startLine = lines.findIndex(l => l.includes(startTabStr));
const endLine = 3838;

let tabCode = lines.slice(startLine, endLine + 1).join('\n');

tabCode = tabCode.replace(/launchKits\[activeIdeaIndex\]\?\.data/g, "kit");
tabCode = tabCode.replace(/launchKits\[activeIdeaIndex\]!\.data!/g, "kit");

const componentCode = `
function LaunchKitTabs({ kit, onCopy, copiedText }: any) {
  const [kitTab, setKitTab] = React.useState("prompt");
  return (
    <div className="mt-6 w-full overflow-hidden">
      ${tabCode}
    </div>
  );
}
`;

content = content.replace("export default function Page() {", componentCode + "\nexport default function Page() {");

const isKitStart = content.indexOf("{isKitLoaded && (");
const notKitStart = content.indexOf("{!isKitLoaded && (", isKitStart);

const replacementKitCode = `{isKitLoaded && (
                                <LaunchKitTabs kit={launchKits[index]?.data} onCopy={handleCopy} copiedText={copiedText} />
                              )}
                              `;

content = content.substring(0, isKitStart) + replacementKitCode + content.substring(notKitStart);

const workspaceStartStr = "{/* Selected Idea Details & Launch Kit Workspace */}";
const workspaceStart = content.indexOf(workspaceStartStr);

const findTabEndStr = "        )}\n\n        {/* COMPARE NICHES TAB */";
const findTabEnd = content.indexOf(findTabEndStr);

if(workspaceStart !== -1 && findTabEnd !== -1) {
    content = content.substring(0, workspaceStart) + "              </div>\n            </div>\n" + content.substring(findTabEnd);
}

fs.writeFileSync('app/page.tsx', content);
console.log("SUCCESS");
