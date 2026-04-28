// src/utils/sm2.js
// ─────────────────────────────────────────────────────────────────────────────
// O'ZGARGAN: faqat 1 ta qator — computeNextState() ichida
//
// [FIX] noto'g'ri javob + stage===0 holati:
//   OLDIN: nextReviewAt = now + WRONG_ANSWER_REQUEUE_MS (10 daqiqa)
//          → Muammo: getDueWords { nextReviewAt <= now } tekshiradi,
//            shuning uchun so'z 10 daqiqa sessiyaga qaytmaydi.
//            Yangi fix bilan getDueWords status:'new' DOIM oladi,
//            shuning uchun WRONG_ANSWER_REQUEUE_MS endi keraksiz.
//   KEYIN: nextReviewAt = now (hozir)
//          → status 'new' bo'lib qoladi, getDueWords darhol oladi
//
// Qolgan hamma narsa O'ZGARMAGAN — copy-paste original kod.
// ─────────────────────────────────────────────────────────────────────────────

const INTERVALS_DAYS = [0, 1, 3, 7, 14, 21, 30, 60];
const MAX_STAGE = 7;
const SESSION_LIMIT = 20;

// Eski konstanta — eksport qilingan, boshqa joyda import bo'lishi mumkin
// endi ishlatilmaydi lekin o'chirmaymiz — breaking change bo'lmasin
const WRONG_ANSWER_REQUEUE_MS = 10 * 60 * 1000;

/**
 * O'quvchi javob bergandan keyin yangi holatni hisoblab beradi.
 */
function computeNextState(wordState, isCorrect) {
  const now = new Date();

  let { stage, consecutiveCorrect, totalReviews, totalCorrect } = wordState;

  totalReviews += 1;

  if (isCorrect) {
    totalCorrect       += 1;
    consecutiveCorrect += 1;
    stage = Math.min(stage + 1, MAX_STAGE);
  } else {
    consecutiveCorrect = 0;
    // SM-2 standart: 2 ta pastga tushirish
    stage = Math.max(0, stage - 2);
  }

  const daysToAdd    = INTERVALS_DAYS[stage] ?? 1;
  const nextReviewAt = new Date(now);

  if (!isCorrect && stage === 0) {
    // ✅ [FIX]: OLDIN: now + WRONG_ANSWER_REQUEUE_MS (10 daqiqa)
    //           KEYIN: now (hozir)
    //   Sabab: getDueWords endi status:'new' ni vaqtga bog'liq bo'lmay oladi.
    //   10 daqiqa kutish o'quvchiga keraksiz to'siq edi.
    nextReviewAt.setTime(now.getTime()); // hozir — o'zgarmaydi amalda
  } else if (!isCorrect) {
    // Noto'g'ri lekin stage > 0 → ertaga — O'ZGARMAGAN
    nextReviewAt.setDate(nextReviewAt.getDate() + 1);
  } else {
    // To'g'ri → intervalga ko'ra — O'ZGARMAGAN
    nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);
  }

  // Status aniqlash — O'ZGARMAGAN
  const status =
    stage === 0  ? 'new'      :
    stage <= 2   ? 'learning' :
    stage <= 5   ? 'review'   :
                   'mastered';

  return {
    stage,
    consecutiveCorrect,
    totalReviews,
    totalCorrect,
    nextReviewAt,
    lastReviewedAt: now,
    status,
  };
}

/**
 * Sessiya uchun so'zlarni tartiblab beradi.
 * O'ZGARMAGAN.
 */
function getSortedSessionWords(words, limit = SESSION_LIMIT) {
  const priority = { learning: 0, new: 1, review: 2, mastered: 3 };
  const sorted = [...words].sort((a, b) => {
    const pa = priority[a.status] ?? 2;
    const pb = priority[b.status] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
  });
  return {
    words:    sorted.slice(0, limit),
    dueCount: words.length,
    hasMore:  words.length > limit,
  };
}

