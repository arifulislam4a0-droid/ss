# বাংলা স্পিন ওয়েবসাইট ব্যাকেন্ড

## ফিচার
- ইউজার রেজিস্ট্রেশন ও লগইন
- JWT ভিত্তিক ইউজার সিকিউরিটি
- JWT ভিত্তিক এডমিন সিকিউরিটি
- ডিপোজিট/উইড্র রিকোয়েস্ট
- লেনদেন হিস্ট্রি
- স্পিন সিস্টেম
- এডমিন দিয়ে রিকোয়েস্ট প্রসেস
- বিকাশ/নগদ নম্বর ম্যানেজমেন্ট

## চালানোর নিয়ম
1. `.env.example` কপি করে `.env` বানান
2. `npm install`
3. `npm run dev`

## গুরুত্বপূর্ণ নোট
- এডমিন ইউজারনেম/পাসওয়ার্ড শুধু `.env` তে থাকবে
- `CLIENT_BASE_URL` এবং `ADMIN_BASE_URL` আপনার ফ্রন্টএন্ড ডোমেইন অনুযায়ী বসাবেন
- প্রোডাকশনে HTTPS, reverse proxy, logging, monitoring, input validation, audit log, CSRF strategy, backup, এবং database transaction layer আরও শক্ত করতে হবে
