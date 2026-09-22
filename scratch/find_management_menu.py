with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('managementMenu')
print("Position:", pos)
while pos != -1:
    print(content[pos-100:pos+500])
    print("="*40)
    pos = content.find('managementMenu', pos+1)
