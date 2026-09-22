import re, subprocess

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract script blocks
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
print(f'Found {len(scripts)} inline script blocks.')

for idx, s in enumerate(scripts):
    filename = f'scratch/extracted_script_{idx}.js'
    with open(filename, 'w', encoding='utf-8') as sf:
        sf.write(s)
    res = subprocess.run(['node', '-c', filename], capture_output=True, text=True)
    if res.returncode == 0:
        print(f'Script block {idx} ({len(s.splitlines())} lines): SYNTAX OK')
    else:
        print(f'Script block {idx} ERROR:')
        print(res.stderr)
