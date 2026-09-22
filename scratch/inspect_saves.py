with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

matches = re.findall(r'(function\s+save\w+\([^)]*\)\s*\{[\s\S]*?\n\})', content)
for m in matches:
    first_lines = '\n'.join(m.split('\n')[:25])
    print('--- SAVE FUNCTION ---')
    print(first_lines)