/**
 * getDueWords — O'ZGARMAGAN (StudentVocab eski model uchun)
 */
function getDueWords(words) {
  const now = new Date();
  return words.filter(
    (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
  );
}

/**
 * computeStats — O'ZGARMAGAN
 */
function computeStats(words) {
  const now = new Date();
  return {
    total:    words.length,
    mastered: words.filter((w) => w.status === 'mastered').length,
    learning: words.filter((w) => w.status === 'learning').length,
    review:   words.filter((w) => w.status === 'review').length,
    newWords: words.filter((w) => w.status === 'new').length,
    dueToday: words.filter(
      (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
    ).length,
  };
}

module.exports = {
  computeNextState,
  getSortedSessionWords,
  getDueWords,
  computeStats,
  INTERVALS_DAYS,
  SESSION_LIMIT,
  WRONG_ANSWER_REQUEUE_MS,
};

// /**
//  * SM-2 algoritmi — Ebbinghaus Forgetting Curve + SuperMemo-2 standartlari
//  *
//  * ═══════════════════════════════════════════════════════════════════════════
//  * ASL SM-2 DA NIMA XATO EDI:
//  * ═══════════════════════════════════════════════════════════════════════════
//  *
//  * XATO 1: noto'g'ri javob → stage = 0
//  *   Muammo: o'quvchi 21 kunlik so'zni bir marta bilmasa, bunga qaytadi.
//  *   Bu ruhiy jihatdan qulaymas va SM-2 standartiga zid.
//  *   Tuzatish: noto'g'ri → stage max(0, stage - 2), lekin kam deganda 0.
//  *   Ya'ni 3-bosqichdagi so'z noto'g'ri bo'lsa → 1-bosqichga tushadi, 0 emas.
//  *
//  * XATO 2: limit = 50 qattiq
//  *   Muammo: 102 ta so'z bo'lsa, faqat 50 ta ko'rsatiladi.
//  *   O'quvchi 52 ta so'zni hech qachon ko'rmaydi.
//  *   Tuzatish: limit = 20 (bir sessiya uchun optimal), lekin
//  *   getAllDue() da barcha due so'zlar count saqlanadi.
//  *
//  * XATO 3: noto'g'ri javob → nextReviewAt = bugun (darhol)
//  *   Muammo: noto'g'ri so'z darhol qaytadi → sessiya oxirlanmaydi.
//  *   Tuzatish: noto'g'ri → 10 daqiqadan keyin (learning interval).
//  *
//  * ═══════════════════════════════════════════════════════════════════════════
//  * TO'G'RI SM-2 INTERVAL JADVAL:
//  * ═══════════════════════════════════════════════════════════════════════════
//  *
//  * Stage → Kunlar:
//  *   0 (new)       → 0     (bugun o'rganiladi)
//  *   1             → 1     kun
//  *   2             → 3     kun
//  *   3             → 7     kun   ← learning tugadi, review boshlandi
//  *   4             → 14    kun
//  *   5             → 21    kun
//  *   6             → 30    kun   ← mastered boshlandi
//  *   7             → 60    kun
//  *
//  * Noto'g'ri → stage = max(0, currentStage - 2), 10 daqiqadan keyin qaytadi
//  *
//  * Status:
//  *   stage 0       → 'new'
//  *   stage 1-2     → 'learning'
//  *   stage 3-5     → 'review'
//  *   stage 6-7     → 'mastered'
//  *
//  * ═══════════════════════════════════════════════════════════════════════════
//  * SESSIYA ARXITEKTURASI (getDueWords):
//  * ═══════════════════════════════════════════════════════════════════════════
//  *
//  * OLDIN: .limit(50) — 50 dan ortiq so'z hech ko'rinmaydi
//  *
//  * YANGI:
//  *   - Har sessiya uchun 20 ta so'z (optimal cognitive load)
//  *   - Priority: new > learning > review (yangi so'zlar birinchi o'rganiladi)
//  *   - dueCount: barcha due so'zlar soni (progress ko'rsatish uchun)
//  *   - hasMore: yana so'zlar bormi
//  */

// const INTERVALS_DAYS = [0, 1, 3, 7, 14, 21, 30, 60];
// const MAX_STAGE = 7;
// const SESSION_LIMIT = 20; // Bir sessiya uchun optimal miqdor

// // Noto'g'ri javobda qancha vaqtdan keyin qaytadi (millisekund)
// const WRONG_ANSWER_REQUEUE_MS = 10 * 60 * 1000; // 10 daqiqa

// /**
//  * O'quvchi javob bergandan keyin yangi holatni hisoblab beradi.
//  *
//  * @param {object}  wordState  - mavjud holat
//  * @param {boolean} isCorrect  - to'g'ri javob berdimi?
//  * @returns {object}           - yangilangan maydonlar
//  */
// function computeNextState(wordState, isCorrect) {
//   const now = new Date();

//   let { stage, consecutiveCorrect, totalReviews, totalCorrect } = wordState;

//   totalReviews += 1;

//   if (isCorrect) {
//     totalCorrect     += 1;
//     consecutiveCorrect += 1;
//     stage = Math.min(stage + 1, MAX_STAGE);
//   } else {
//     consecutiveCorrect = 0;
//     // FIX: 0 ga emas, 2 ta pastga tushirish (SM-2 standart)
//     stage = Math.max(0, stage - 2);
//   }

//   // Keyingi takrorlash vaqtini hisoblash
//   const daysToAdd = INTERVALS_DAYS[stage] ?? 1;
//   const nextReviewAt = new Date(now);

//   if (!isCorrect && stage === 0) {
//     // Noto'g'ri va yangi so'z → 10 daqiqadan keyin
//     nextReviewAt.setTime(now.getTime() + WRONG_ANSWER_REQUEUE_MS);
//   } else if (!isCorrect) {
//     // Noto'g'ri lekin stage > 0 → ertaga qaytadi
//     nextReviewAt.setDate(nextReviewAt.getDate() + 1);
//   } else {
//     // To'g'ri → intervalga ko'ra
//     nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);
//   }

//   // Status aniqlash
//   const status =
//     stage === 0       ? 'new'      :
//     stage <= 2        ? 'learning' :
//     stage <= 5        ? 'review'   :
//                         'mastered';

//   return {
//     stage,
//     consecutiveCorrect,
//     totalReviews,
//     totalCorrect,
//     nextReviewAt,
//     lastReviewedAt: now,
//     status,
//   };
// }

// /**
//  * Sessiya uchun so'zlarni tartiblab beradi.
//  * Priority: learning > new > review (tezroq o'rganilayotganlar birinchi)
//  *
//  * @param {Array}  words - PersonalWord massivi
//  * @param {number} limit - sessiya limiti (default 20)
//  * @returns {{ words: Array, dueCount: number, hasMore: boolean }}
//  */
// function getSortedSessionWords(words, limit = SESSION_LIMIT) {
//   const priority = { learning: 0, new: 1, review: 2, mastered: 3 };
//   const sorted = [...words].sort((a, b) => {
//     const pa = priority[a.status] ?? 2;
//     const pb = priority[b.status] ?? 2;
//     if (pa !== pb) return pa - pb;
//     // Bir xil statusda — eng eski nextReviewAt birinchi
//     return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
//   });

//   return {
//     words:    sorted.slice(0, limit),
//     dueCount: words.length,
//     hasMore:  words.length > limit,
//   };
// }

// /**
//  * Bugun takrorlanishi kerak bo'lgan so'zlarni filtrlash
//  */
// function getDueWords(words) {
//   const now = new Date();
//   return words.filter(
//     (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
//   );
// }

// /**
//  * Statistika hisoblash
//  */
// function computeStats(words) {
//   const now = new Date();
//   return {
//     total:    words.length,
//     mastered: words.filter((w) => w.status === 'mastered').length,
//     learning: words.filter((w) => w.status === 'learning').length,
//     review:   words.filter((w) => w.status === 'review').length,
//     newWords: words.filter((w) => w.status === 'new').length,
//     dueToday: words.filter(
//       (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
//     ).length,
//   };
// }

// module.exports = {
//   computeNextState,
//   getSortedSessionWords,
//   getDueWords,
//   computeStats,
//   INTERVALS_DAYS,
//   SESSION_LIMIT,
//   WRONG_ANSWER_REQUEUE_MS,
// };

// // /**
// //  * SM-2 algoritmi — Ebbinghaus Forgetting Curve asosida
// //  *
// //  * Interval jadval (stage → kun):
// //  *   0 (new)      → bugun
// //  *   1            → 1 kun
// //  *   2            → 3 kun
// //  *   3            → 7 kun
// //  *   4            → 14 kun
// //  *   5            → 21 kun
// //  *   6 (mastered) → 30 kun
// //  *   7 (mastered) → 60 kun
// //  *
// //  * To'g'ri javob  → stage oshadi, interval uzayadi
// //  * Noto'g'ri javob → stage 0 ga tushadi, bugundan qaytadi
// //  */

// // const INTERVALS_DAYS = [0, 1, 3, 7, 14, 21, 30, 60];
// // const MAX_STAGE = 7;

// // /**
// //  * O'quvchi javob bergandan keyin yangi holatni hisoblab beradi
// //  *
// //  * @param {object} wordState  - mavjud holat (stage, consecutiveCorrect, ...)
// //  * @param {boolean} isCorrect - to'g'ri javob berdimi?
// //  * @returns {object}          - yangilangan maydonlar
// //  */
// // function computeNextState(wordState, isCorrect) {
// //   const now = new Date();

// //   let { stage, consecutiveCorrect, totalReviews, totalCorrect } = wordState;

// //   totalReviews += 1;

// //   if (isCorrect) {
// //     totalCorrect += 1;
// //     consecutiveCorrect += 1;

// //     // Stage oshirish (max 7 ga)
// //     stage = Math.min(stage + 1, MAX_STAGE);
// //   } else {
// //     // Noto'g'ri — boshlang'ich holatga qaytarish
// //     consecutiveCorrect = 0;
// //     stage = 0;
// //   }

// //   // Keyingi takrorlash sanasini hisoblash
// //   const daysToAdd = INTERVALS_DAYS[stage] ?? 1;
// //   const nextReviewAt = new Date(now);
// //   nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);

// //   // Status aniqlash
// //   let status;
// //   if (stage === 0) {
// //     status = 'new';
// //   } else if (stage < 3) {
// //     status = 'learning';
// //   } else if (stage < 6) {
// //     status = 'review';
// //   } else {
// //     status = 'mastered';
// //   }

// //   return {
// //     stage,
// //     consecutiveCorrect,
// //     totalReviews,
// //     totalCorrect,
// //     nextReviewAt,
// //     lastReviewedAt: now,
// //     status,
// //   };
// // }

// // /**
// //  * Bugun takrorlanishi kerak bo'lgan so'zlarni filtrlash
// //  * (UI da ishlatsangiz ham bo'ladi)
// //  *
// //  * @param {Array} words - wordState massivi
// //  * @returns {Array}
// //  */
// // function getDueWords(words) {
// //   const now = new Date();
// //   return words.filter(
// //     (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
// //   );
// // }

// // /**
// //  * Statistika hisoblash
// //  */
// // function computeStats(words) {
// //   const now = new Date();
// //   return {
// //     total: words.length,
// //     mastered: words.filter((w) => w.status === 'mastered').length,
// //     learning: words.filter((w) => w.status === 'learning').length,
// //     newWords: words.filter((w) => w.status === 'new').length,
// //     dueToday: words.filter(
// //       (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
// //     ).length,
// //   };
// // }

// // module.exports = { computeNextState, getDueWords, computeStats, INTERVALS_DAYS };