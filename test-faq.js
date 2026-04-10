const fs = require('fs');
const content = fs.readFileSync('posts/money-compass-agentic-cost-intelligence.mdx', 'utf8');

let cleaned = content.replace(/^###\s+(?:H3\s*)?(.+)$/gm, '\n**$1**\n');
  
const faqRegex = /^##\s*FAQ\s*\n([\s\S]*?)(?=^##\s|$)/im;
const faqMatch = cleaned.match(faqRegex);
if (!faqMatch) { console.log('no match'); process.exit(); }
const faqRaw = faqMatch[1];
let newFaq = '\n<FAQAccordion>\n';
let currentQ = '';
let currentA = '';
const lines = faqRaw.split('\n');
for (let i = 0; i < lines.length; i++) {
   const line = lines[i].trim();
   if ((line.startsWith('**') && line.endsWith('**')) || (line.startsWith('**Q') && line.includes('**'))) {
       if (currentQ) {
           newFaq += `  <FAQItem question="${currentQ.replace(/"/g, '&quot;')}">\n    ${currentA.trim()}\n  </FAQItem>\n`;
       }
       if (line.startsWith('**Q') && line.includes('**') && !line.endsWith('**')) {
           currentQ = line.replace(/^\*\*(.+?)\*\*.*$/, '$1').trim();
           currentA = line.replace(/^\*\*.+?\*\*(.*)$/, '$1').trim(); // Get the rest
       } else {
           currentQ = line.replace(/^\*\*(.+)\*\*$/, '$1').trim();
           currentA = '';
       }
   } else if (line.length > 0) {
       currentA += line + '\n';
   }
}
if (currentQ) {
   newFaq += `  <FAQItem question="${currentQ.replace(/"/g, '&quot;')}">\n    ${currentA.trim()}\n  </FAQItem>\n`;
}
newFaq += '</FAQAccordion>\n';
console.log(newFaq);
