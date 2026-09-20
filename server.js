require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const Razorpay = require("razorpay");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 24) {
  throw new Error("JWT_SECRET must be set and at least 24 characters long");
}

const dataDir = path.join(__dirname, "data");
const privateMediaDir = path.join(__dirname, "private-media");
const assetsDir = path.join(__dirname, "assets");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(privateMediaDir, { recursive: true });
const db = new Database(path.join(dataDir, "platform.db"));
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE, phone TEXT,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '', price_paise INTEGER NOT NULL DEFAULT 0,
    thumbnail_url TEXT, published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT, module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('video','pdf','article')), title TEXT NOT NULL,
    url TEXT NOT NULL, duration_seconds INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE, amount_paise INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'created',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, course_id)
  );
  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    completed INTEGER NOT NULL DEFAULT 0, position_seconds INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, content_id)
  );
`);
const userColumns = db.prepare("PRAGMA table_info(users)").all().map(column => column.name);
if (!userColumns.includes("username")) db.exec("ALTER TABLE users ADD COLUMN username TEXT UNIQUE");
if (!userColumns.includes("phone")) db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
// Keep upgrades non-destructive for installations created by an earlier version.
const topicColumns = db.prepare("PRAGMA table_info(topics)").all().map(column => column.name);
for (const [name, definition] of [
  ["description", "TEXT"],
  ["objectives", "TEXT"],
  ["thumbnail_url", "TEXT"]
]) {
  if (!topicColumns.includes(name)) db.exec(`ALTER TABLE topics ADD COLUMN ${name} ${definition}`);
}

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM courses").get().n;
  if (count) return;
  const insertCourse = db.prepare("INSERT INTO courses(slug,title,description,price_paise,published) VALUES(?,?,?,?,1)");
  const insertModule = db.prepare("INSERT INTO modules(course_id,title,position) VALUES(?,?,?)");
  const insertTopic = db.prepare("INSERT INTO topics(module_id,title,position) VALUES(?,?,?)");
  const insertContent = db.prepare("INSERT INTO contents(topic_id,type,title,url,position) VALUES(?,?,?,?,?)");
  const add = db.transaction(() => {
    const courses = [
      ["professional-accountant", "Professional Accountant", "Practical accounting, Tally Prime, GST and Excel.", 1299900],
      ["tally-prime-gst", "Tally Prime + GST", "Master accounting software and GST workflows.", 99900],
      ["gst-income-tax", "GST & Income Tax", "Compliance skills for modern accountants.", 79900],
      ["advanced-excel", "Advanced Excel", "Build decision-ready accounting dashboards.", 59900]
    ];
    courses.forEach((course, ci) => {
      const courseId = insertCourse.run(...course).lastInsertRowid;
      const moduleId = insertModule.run(courseId, ci === 0 ? "Accounting foundations" : "Course lessons", 1).lastInsertRowid;
      const topicId = insertTopic.run(moduleId, "Getting started", 1).lastInsertRowid;
      insertContent.run(topicId, "video", "Welcome and course overview", "https://example.com/videos/welcome.mp4", 1);
      insertContent.run(topicId, "pdf", "Course workbook", "https://example.com/resources/workbook.pdf", 2);
    });
  });
  add();
}
seed();
function syncAssetPdfs() {
  const course = db.prepare("SELECT id FROM courses WHERE slug='tally-prime-gst'").get();
  if (!course || !fs.existsSync(assetsDir)) return;
  let module = db.prepare("SELECT id FROM modules WHERE course_id=? AND title='Study Material'").get(course.id);
  if (!module) module = { id: db.prepare("INSERT INTO modules(course_id,title,position) VALUES(?,?,?)").run(course.id, "Study Material", 99).lastInsertRowid };
  const pdfs = fs.readdirSync(assetsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf")
    .map(entry => entry.name)
    .sort((left, right) => {
      const number = name => Number((name.match(/(?:exercise[\s-]*)?(\d+)/i) || [0, 0])[1]);
      return number(left) - number(right);
    });
  pdfs.forEach((fileName, index) => {
    const existing = db.prepare("SELECT id FROM contents WHERE url=?").get(`local:assets/${fileName}`);
    const topic = db.prepare("SELECT id FROM topics WHERE module_id=? AND title=?").get(module.id, path.basename(fileName, ".pdf"));
    const topicId = topic ? topic.id : db.prepare("INSERT INTO topics(module_id,title,description,position) VALUES(?,?,?,?)")
      .run(module.id, path.basename(fileName, ".pdf"), "Practical study material for the Tally Prime course.", index + 1).lastInsertRowid;
    if (existing) {
      db.prepare("UPDATE contents SET position=? WHERE id=?").run(index + 1, existing.id);
      db.prepare("UPDATE topics SET position=? WHERE id=?").run(index + 1, topicId);
      return;
    }
    db.prepare("INSERT INTO contents(topic_id,type,title,url,position) VALUES(?,?,?,?,?)")
      .run(topicId, "pdf", fileName, `local:assets/${fileName}`, index + 1);
  });
}
syncAssetPdfs();
if (process.env.ADMIN_PASSWORD) {
  const adminId = String(process.env.ADMIN_ID || "admin").trim().toLowerCase();
  const adminEmail = String(process.env.ADMIN_EMAIL || `${adminId}@tallywithtax.local`).trim().toLowerCase();
  const existingAdmin = db.prepare("SELECT id FROM users WHERE username=? OR email=?").get(adminId, adminEmail);
  if (!existingAdmin) {
    db.prepare("INSERT INTO users(name,email,username,password_hash,role) VALUES(?,?,?,?, 'admin')")
      .run("Platform administrator", adminEmail, adminId, bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12));
  } else {
    db.prepare("UPDATE users SET username=? WHERE id=? AND role='admin'").run(adminId, existingAdmin.id);
  }
}

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

function publicUser(user) { return { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role }; }
function tokenFor(user) { return jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: "7d" }); }
function auth(req, res, next) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
  try { req.user = jwt.verify(value.slice(7), JWT_SECRET); next(); }
  catch (_) { return res.status(401).json({ error: "Invalid or expired token" }); }
}
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access required" });
  next();
}
function integer(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
function courseTree(courseId, includeUnpublished = false) {
  const course = db.prepare(`SELECT id,slug,title,description,price_paise,thumbnail_url,published FROM courses WHERE (id = ? OR slug = ?) ${includeUnpublished ? "" : "AND published=1"}`).get(courseId, String(courseId));
  if (!course) return null;
  course.price = course.price_paise / 100;
  course.modules = db.prepare("SELECT * FROM modules WHERE course_id=? ORDER BY position,id").all(course.id);
  course.modules.forEach(module => {
    module.topics = db.prepare("SELECT * FROM topics WHERE module_id=? ORDER BY position,id").all(module.id);
    module.topics.forEach(topic => { topic.contents = db.prepare("SELECT id,type,title,duration_seconds,position FROM contents WHERE topic_id=? ORDER BY position,id").all(topic.id); });
  });
  return course;
}
function isLocalMediaUrl(value) {
  return typeof value === "string" && !/^(?:https?:|data:|javascript:)/i.test(value);
}
function mediaPathFor(value) {
  if (!isLocalMediaUrl(value)) return null;
  const relative = value.replace(/^local:/i, "").replace(/^[/\\]+/, "");
  if (relative.toLowerCase().startsWith("assets/")) {
    const assetPath = path.resolve(assetsDir, relative.slice("assets/".length));
    return assetPath.startsWith(`${assetsDir}${path.sep}`) && path.extname(assetPath).toLowerCase() === ".pdf" ? assetPath : null;
  }
  const roots = [privateMediaDir, __dirname];
  for (const root of roots) {
    const resolved = path.resolve(root, relative);
    if (resolved.startsWith(`${root}${path.sep}`) && (root === privateMediaDir || path.extname(resolved).toLowerCase() === ".pdf")) return resolved;
  }
  return null;
}
function protectedContent(content) {
  const result = { id: content.id, type: content.type, title: content.title, duration_seconds: content.duration_seconds, position: content.position };
  if (isLocalMediaUrl(content.url)) result.streamUrl = `/api/my/content/${content.id}/stream`;
  else result.url = content.url;
  return result;
}

app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: "Name, email and a password of 8+ characters are required" });
  try {
    const result = db.prepare("INSERT INTO users(name,email,phone,password_hash) VALUES(?,?,?,?)").run(String(name).trim(), String(email).trim().toLowerCase(), String(phone || "").trim(), bcrypt.hashSync(password, 12));
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(result.lastInsertRowid);
    res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
  } catch (error) { res.status(error.code === "SQLITE_CONSTRAINT_UNIQUE" ? 409 : 400).json({ error: "Email is already registered" }); }
});
app.post("/api/auth/login", (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || "").trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email=? OR username=?").get(identifier, identifier);
  if (!user || !bcrypt.compareSync(String(req.body.password || ""), user.password_hash)) return res.status(401).json({ error: "Invalid email or password" });
  res.json({ user: publicUser(user), token: tokenFor(user) });
});
app.get("/api/auth/me", auth, (req, res) => res.json({ user: publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id)) }));
app.get("/api/admin/dashboard", auth, adminOnly, (req, res) => {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  res.json({ role: "ADMIN", courses: count("courses"), students: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role='student'").get().count, enrollments: db.prepare("SELECT COUNT(*) AS count FROM purchases WHERE status='paid'").get().count, payments: count("purchases"), content: count("contents") });
});
app.get("/api/admin/students", auth, adminOnly, (req, res) => {
  res.json(db.prepare("SELECT id,name,email,phone,created_at FROM users WHERE role='student' ORDER BY created_at DESC").all());
});
app.get("/api/admin/enrollments", auth, adminOnly, (req, res) => {
  res.json(db.prepare(`SELECT p.id,p.user_id,u.name student_name,u.email,u.phone,c.title course_title,
    p.amount_paise,p.status,p.created_at
    FROM purchases p JOIN users u ON u.id=p.user_id JOIN courses c ON c.id=p.course_id
    ORDER BY p.created_at DESC`).all().map(item => ({ ...item, amount: item.amount_paise / 100 })));
});

app.get("/api/courses", (req, res) => {
  const rows = db.prepare("SELECT id,slug,title,description,price_paise,thumbnail_url FROM courses WHERE published=1 ORDER BY created_at DESC").all();
  res.json(rows.map(c => ({ ...c, price: c.price_paise / 100 })));
});
app.get("/api/courses/:id", (req, res) => {
  const course = courseTree(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

app.post("/api/payments/orders", auth, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE (id=? OR slug=?) AND published=1").get(req.body.courseId, String(req.body.courseId));
  if (!course) return res.status(404).json({ error: "Course not found" });
  if (!razorpay) return res.status(503).json({ error: "Payments are not configured" });
  const existing = db.prepare("SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='paid'").get(req.user.id, course.id);
  if (existing) return res.status(409).json({ error: "Course already purchased" });
  try {
    const order = razorpay.orders.create({ amount: course.price_paise, currency: "INR", receipt: `course_${course.id}_user_${req.user.id}` });
    Promise.resolve(order).then(created => {
      db.prepare("INSERT INTO purchases(user_id,course_id,razorpay_order_id,amount_paise,status) VALUES(?,?,?,?,?)").run(req.user.id, course.id, created.id, course.price_paise, "created");
      res.status(201).json({ orderId: created.id, amount: created.amount, currency: created.currency, keyId: process.env.RAZORPAY_KEY_ID });
    }).catch(() => res.status(502).json({ error: "Unable to create payment order" }));
  } catch (_) { res.status(502).json({ error: "Unable to create payment order" }); }
});
app.post("/api/payments/verify", auth, (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (!razorpay || !orderId || !paymentId || !signature) return res.status(400).json({ error: "Payment details are incomplete" });
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  const received = Buffer.from(String(signature));
  if (received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), received)) return res.status(400).json({ error: "Invalid payment signature" });
  const purchase = db.prepare("SELECT * FROM purchases WHERE razorpay_order_id=? AND user_id=?").get(orderId, req.user.id);
  if (!purchase) return res.status(404).json({ error: "Payment order not found" });
  db.prepare("UPDATE purchases SET razorpay_payment_id=?,status='paid' WHERE id=?").run(paymentId, purchase.id);
  res.json({ success: true, courseId: purchase.course_id });
});
app.get("/api/payments/history", auth, (req, res) => {
  const payments = db.prepare(`SELECT p.id,p.course_id,c.slug,c.title,p.amount_paise,p.status,
    p.razorpay_order_id,p.razorpay_payment_id,p.created_at
    FROM purchases p JOIN courses c ON c.id=p.course_id WHERE p.user_id=? ORDER BY p.created_at DESC`).all(req.user.id);
  res.json(payments.map(payment => ({ ...payment, amount: payment.amount_paise / 100 })));
});
app.get("/api/student/payments", auth, (req, res) => {
  const payments = db.prepare(`SELECT p.id,p.course_id,c.slug,c.title,p.amount_paise,p.status,
    p.razorpay_order_id,p.razorpay_payment_id,p.created_at
    FROM purchases p JOIN courses c ON c.id=p.course_id WHERE p.user_id=? ORDER BY p.created_at DESC`).all(req.user.id);
  res.json(payments.map(payment => ({ ...payment, amount: payment.amount_paise / 100 })));
});

function courseIdFor(value) {
  const course = db.prepare("SELECT id FROM courses WHERE id=? OR slug=?").get(value, String(value));
  return course && course.id;
}
function ownsCourse(user, courseId) {
  if (user && user.role === "admin") return true;
  const id = courseIdFor(courseId);
  return !!id && db.prepare("SELECT 1 FROM purchases WHERE user_id=? AND course_id=? AND status='paid'").get(user.id, id);
}
app.get("/api/my/courses", auth, (req, res) => {
  const rows = db.prepare(`SELECT c.id,c.slug,c.title,c.description,c.price_paise,p.created_at,p.status payment_status,
    (SELECT COUNT(*) FROM contents x JOIN topics t ON x.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE m.course_id=c.id) total_contents,
    (SELECT COUNT(*) FROM progress pr JOIN contents x ON pr.content_id=x.id JOIN topics t ON x.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE pr.user_id=? AND m.course_id=c.id AND pr.completed=1) completed_contents
    FROM purchases p JOIN courses c ON c.id=p.course_id WHERE p.user_id=?`).all(req.user.id, req.user.id);
  res.json(rows.map(row => ({ ...row, paid: row.payment_status === "paid", progress: row.total_contents ? Math.round(row.completed_contents * 100 / row.total_contents) : 0 })));
});
app.get("/api/student/dashboard", auth, (req, res) => {
  const student = db.prepare("SELECT id,name FROM users WHERE id=?").get(req.user.id);
  const courses = db.prepare(`SELECT c.id,c.slug,c.title,c.description,c.price_paise,p.id purchase_id,
    p.amount_paise,p.status payment_status,p.razorpay_order_id,p.razorpay_payment_id,p.created_at,
    (SELECT COUNT(*) FROM contents x JOIN topics t ON x.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE m.course_id=c.id) total_contents,
    (SELECT COUNT(*) FROM progress pr JOIN contents x ON pr.content_id=x.id JOIN topics t ON x.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE pr.user_id=? AND m.course_id=c.id AND pr.completed=1) completed_contents
    FROM purchases p JOIN courses c ON c.id=p.course_id WHERE p.user_id=? ORDER BY p.created_at DESC`).all(req.user.id, req.user.id);
  res.json({
    studentName: student.name,
    courses: courses.map(course => ({
      ...course,
      paid: course.payment_status === "paid",
      progress: course.total_contents ? Math.round(course.completed_contents * 100 / course.total_contents) : 0
    }))
  });
});
app.get("/api/my/courses/:courseId/content", auth, (req, res) => {
  if (!ownsCourse(req.user, req.params.courseId)) return res.status(403).json({ error: "Purchase required" });
  const course = courseTree(req.params.courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });
  course.modules.forEach(module => module.topics.forEach(topic => {
    topic.contents = topic.contents.map(item => {
      const full = db.prepare("SELECT * FROM contents WHERE id=?").get(item.id);
      return protectedContent(full);
    });
  }));
  res.json(course);
});
app.get("/api/my/content/:contentId", auth, (req, res) => {
  const content = db.prepare(`SELECT c.*,m.course_id FROM contents c
    JOIN topics t ON c.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE c.id=?`).get(req.params.contentId);
  if (!content) return res.status(404).json({ error: "Content not found" });
  if (!ownsCourse(req.user, content.course_id)) return res.status(403).json({ error: "Purchase required" });
  res.json({ ...protectedContent(content), courseId: content.course_id });
});
app.get("/api/my/content/:contentId/stream", auth, (req, res) => {
  const content = db.prepare(`SELECT c.*,m.course_id FROM contents c
    JOIN topics t ON c.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE c.id=?`).get(req.params.contentId);
  if (!content) return res.status(404).json({ error: "Content not found" });
  if (!ownsCourse(req.user, content.course_id)) return res.status(403).json({ error: "Purchase required" });
  const filePath = mediaPathFor(content.url);
  if (!filePath) return res.status(409).json({ error: "This content is hosted externally and cannot be streamed by the server" });
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return res.status(404).json({ error: "Media file not found" });
    res.type(path.extname(filePath));
    if (content.type === "pdf" || req.query.download === "1") {
      res.set("Content-Disposition", `${req.query.download === "1" ? "attachment" : "inline"}; filename="${path.basename(filePath).replace(/["\r\n]/g, "")}"`);
    }
    res.sendFile(filePath);
  });
});
app.post("/api/my/progress", auth, (req, res) => {
  const { contentId, completed = false, positionSeconds = 0 } = req.body || {};
  const content = db.prepare("SELECT c.id,m.course_id FROM contents c JOIN topics t ON c.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE c.id=?").get(contentId);
  if (!content || !ownsCourse(req.user, content.course_id)) return res.status(403).json({ error: "Purchase required" });
  db.prepare(`INSERT INTO progress(user_id,content_id,completed,position_seconds) VALUES(?,?,?,?)
    ON CONFLICT(user_id,content_id) DO UPDATE SET completed=excluded.completed,position_seconds=excluded.position_seconds,updated_at=CURRENT_TIMESTAMP`).run(req.user.id, contentId, completed ? 1 : 0, integer(positionSeconds));
  res.json({ success: true });
});
app.get("/api/my/progress/:courseId", auth, (req, res) => {
  if (!ownsCourse(req.user, req.params.courseId)) return res.status(403).json({ error: "Purchase required" });
  res.json(db.prepare("SELECT p.* FROM progress p JOIN contents c ON c.id=p.content_id JOIN topics t ON c.topic_id=t.id JOIN modules m ON t.module_id=m.id WHERE p.user_id=? AND m.course_id=?").all(req.user.id, courseIdFor(req.params.courseId)));
});

