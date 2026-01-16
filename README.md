# Azkar Generator

مولّد أذكار بصيغة “ستوري” (صورة واحدة 1080×1920) مع:

- اختيار التصنيف (مثل أذكار الصباح/المساء/النوم…)
- تصاميم عشوائية عند كل توليد
- تصدير PNG و JPG

## التشغيل محلياً

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
npm run preview
```

## النشر على GitHub Pages

- Workflow موجود في `.github/workflows/deploy.yml` ويعمل عند push إلى `main`.
- تأكد من إعداد Pages على: **GitHub Actions**.

ملاحظة: تم ضبط `base` في Vite ليتوافق مع اسم المستودع `/Azkar-Generator/`.

## مصدر البيانات

بيانات الأذكار مأخوذة من مشروع ATHAR:

- https://github.com/xgharibx/ATHAR

