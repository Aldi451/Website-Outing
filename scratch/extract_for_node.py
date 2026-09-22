import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the inline script (not src="...")
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>', content)
print(f"Found {len(scripts)} inline script(s).")

for idx, script in enumerate(scripts):
    filename = f"scratch/test_inline_script_{idx}.js"
    with open(filename, 'w', encoding='utf-8') as sf:
        sf.write(script)
    print(f"Wrote script {idx} ({len(script)} chars) to {filename}")
