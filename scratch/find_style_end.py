with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '</style>' in l:
        print(f"</style> at line {i+1}")
