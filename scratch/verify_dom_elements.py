import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Collect all element IDs in HTML
html_ids = set(re.findall(r'id=[\x22\x27]([a-zA-Z0-9_\-]+)[\x22\x27]', html))

# Collect all getElementById calls in JS
js_ids = set(re.findall(r'getElementById\([\x22\x27]([a-zA-Z0-9_\-]+)[\x22\x27]\)', html))

print(f'Total HTML IDs: {len(html_ids)}')
print(f'Total getElementById target IDs: {len(js_ids)}')

missing_ids = []
for jid in sorted(js_ids):
    if jid not in html_ids:
        missing_ids.append(jid)

print('IDs queried in JS but not found in HTML (with ? or optional handling):', missing_ids)
