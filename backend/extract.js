// faylni ishlatish kodi 
// node combine.js

const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'Barcha_kodlar.txt');
let result = '';

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            traverse(p);
        } else {
            result += `\n\n=========================================\nFILE: ${p}\n=========================================\n`;
            result += fs.readFileSync(p, 'utf8');
        }
    }
}

try {
    traverse('src');
    fs.writeFileSync(outPath, result);
    console.log(`Success! All files written to ${outPath}`);
} catch (error) {
    console.error('Error combining files:', error);
}




// const fs = require('fs');
// const path = require('path');

// // 1. Sozlamalar
// const CONFIG = {
//   inputDir: 'src',                // Kodlar qaysi papkada?
//   outputFile: 'Barcha_kodlar.txt', // Natija qaysi faylga yozilsin?
//   allowedExtensions: ['.ts', '.js', '.json', '.html', '.css'], // Faqat shu turdagi fayllarni olamiz
//   ignoredFolders: ['node_modules', 'dist', 'test', 'obj']      // Shu papkalarni o'qiymaymiz
// };

// const outPath = path.join(__dirname, CONFIG.outputFile);
// let result = `=========================================\n` +
//              `LOYIHA KODLARI JAMLANMASI\n` +
//              `Sana: ${new Date().toLocaleString()}\n` +
//              `=========================================\n\n`;

// /**
//  * Papkalarni rekursiv ravishda aylanib chiqish funksiyasi
//  */
// function traverse(dir) {
//   // Agar papka taqiqlangan bo'lsa, to'xtatamiz
//   if (CONFIG.ignoredFolders.includes(path.basename(dir))) return;

//   const files = fs.readdirSync(dir);

//   for (const f of files) {
//     const p = path.join(dir, f);
//     const stat = fs.statSync(p);

//     if (stat.isDirectory()) {
//       traverse(p);
//     } else {
//       const ext = path.extname(f).toLowerCase();
      
//       // Faqat ruxsat berilgan kengaytmali fayllarni o'qiymiz
//       if (CONFIG.allowedExtensions.includes(ext)) {
//         const relativePath = path.relative(__dirname, p);
        
//         result += `\n\n` + `='.repeat(60)` + `\n`;
//         result += `FILE: ${relativePath}\n`;
//         result += `='.repeat(60)` + `\n\n`;
        
//         try {
//           const content = fs.readFileSync(p, 'utf8');
//           result += content + `\n`;
//         } catch (err) {
//           result += `[XATO: Faylni o'qib bo'lmadi: ${err.message}]\n`;
//         }
//       }
//     }
//   }
// }

// // 2. Ishga tushirish
// console.log('🚀 Kodlarni yig\'ish boshlandi...');

// try {
//   if (!fs.existsSync(CONFIG.inputDir)) {
//     console.error(`❌ Xato: '${CONFIG.inputDir}' papkasi topilmadi!`);
//     process.exit(1);
//   }

//   traverse(CONFIG.inputDir);
//   fs.writeFileSync(outPath, result);

//   console.log(`\n✅ Muvaffaqiyatli yakunlandi!`);
//   console.log(`📄 Barcha kodlar bu yerda: ${outPath}`);
  
//   // Fayl hajmini hisoblash
//   const stats = fs.statSync(outPath);
//   console.log(`📏 Fayl hajmi: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

// } catch (error) {
//   console.error('❌ Kutilmagan xatolik yuz berdi:', error);
// }