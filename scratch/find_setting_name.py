with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('settingOutingName')
print("Position:", pos)
if pos != -1:
    print(content[pos-500:pos+2500])
