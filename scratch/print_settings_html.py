with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'settingOutingName' in line:
        start_line = max(0, idx - 40)
        end_line = min(len(lines), idx + 80)
        for j in range(start_line, end_line):
            print(f"{j+1}: {lines[j]}", end="")
        break
