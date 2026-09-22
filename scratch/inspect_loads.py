with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find all async function load...
matches = re.findall(r'(async\s+function\s+load\w+\([^)]*\)\s*\{[\s\S]*?\n\})', content)
for m in matches:
    first_lines = '\n'.join(m.split('\n')[:15])
    print('--- FUNCTION ---')
    print(first_lines)
