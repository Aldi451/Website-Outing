with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'id="modalUniversalImportExcel"' in l:
        print(f"modalUniversalImportExcel at line {i+1}")
    if 'id="modalParticipant"' in l:
        print(f"modalParticipant at line {i+1}")
