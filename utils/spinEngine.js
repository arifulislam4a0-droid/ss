function buildCycle20() {
  const items = [
    'আবার চেষ্টা করুন', 'আবার চেষ্টা করুন', 'আবার চেষ্টা করুন', 'আবার চেষ্টা করুন', 'আবার চেষ্টা করুন',
    '৫ টাকা', '৫ টাকা', '৫ টাকা', '৫ টাকা',
    '১০ টাকা', '১০ টাকা', '১০ টাকা',
    '২০ টাকা', '২০ টাকা',
    '২৫ টাকা', '২৫ টাকা', '২৫ টাকা',
    '৩০ টাকা', '৩০ টাকা',
    '৪০ টাকা'
  ];

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

function prizeToAmount(prize) {
  const normalizedPrize = String(prize || '').trim();
  const map = {
    'আবার চেষ্টা করুন': 0,
    '৫ টাকা': 5,
    '১০ টাকা': 10,
    '২০ টাকা': 20,
    '২৫ টাকা': 25,
    '৩০ টাকা': 30,
    '৪০ টাকা': 40,
    '৬০ টাকা': 60,
    '১০০ টাকা': 100,
    '১০০০ টাকা': 1000
  };
  return map[normalizedPrize] ?? 0;
}

function randomOfferDelay() {
  return 1 + Math.floor(Math.random() * 5);
}

function resolveOffer(user) {
  const has100 = Number(user.offer100Count) > 0;
  const has60 = Number(user.offer60Count) > 0;
  if (!has100 && !has60) {
    user.offerDelay = null;
    return null;
  }
  if (user.offerDelay === null || typeof user.offerDelay !== 'number') {
    user.offerDelay = randomOfferDelay();
    return null;
  }
  if (user.offerDelay > 0) {
    user.offerDelay -= 1;
    return null;
  }
  let prize;
  if (has100 && has60) {
    const count100 = Number(user.offer100Count);
    const count60 = Number(user.offer60Count);
    if (count60 > count100) {
      prize = '৬০ টাকা';
    } else if (count100 > count60) {
      prize = '১০০ টাকা';
    } else {
      prize = '১০০ টাকা';
    }
  } else if (has100) {
    prize = '১০০ টাকা';
  } else {
    prize = '৬০ টাকা';
  }
  if (prize === '১০০ টাকা') {
    user.offer100Count = Math.max(0, Number(user.offer100Count) - 1);
  } else {
    user.offer60Count = Math.max(0, Number(user.offer60Count) - 1);
  }
  if (user.offer100Count > 0 || user.offer60Count > 0) {
    user.offerDelay = randomOfferDelay();
  } else {
    user.offerDelay = null;
  }
  return prize;
}

function nextSpin(user, config) {
  const offerPrize = resolveOffer(user);
  if (offerPrize) {
    return {
      prize: offerPrize,
      amount: prizeToAmount(offerPrize),
      isOffer: true
    };
  }

  if (!Array.isArray(config.globalSpinCycle20) || config.globalSpinCycle20.length === 0) {
    config.globalSpinCycle20 = buildCycle20();
  }

  const upcomingGlobalCount = (config.globalSpinCount || 0) + 1;
  let prize;
  if (upcomingGlobalCount % 60 === 0) {
    prize = '৬০ টাকা';
  } else {
    prize = config.globalSpinCycle20.shift();
    if (!config.globalSpinCycle20.length) {
      config.globalSpinCycle20 = buildCycle20();
    }
  }

  return {
    prize,
    amount: prizeToAmount(prize),
    isOffer: false
  };
}

module.exports = { buildCycle20, prizeToAmount, nextSpin };