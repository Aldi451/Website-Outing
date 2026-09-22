with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
pages = re.findall(r'id="(page\w+)"', content)
print("Pages in HTML:", pages)

navs = re.findall(r'onclick="showPage\(\'([^\']+)\'\)"', content)
print("Nav targets:", set(navs))