const resourceTables = { courses: { table: "courses", fields: ["slug", "title", "description", "price_paise", "thumbnail_url", "published"] }, modules: { table: "modules", fields: ["course_id", "title", "position"] }, topics: { table: "topics", fields: ["module_id", "title", "description", "objectives", "thumbnail_url", "position"], nullableFields: ["description", "objectives", "thumbnail_url"] }, contents: { table: "contents", fields: ["topic_id", "type", "title", "url", "duration_seconds", "position"] } };
app.get("/api/admin/payments", auth, adminOnly, (req, res) => {
  const payments = db.prepare(`SELECT p.id,p.user_id,u.name student_name,u.email,c.id course_id,c.slug,c.title,
    p.amount_paise,p.status,p.razorpay_order_id,p.razorpay_payment_id,p.created_at
    FROM purchases p JOIN users u ON u.id=p.user_id JOIN courses c ON c.id=p.course_id
    ORDER BY p.created_at DESC`).all();
  res.json(payments.map(payment => ({ ...payment, amount: payment.amount_paise / 100 })));
});
app.get("/api/admin/payments/:id", auth, adminOnly, (req, res) => {
  const payment = db.prepare(`SELECT p.id,p.user_id,u.name student_name,u.email,c.id course_id,c.slug,c.title,
    p.amount_paise,p.status,p.razorpay_order_id,p.razorpay_payment_id,p.created_at
    FROM purchases p JOIN users u ON u.id=p.user_id JOIN courses c ON c.id=p.course_id WHERE p.id=?`).get(req.params.id);
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  res.json({ ...payment, amount: payment.amount_paise / 100 });
});
for (const [resource, config] of Object.entries(resourceTables)) {
  app.get(`/api/admin/${resource}`, auth, adminOnly, (req, res) => res.json(db.prepare(`SELECT * FROM ${config.table} ORDER BY id DESC`).all()));
  app.post(`/api/admin/${resource}`, auth, adminOnly, (req, res) => {
    const values = config.fields.map(field => req.body[field] === undefined ? (config.nullableFields && config.nullableFields.includes(field) ? null : field === "published" ? 0 : field.endsWith("position") || field === "price_paise" || field === "duration_seconds" ? 0 : "") : req.body[field]);
    try {
      const result = db.prepare(`INSERT INTO ${config.table}(${config.fields.join(",")}) VALUES(${config.fields.map(() => "?").join(",")})`).run(...values);
      res.status(201).json(db.prepare(`SELECT * FROM ${config.table} WHERE id=?`).get(result.lastInsertRowid));
    } catch (_) { res.status(400).json({ error: "Invalid resource data" }); }
  });
  app.put(`/api/admin/${resource}/:id`, auth, adminOnly, (req, res) => {
    const fields = config.fields.filter(field => req.body[field] !== undefined);
    if (!fields.length) return res.status(400).json({ error: "No fields to update" });
    try {
      db.prepare(`UPDATE ${config.table} SET ${fields.map(field => `${field}=?`).join(",")} WHERE id=?`).run(...fields.map(field => req.body[field]), req.params.id);
      res.json(db.prepare(`SELECT * FROM ${config.table} WHERE id=?`).get(req.params.id));
    } catch (_) { res.status(400).json({ error: "Invalid resource data" }); }
  });
  app.delete(`/api/admin/${resource}/:id`, auth, adminOnly, (req, res) => {
    db.prepare(`DELETE FROM ${config.table} WHERE id=?`).run(req.params.id);
    res.status(204).end();
  });
}
app.post("/api/admin/topics/:id/generate-script", auth, adminOnly, (req, res) => {
  const topic = db.prepare(`SELECT t.id,t.title,t.description,t.objectives,t.thumbnail_url,
    m.title module_title,c.title course_title FROM topics t
    JOIN modules m ON m.id=t.module_id JOIN courses c ON c.id=m.course_id WHERE t.id=?`).get(req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  const format = ["video", "lesson", "pdf"].includes(req.body && req.body.format) ? req.body.format : "video";
  const scriptPrompt = [
    "Create an engaging, accurate online course lesson script.",
    `Course: ${topic.course_title}`,
    `Module: ${topic.module_title}`,
    `Topic: ${topic.title}`,
    `Description: ${topic.description || "Not provided"}`,
    `Objectives: ${topic.objectives || "Not provided"}`,
    `Format: ${format}`,
    "Include an introduction, clear explanations, practical examples, learner check-in questions, and a concise recap.",
    "Do not invent regulations, prices, credentials, or sources; flag facts that require instructor verification."
  ].join("\n");
  res.json({
    topicId: topic.id,
    format,
    scriptPrompt,
    template: {
      title: topic.title,
      learningObjectives: topic.objectives ? topic.objectives.split(/\r?\n|,|;/).map(item => item.trim()).filter(Boolean) : [],
      sections: ["Hook and context", "Learning objectives", "Core explanation", "Practical demonstration", "Knowledge check", "Recap and next steps"],
      instructorNotes: "",
      provider: null,
      generatedContent: null
    },
    note: "Template only. No AI provider or API key is invoked."
  });
});

app.use("/private-media", (_, res) => res.status(404).json({ error: "Not found" }));
app.use("/data", (_, res) => res.status(404).json({ error: "Not found" }));
app.use("/assets", (req, res, next) => req.path.toLowerCase().endsWith(".pdf") ? res.status(404).json({ error: "Protected course material" }) : next());
app.use(express.static(__dirname));
app.get(["/courses", "/courses/:courseId", "/resources", "/placements", "/success-stories", "/about", "/student/dashboard", "/student/my-courses", "/student/course/:courseId", "/admin/dashboard", "/admin/courses", "/admin/resources", "/admin/students", "/admin/payments", "/admin/enrollments"], (_, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.listen(PORT, () => console.log(`Tally With Tax backend listening on port ${PORT}`));
