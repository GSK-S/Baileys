# استخدم Node.js رسمي
FROM node:20-alpine

# إنشاء مجلد التطبيق داخل الحاوية
WORKDIR /app

# نسخ ملفات المشروع
COPY package*.json ./
RUN npm install

COPY . .

# إنشاء مجلد users لو لم يكن موجود
RUN mkdir -p users

# كشف البورت الذي سيستمع عليه Render
EXPOSE 3000

# أمر تشغيل السيرفر
CMD ["node", "index.js"]
