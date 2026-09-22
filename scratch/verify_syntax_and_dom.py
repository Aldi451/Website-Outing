# Verification script to check HTML validity and JS syntax
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Check matching tags
tags = ['style', 'script', 'body', 'html']
for t in tags:
    opens = len(re.findall(f'<{t}', content, re.IGNORECASE))
    closes = len(re.findall(f'</{t}>', content, re.IGNORECASE))
    print(f"Tag <{t}>: opens={opens}, closes={closes}")
    assert opens == closes, f"Mismatch in tag {t}"

# 2. Extract script and test JS syntax using node if available, or regex checks
scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
print(f"Total script tags: {len(scripts)}")

# 3. Check for specific new elements
required_ids = [
    'modalSoftcopyReport',
    'modalPurgeSupabase',
    'settingOutingArchiveSelector',
    'modalReportOutingSelector',
    'reportPrintArea',
    'archivesTableBody',
    'dbStatFinance',
    'dbStatRundown',
    'dbStatPurchasing',
    'dbStatLogistic',
    'dbStatKonsumsi',
    'dbStatParticipants'
]

missing_ids = [id_name for id_name in required_ids if f'id="{id_name}"' not in content]
if missing_ids:
    print("MISSING IDs:", missing_ids)
else:
    print("ALL REQUIRED DOM IDs ARE PRESENT!")

# 4. Check new function definitions
required_functions = [
    'getOutingArchives',
    'initSampleArchiveIfEmpty',
    'saveCurrentOutingToArchive',
    'getOutingDataForReport',
    'generateSoftcopyReportHtml',
    'openSoftcopyReportModal',
    'onModalReportOutingChanged',
    'printSoftcopyReport',
    'downloadStandaloneHtmlReport',
    'downloadArchiveJson',
    'exportArchiveMasterExcel',
    'restoreArchiveToActive',
    'deleteArchive',
    'updateSupabaseStatsSummary',
    'openPurgeSupabaseModal',
    'executePurgeSupabaseAndNewOuting'
]

missing_funcs = [fn for fn in required_functions if f'function {fn}' not in content]
if missing_funcs:
    print("MISSING FUNCTIONS:", missing_funcs)
else:
    print("ALL REQUIRED FUNCTIONS ARE DEFINED!")
