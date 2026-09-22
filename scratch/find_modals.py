with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
modals = re.findall(r'id="(modal\w+)"', content)
print('Existing modals:', modals)
