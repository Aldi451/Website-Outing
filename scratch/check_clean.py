# Fix script positioning in index.html

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Restore from backup first to get pristine state
with open('index.backup-before-softcopy-feature.html', 'r', encoding='utf-8') as f:
    clean_html = f.read()

# Let's inspect where bootstrap.bundle.min.js is in clean_html
bs_pos = clean_html.find('bootstrap.bundle.min.js')
print("clean_html bootstrap pos:", bs_pos)
print(repr(clean_html[bs_pos-30:bs_pos+100]))
