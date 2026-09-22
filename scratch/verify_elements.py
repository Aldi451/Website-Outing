with open('index.html', encoding='utf-8') as f:
    html = f.read()

ids = [
    'modalPurchase','formPurchase','modalPurchaseTitle','purchaseId','purchaseItem',
    'purchaseQty','purchaseUnit','purchaseEstCost','purchaseActCost','purchaseVendor',
    'purchaseNeededDate','purchaseSection','purchaseStatus','purchaseNotes',
    'purchaseImageInput','purchaseImageUrl','purchaseImageDropZone','purchaseImageEmptyState',
    'purchaseImageCompressingState','purchaseImagePreviewState','purchaseImagePreviewImg',
    'purchaseImageSizeInfo','btnSavePurchase','modalPurchaseImagePreview',
    'previewPurchaseTitle','previewPurchaseSubtitle','previewPurchaseImg',
    'previewPurchaseMeta','previewPurchaseDownload','purchasingList'
]

missing = [i for i in ids if f'id="{i}"' not in html]
if missing:
    print('Missing IDs:', missing)
else:
    print(f'SUCCESS: All {len(ids)} elements found in index.html!')
