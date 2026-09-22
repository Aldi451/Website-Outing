with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
pos = content.find('id="view-settings"')
if pos == -1:
    pos = content.find('view-settings')
print("Position:", pos)
if pos != -1:
    print(content[pos-50:pos+3500])
