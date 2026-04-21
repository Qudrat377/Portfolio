/**
 * SM-2 algoritmi — Ebbinghaus Forgetting Curve asosida
 *
 * Interval jadval (stage → kun):
 *   0 (new)      → bugun
 *   1            → 1 kun
 *   2            → 3 kun
 *   3            → 7 kun
 *   4            → 14 kun
 *   5            → 21 kun
 *   6 (mastered) → 30 kun
 *   7 (mastered) → 60 kun
 *
 * To'g'ri javob  → stage oshadi, interval uzayadi
 * Noto'g'ri javob → stage 0 ga tushadi, bugundan qaytadi
 */

const INTERVALS_DAYS = [0, 1, 3, 7, 14, 21, 30, 60];
const MAX_STAGE = 7;

/**
 * O'quvchi javob bergandan keyin yangi holatni hisoblab beradi
 *
 * @param {object} wordState  - mavjud holat (stage, consecutiveCorrect, ...)
 * @param {boolean} isCorrect - to'g'ri javob berdimi?
 * @returns {object}          - yangilangan maydonlar
 */
function computeNextState(wordState, isCorrect) {
  const now = new Date();

  let { stage, consecutiveCorrect, totalReviews, totalCorrect } = wordState;

  totalReviews += 1;

  if (isCorrect) {
    totalCorrect += 1;
    consecutiveCorrect += 1;

    // Stage oshirish (max 7 ga)
    stage = Math.min(stage + 1, MAX_STAGE);
  } else {
    // Noto'g'ri — boshlang'ich holatga qaytarish
    consecutiveCorrect = 0;
    stage = 0;
  }

  // Keyingi takrorlash sanasini hisoblash
  const daysToAdd = INTERVALS_DAYS[stage] ?? 1;
  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);

  // Status aniqlash
  let status;
  if (stage === 0) {
    status = 'new';
  } else if (stage < 3) {
    status = 'learning';
  } else if (stage < 6) {
    status = 'review';
  } else {
    status = 'mastered';
  }

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
 * Bugun takrorlanishi kerak bo'lgan so'zlarni filtrlash
 * (UI da ishlatsangiz ham bo'ladi)
 *
 * @param {Array} words - wordState massivi
 * @returns {Array}
 */
function getDueWords(words) {
  const now = new Date();
  return words.filter(
    (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
  );
}

/**
 * Statistika hisoblash
 */
function computeStats(words) {
  const now = new Date();
  return {
    total: words.length,
    mastered: words.filter((w) => w.status === 'mastered').length,
    learning: words.filter((w) => w.status === 'learning').length,
    newWords: words.filter((w) => w.status === 'new').length,
    dueToday: words.filter(
      (w) => w.status !== 'mastered' && new Date(w.nextReviewAt) <= now
    ).length,
  };
}

module.exports = { computeNextState, getDueWords, computeStats, INTERVALS_DAYS };