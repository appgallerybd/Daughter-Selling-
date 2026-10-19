import type { AppData } from '../types';

/**
 * প্রথমবার অ্যাপ খোলার সময় দেখানোর জন্য নমুনা হিসাব।
 * সেটিংস থেকে এক ক্লিকে মুছে নিজের ডেটা লেখা যাবে।
 */
export function seedData(): AppData {
  const event = {
    title: 'তানিয়া ও রাফিদের বিয়ে',
    bride: 'তানিয়া আক্তার',
    groom: 'রাফিদ রহমান',
    date: '2026-12-12',
    venue: 'গ্রীন ভিউ কমিউনিটি সেন্টার, ঢাকা',
    target: 250000,
    budget: 180000,
  };

  const rows: [
    string,
    AppData['contributions'][number]['relation'],
    AppData['contributions'][number]['side'],
    AppData['contributions'][number]['method'],
    number,
    number,
    string,
  ][] = [
    ['মোঃ শাহজাহান', 'relative', 'groom', 'cash', 25000, 30000, '2026-10-01'],
    ['রেহানা বেগম', 'relative', 'bride', 'bkash', 15000, 15000, '2026-10-02'],
    ['ডা. কামরুল হাসান', 'relative', 'bride', 'bank', 20000, 20000, '2026-10-02'],
    ['সাবরিনা আক্তার', 'friend', 'bride', 'bkash', 5000, 5000, '2026-10-03'],
    ['হাসান মাহমুদ', 'friend', 'groom', 'cash', 3000, 3000, '2026-10-04'],
    ['রফিকুল ইসলাম', 'neighbour', 'groom', 'cash', 2000, 2000, '2026-10-04'],
    ['নাসরিন সুলতানা', 'colleague', 'bride', 'nagad', 4000, 4000, '2026-10-05'],
    ['ইমরান খান', 'friend', 'groom', 'bkash', 6000, 6000, '2026-10-06'],
    ['জাহিদ হাসান', 'colleague', 'groom', 'cash', 3500, 5000, '2026-10-06'],
    ['শারমিন আক্তার', 'relative', 'bride', 'cash', 2500, 2500, '2026-10-07'],
    ['অধ্যাপক আব্দুল কাদের', 'teacher', 'bride', 'cheque', 10000, 10000, '2026-10-07'],
    ['মাহফুজা বেগম', 'relative', 'groom', 'cash', 8000, 8000, '2026-10-08'],
    ['সেলিম রেজা', 'relative', 'bride', 'bank', 12000, 15000, '2026-10-09'],
    ['নাফিসা তাহমিন', 'friend', 'bride', 'bkash', 3000, 3000, '2026-10-09'],
    ['তারিকুল ইসলাম', 'colleague', 'groom', 'nagad', 5000, 5000, '2026-10-10'],
    ['বাবুল আক্তার', 'neighbour', 'groom', 'cash', 2500, 2500, '2026-10-11'],
    ['মিতা রানী দাস', 'neighbour', 'bride', 'cash', 5000, 5000, '2026-10-11'],
    ['সুমন চন্দ্র সাহা', 'friend', 'groom', 'bkash', 4000, 4000, '2026-10-12'],
    ['আরিফুল ইসলাম', 'relative', 'groom', 'cash', 7000, 7000, '2026-10-13'],
    ['নাজমুল হুদা', 'colleague', 'bride', 'rocket', 2000, 2000, '2026-10-13'],
    ['ফরিদা ইয়াসমিন', 'relative', 'bride', 'cash', 3500, 3500, '2026-10-14'],
    ['শাহিন আলম', 'friend', 'groom', 'bank', 6000, 6000, '2026-10-15'],
    ['রুমা পারভীন', 'colleague', 'bride', 'bkash', 2500, 2500, '2026-10-15'],
    ['তানভীর আহমেদ', 'friend', 'groom', 'cash', 4500, 5000, '2026-10-16'],
    ['কামরুন নাহার', 'relative', 'bride', 'nagad', 5000, 5000, '2026-10-17'],
    ['সাইফুল ইসলাম', 'teacher', 'groom', 'cash', 3000, 3000, '2026-10-17'],
  ];

  const expenses: AppData['expenses'] = [
    ['ক্যাটারিং অগ্রিম', 'food', 35000, '2026-09-20', 'রুচি ক্যাটারিং'],
    ['কমিউনিটি সেন্টার বুকিং', 'venue', 25000, '2026-09-22', 'গ্রীন ভিউ'],
    ['প্যান্ডেল ও ফুলের সাজ', 'decor', 8000, '2026-10-02', 'নিউ ডেকোরেটর'],
    ['কনের লেহেঙ্গা', 'clothing', 12000, '2026-10-05', 'বসুন্ধরা শপিং সিটি'],
    ['বরের শেরওয়ানি', 'clothing', 6000, '2026-10-06', 'আড়ং'],
    ['আংটি ও গহনা', 'jewelry', 10000, '2026-10-08', 'পল্লী জুয়েলার্স'],
    ['ফটোগ্রাফি প্যাকেজ (অগ্রিম)', 'photo', 10000, '2026-10-10', 'স্টুডিও লেন্স'],
    ['বাদ্যদল ও গায়ক', 'music', 3000, '2026-10-12', 'সুর বাদ্যদল'],
    ['গাড়ি ভাড়া (অগ্রিম)', 'transport', 3000, '2026-10-14', 'রেন্ট-এ-কার'],
    ['অতিথি কার্ড ছাপা', 'other', 2500, '2026-10-15', 'প্রিন্ট পয়েন্ট'],
  ].map((item, index) => ({
    id: `e${index + 1}`,
    title: item[0] as string,
    category: item[1] as AppData['expenses'][number]['category'],
    amount: item[2] as number,
    date: item[3] as string,
    paidTo: item[4] as string,
    note: '',
  }));

  return {
    version: 1,
    event,
    contributions: rows.map((row, index) => ({
      id: `c${index + 1}`,
      name: row[0],
      phone: '',
      relation: row[1],
      side: row[2],
      method: row[3],
      amount: row[4],
      pledged: row[5],
      date: row[6],
      note: '',
    })),
    expenses,
  };
}
