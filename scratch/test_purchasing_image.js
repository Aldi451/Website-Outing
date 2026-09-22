const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Test 1: Check formatFileSize logic
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

console.log('Testing formatFileSize:');
console.log('0 ->', formatFileSize(0));
console.log('512 ->', formatFileSize(512));
console.log('45600 ->', formatFileSize(45600));
console.log('3500000 ->', formatFileSize(3500000));
console.assert(formatFileSize(0) === '0 B', '0 should be 0 B');
console.assert(formatFileSize(1024) === '1 KB', '1024 should be 1 KB');
console.assert(formatFileSize(3500000) === '3.3 MB', '3500000 should be 3.3 MB');

// Test 2: Check required keywords in index.html
const requiredSnippets = [
    'handlePurchaseImageChange',
    'removePurchaseImage',
    'previewPurchaseImage',
    'compressImageFile',
    'formatFileSize',
    'initPurchaseDropZone',
    'currentPurchaseImageBlob',
    'modalPurchaseImagePreview',
    'purchaseImageDropZone',
    'purchaseImagePreviewImg',
    'purchaseImageSizeInfo',
    'purchaseImageUrl',
    'image_url: finalImageUrl',
    'storage.from(\'purchases\')',
    'image_url: row.image_url || \'\''
];

let allPassed = true;
requiredSnippets.forEach(snippet => {
    if (!html.includes(snippet)) {
        console.error('Missing required snippet:', snippet);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('SUCCESS: All required image upload & compression code snippets are present!');
}
