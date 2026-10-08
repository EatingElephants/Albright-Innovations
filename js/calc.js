/* Albright Innovations: calculator math.
   Every number the tools show comes from the functions in this file and nothing else.
   No DOM, no formatting side effects, so it can be tested on its own (see /tests/calc.html).
   The plain-English versions of these formulas sit under each tool on the homepage. */
(function (root) {
  'use strict';

  var WEEKS_PER_YEAR = 52;      // a year of weeks
  var HOURS_PER_WORK_WEEK = 40; // used for the "full work weeks" equivalent
  var HOURS_PER_WORK_DAY = 8;
  var MONTHS_PER_YEAR = 12;

  function clamp(n, lo, hi) {
    n = Number(n);
    if (!isFinite(n)) { n = 0; }
    return Math.min(hi, Math.max(lo, n));
  }
  /* money and counts are rounded to cents so 0.4 * 624 doesn't come out as 249.60000000000002 */
  function r2(n) { return Math.round(n * 100) / 100; }
  function whole(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); }

  /* ---------- Tool A: Where does your week go? ---------- */
  var TIME_KEYS = ['quotes', 'sched', 'invoice', 'retype', 'social'];
  var TIME_LABELS = {
    quotes: 'Quotes and estimates',
    sched: 'Scheduling and callbacks',
    invoice: 'Invoicing and payments',
    retype: 'Retyping information',
    social: 'Social and website'
  };

  function timeLeaks(input) {
    input = input || {};
    var hours = {}, week = 0, i, k;
    for (i = 0; i < TIME_KEYS.length; i++) {
      k = TIME_KEYS[i];
      hours[k] = clamp(input[k], 0, 168);
      week += hours[k];
    }
    var rate = clamp(input.rate, 0, 100000);
    var year = r2(week * WEEKS_PER_YEAR);
    var dollars = r2(year * rate);
    var shares = {}, biggest = null;
    for (i = 0; i < TIME_KEYS.length; i++) {
      k = TIME_KEYS[i];
      shares[k] = week > 0 ? hours[k] / week : 0;
      if (biggest === null || hours[k] > hours[biggest]) { biggest = k; }
    }
    return {
      hours: hours,
      week: week,
      year: year,
      rate: rate,
      dollars: dollars,
      workWeeks: year / HOURS_PER_WORK_WEEK,
      workDays: year / HOURS_PER_WORK_DAY,
      shares: shares,
      biggest: week > 0 ? biggest : null
    };
  }

  function timeEquivalent(r) {
    if (r.week <= 0) { return 'Slide a few of these to where you land in a normal week.'; }
    if (r.workWeeks >= 2) { return 'That’s about <strong>' + whole(r.workWeeks) + ' full work weeks</strong> a year spent on the office side of the business.'; }
    if (r.workDays >= 1) { return 'That’s about <strong>' + num(r.workDays) + ' working days</strong> a year on the office side of the business.'; }
    return 'That’s about <strong>' + num(r.year) + ' hours</strong> a year on the office side of the business.';
  }

  /* ---------- Tool B: Missed calls ---------- */
  function missedCalls(input) {
    input = input || {};
    var calls = clamp(input.calls, 0, 100000);
    var missed = clamp(input.missed, 0, 100) / 100;
    var value = clamp(input.value, 0, 10000000);
    var close = clamp(input.close, 0, 100) / 100;
    var missedWeek = r2(calls * missed);
    var missedYear = r2(missedWeek * WEEKS_PER_YEAR);
    var jobsYear = r2(missedYear * close);
    var revenueYear = r2(jobsYear * value);
    return {
      calls: calls, missedShare: missed, value: value, closeShare: close,
      missedWeek: missedWeek,
      missedMonth: r2(missedYear / MONTHS_PER_YEAR),
      missedYear: missedYear,
      jobsMonth: r2(jobsYear / MONTHS_PER_YEAR),
      jobsYear: jobsYear,
      revenueMonth: r2(revenueYear / MONTHS_PER_YEAR),
      revenueYear: revenueYear
    };
  }

  function callsEquivalent(r) {
    if (r.calls <= 0) { return 'Start with how many calls come in during a normal week.'; }
    if (r.missedYear <= 0) { return 'If you really answer every call, there’s nothing at risk here. Most businesses miss more than they think.'; }
    if (r.revenueYear <= 0) { return 'About <strong>' + num(r.missedMonth) + ' missed calls a month</strong>. Add a job value to see what they’re worth.'; }
    return 'About <strong>' + money(r.revenueMonth) + ' a month</strong> riding on calls nobody picked up.';
  }

  /* ---------- Tool C: Operations checkup ---------- */
  /* questions: [{ weight, good, fix, why, service }]   answers: ['yes' | 'no' | 'partly' | null] */
  var LABELS = [
    { min: 90, label: 'Well run', blurb: 'Your systems are doing the remembering. The fixes below are small, and most owners at this level put their time into marketing next.' },
    { min: 70, label: 'Well run, a few gaps', blurb: 'The bones are good. A few steps still depend on someone remembering, and those are usually quick to close.' },
    { min: 40, label: 'Good bones, leaking time', blurb: 'The work gets done, but a lot of it leans on you. Connecting a few pieces would hand back hours every week.' },
    { min: 0, label: 'Running on willpower', blurb: 'Most of this business lives in your head and your phone. That works until you take a day off. The three fixes below are where we’d start.' }
  ];

  function checkup(questions, answers) {
    var total = 0, score = 0, gaps = [], i, q, a, credit;
    for (i = 0; i < questions.length; i++) {
      q = questions[i];
      a = answers[i] || null;
      total += q.weight;
      if (a === q.good) { credit = q.weight; }
      else if (a === 'partly') { credit = q.weight / 2; }
      else { credit = 0; }
      score += credit;
      if (credit < q.weight) { gaps.push({ index: i, lost: q.weight - credit, fix: q.fix, why: q.why, service: q.service, side: q.side || '' }); }
    }
    var pct = total > 0 ? Math.round(score / total * 100) : 0;
    gaps.sort(function (x, y) { return y.lost - x.lost || x.index - y.index; });
    var band = LABELS[LABELS.length - 1];
    for (i = 0; i < LABELS.length; i++) { if (pct >= LABELS[i].min) { band = LABELS[i]; break; } }
    return { score: pct, label: band.label, blurb: band.blurb, fixes: pickFixes(gaps, 3), answered: answers.filter(function (x) { return !!x; }).length, total: questions.length };
  }

  /* The biggest gaps first, but every side of the business with a gap (operations, marketing)
     gets at least one spot, so a low-weight marketing gap isn't always crowded out. */
  function pickFixes(gaps, n) {
    var picked = gaps.slice(0, n), j, k, side, count;
    for (j = 0; j < gaps.length; j++) {
      side = gaps[j].side;
      if (!side || picked.some(function (f) { return f.side === side; })) { continue; }
      for (k = picked.length - 1; k >= 0; k--) {
        count = picked.filter(function (f) { return f.side === picked[k].side; }).length;
        if (count > 1) { picked[k] = gaps[j]; break; }
      }
    }
    return picked;
  }

  /* ---------- formatting ---------- */
  function num(n) {
    n = Number(n) || 0;
    var abs = Math.abs(n);
    var rounded = abs >= 100 ? Math.round(n) : abs >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 10) / 10;
    if (abs >= 100 || Math.abs(rounded - Math.round(rounded)) < 0.05) { rounded = Math.round(rounded); }
    return rounded.toLocaleString('en-US');
  }
  function money(n) {
    n = Number(n) || 0;
    return (n < 0 ? '-$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-US');
  }
  function pct(share) { return Math.round(share * 100) + '%'; }

  var Calc = {
    TIME_KEYS: TIME_KEYS, TIME_LABELS: TIME_LABELS,
    timeLeaks: timeLeaks, timeEquivalent: timeEquivalent,
    missedCalls: missedCalls, callsEquivalent: callsEquivalent,
    checkup: checkup, LABELS: LABELS,
    num: num, money: money, pct: pct, clamp: clamp
  };
  root.Calc = Calc;
  if (typeof module !== 'undefined' && module.exports) { module.exports = Calc; }
})(typeof window !== 'undefined' ? window : this);
