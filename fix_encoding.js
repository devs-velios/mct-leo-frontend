const fs = require('fs');
const path = require('path');

const replacements = [
  { bad: /Ã©/g, good: 'é' },
  { bad: /Ã¨/g, good: 'è' },
  { bad: /Ãª/g, good: 'ê' },
  { bad: /Ã´/g, good: 'ô' },
  { bad: /â‰¥/g, good: '≥' },
  { bad: /Ã\u00A0/g, good: 'à' }, // à is sometimes Ã followed by non-breaking space or similar. Let's use string replace for this if regex fails, or \xA0. Actually, Ã followed by space is usually "Ã ". Let's check `Ã `.
  { bad: /Ã /g, good: 'à' }, // literally Ã 
  { bad: /Ã€/g, good: 'À' }, // uppercase À
  { bad: /Ã®/g, good: 'î' },
  { bad: /Ã§/g, good: 'ç' },
  { bad: /Ã¢/g, good: 'â' },
  { bad: /Ã»/g, good: 'û' },
  { bad: /Ã¯/g, good: 'ï' },
  { bad: /Ã‹/g, good: 'Ë' },
  { bad: /Ã‰/g, good: 'É' },
  { bad: /Ãˆ/g, good: 'È' },
  { bad: /â€™/g, good: "'" },
  { bad: /â€œ/g, good: '"' },
  { bad: /â€/g, good: '"' },
  { bad: /â€”/g, good: '—' },
  { bad: /œ/g, good: 'œ' }, // If it's broken, it might be Ã…â€œ, but we'll stick to basics.
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { bad, good } of replacements) {
        content = content.replace(bad, good);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed encoding in ${fullPath}`);
      }
    }
  }
}

processDirectory('./components');
processDirectory('./app');
processDirectory('./lib');
console.log('Encoding fix complete!');
