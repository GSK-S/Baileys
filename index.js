const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// مفتاح المطور لإضافة مستخدمين
const DEV_KEY = "ginsak";

// مجلد المستخدمين
const usersDir = path.join(__dirname, 'users');
if (!fs.existsSync(usersDir)) fs.mkdirSync(usersDir);

// قراءة بيانات المستخدمين
function readUsersData() {
  const file = path.join(__dirname, 'users.json');
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ users: [] }, null, 2));
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// حفظ بيانات المستخدمين
function saveUsersData(data) {
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(data, null, 2), 'utf-8');
}

// إنشاء ملف أسئلة لمستخدم
function getUserFile(userId) {
  return path.join(usersDir, `${userId}.json`);
}

// قراءة أسئلة المستخدم
function readUserQuestions(userId) {
  const file = getUserFile(userId);
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([]), 'utf-8');
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// حفظ أسئلة المستخدم
function saveUserQuestions(userId, questions) {
  fs.writeFileSync(getUserFile(userId), JSON.stringify(questions, null, 2), 'utf-8');
}

// --- إضافة مستخدم جديد (المطور فقط) ---
app.post('/add-user', (req, res) => {
  const { devKey, userId, apiKey } = req.body;

  if (devKey !== DEV_KEY) return res.status(401).json({ error: "مفتاح المطور غير صحيح" });
  if (!userId || !apiKey) return res.status(400).json({ error: "يرجى تحديد userId و apiKey" });

  const data = readUsersData();
  if (data.users.find(u => u.userId === userId)) {
    return res.status(400).json({ error: "المستخدم موجود بالفعل" });
  }

  data.users.push({ userId, apiKey });
  saveUsersData(data);

  // إنشاء ملف أسئلة فارغ للمستخدم
  saveUserQuestions(userId, []);

  res.json({ message: "تم إنشاء المستخدم بنجاح", userId, apiKey });
});

// --- سحب سؤال عشوائي لمستخدم ---
app.get('/question/:userId', (req, res) => {
  const { userId } = req.params;
  const apiKey = req.query.apiKey;

  const data = readUsersData();
  const user = data.users.find(u => u.userId === userId && u.apiKey === apiKey);

  if (!user) return res.status(401).json({ error: "API Key غير صحيح أو المستخدم غير موجود" });

  const questions = readUserQuestions(userId);
  if (questions.length === 0) return res.json({ question: null });

  const randomIndex = Math.floor(Math.random() * questions.length);
  res.json({ question: questions[randomIndex] });
});

// --- إضافة سؤال جديد لمستخدم ---
app.post('/add-question/:userId', (req, res) => {
  const { userId } = req.params;
  const { apiKey, question } = req.body;

  const data = readUsersData();
  const user = data.users.find(u => u.userId === userId && u.apiKey === apiKey);

  if (!user) return res.status(401).json({ error: "API Key غير صحيح أو المستخدم غير موجود" });
  if (!question || question.trim() === "") return res.status(400).json({ error: "لا يمكن إضافة سؤال فارغ" });

  const questions = readUserQuestions(userId);
  questions.push(question);
  saveUserQuestions(userId, questions);

  res.json({ message: "تم إضافة السؤال بنجاح", questions });
});

// --- عرض جميع الأسئلة مع أرقامها ---
app.get('/list-questions/:userId', (req, res) => {
    const { userId } = req.params;
    const apiKey = req.query.apiKey;

    const data = readUsersData();
    const user = data.users.find(u => u.userId === userId && u.apiKey === apiKey);

    if (!user) return res.status(401).json({ error: "API Key غير صحيح أو المستخدم غير موجود" });

    const questions = readUserQuestions(userId);
    const numbered = questions.map((q, i) => ({ index: i + 1, question: q }));
    res.json({ questions: numbered });
});
// --- التحقق من المستخدم ---
app.post('/verification', (req, res) => {
    const { userId, apiKey } = req.body;

    if (!userId || !apiKey) {
        return res.status(400).json({ error: "يرجى تحديد userId و apiKey" });
    }

    const data = readUsersData();
    const user = data.users.find(u => u.userId === userId && u.apiKey === apiKey);

    res.json({ verified: !!user });
});
// --- حذف سؤال حسب الرقم ---
app.post('/delete-question/:userId', (req, res) => {
    const { userId } = req.params;
    const { apiKey, number } = req.body;

    const data = readUsersData();
    const user = data.users.find(u => u.userId === userId && u.apiKey === apiKey);

    if (!user) return res.status(401).json({ error: "API Key غير صحيح أو المستخدم غير موجود" });

    const questions = readUserQuestions(userId);

    if (number < 1 || number > questions.length) {
        return res.status(400).json({ error: "رقم السؤال غير صالح" });
    }

    const removed = questions.splice(number - 1, 1);
    saveUserQuestions(userId, questions);

    res.json({ message: `تم حذف السؤال رقم ${number}: "${removed[0]}"`, questions });
});


app.listen(port, () => {
  console.log(`API شغالة على http://localhost:${port}`);
});
