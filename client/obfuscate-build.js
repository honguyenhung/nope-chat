/**
 * Post-build obfuscation script
 * Chạy sau khi Vite build xong để obfuscate JS files
 */

import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import config
const config = (await import('./obfuscator.config.js')).default;

const distDir = path.join(__dirname, 'dist', 'assets');

console.log('🔒 Starting code obfuscation...\n');

// Đọc tất cả files trong dist/assets
const files = fs.readdirSync(distDir);

let obfuscatedCount = 0;
let totalSize = 0;
let obfuscatedSize = 0;

files.forEach(file => {
  if (file.endsWith('.js') && !file.includes('.map')) {
    const filePath = path.join(distDir, file);
    const originalCode = fs.readFileSync(filePath, 'utf8');
    const originalSize = originalCode.length;
    
    console.log(`📄 Obfuscating: ${file}`);
    console.log(`   Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    
    try {
      // Obfuscate
      const obfuscationResult = JavaScriptObfuscator.obfuscate(originalCode, config);
      const obfuscatedCode = obfuscationResult.getObfuscatedCode();
      const obfuscatedFileSize = obfuscatedCode.length;
      
      // Write back
      fs.writeFileSync(filePath, obfuscatedCode, 'utf8');
      
      console.log(`   Obfuscated size: ${(obfuscatedFileSize / 1024).toFixed(2)} KB`);
      console.log(`   Size change: ${obfuscatedFileSize > originalSize ? '+' : ''}${((obfuscatedFileSize - originalSize) / originalSize * 100).toFixed(1)}%`);
      console.log(`   ✅ Done\n`);
      
      obfuscatedCount++;
      totalSize += originalSize;
      obfuscatedSize += obfuscatedFileSize;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Obfuscation complete!`);
console.log(`📊 Stats:`);
console.log(`   Files processed: ${obfuscatedCount}`);
console.log(`   Total original size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`   Total obfuscated size: ${(obfuscatedSize / 1024).toFixed(2)} KB`);
console.log(`   Size change: ${obfuscatedSize > totalSize ? '+' : ''}${((obfuscatedSize - totalSize) / totalSize * 100).toFixed(1)}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🚀 Your code is now protected!');
console.log('📦 Deploy the /dist folder to production.\n');
