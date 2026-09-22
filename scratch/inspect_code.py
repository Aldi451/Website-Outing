with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

targets = ['loadOuting', 'saveOutingSettings', 'exportMasterExcel', 'settings', 'outings', 'currentOutingId']
for i, line in enumerate(lines):
    if any(k in line for k in ['function loadOuting', 'function saveOuting', 'function exportMasterExcel', 'CURRENT_OUTING', 'currentOutingId', 'nav-settings', 'view-settings', 'id="settings"']):
        print(f'{i+1}: {line.strip()[:110]}')
