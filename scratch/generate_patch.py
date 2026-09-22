# Build complete patch and verify
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("Original index.html lines:", len(content.splitlines()))

# Check positions for injections:
# 1. CSS: before </style>
css_pos = content.find('</style>')
print("CSS injection pos:", css_pos)

# 2. Action toolbar in pageHome:
# Find: <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-3 shadow-sm border">
toolbar_pos = content.find('Rekapitulasi Outing (Master Excel)')
print("Home toolbar pos:", toolbar_pos)

# 3. pageSettings:
# Find: <!-- MASTER EXPORT BACKUP CARD -->
settings_pos = content.find('<!-- MASTER EXPORT BACKUP CARD -->')
print("Settings pos:", settings_pos)

# 4. Modals: before </body> or after modalParticipant
modals_pos = content.rfind('</div>\n    </div>\n</div>\n\n</body>')
if modals_pos == -1:
    modals_pos = content.find('id="modalParticipant"')
print("Modals pos:", modals_pos)

# 5. setupManagementMenu():
menu_pos = content.find('function setupManagementMenu()')
print("setupManagementMenu pos:", menu_pos)

# 6. initSeedDataIfEmpty():
seed_pos = content.find('function initSeedDataIfEmpty()')
print("initSeedDataIfEmpty pos:", seed_pos)
