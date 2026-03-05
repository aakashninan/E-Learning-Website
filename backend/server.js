const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

/* ================================
1. MIDDLEWARE & FILE STORAGE
================================ */
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Multer configuration: ensure field name matches frontend 'file' key
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

/* ================================
2. MONGODB CONNECTION
================================ */
mongoose.connect('mongodb://127.0.0.1:27017/authDB')
  .then(() => console.log("✅ Connected to MongoDB: authDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

/* ================================
3. SCHEMAS & MODELS
================================ */

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true, lowercase: true },
  password: String,
  bio: { type: String, default: "" },
  enrolledCourses: [{ id: Number, progress: { type: Number, default: 0 } }],
  completedQuizzes: [{ courseId: Number, score: Number, passed: Boolean }]
});
const User = mongoose.model('User', userSchema);

const courseSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  title: String,
  category: String,
  description: { type: String, default: "" },
  instructor: { type: String, default: "Elite Instructor" },
  imageUrl: { type: String, default: "" },
  color: { type: String, default: '#6366f1' },
  instructorEmail: { type: String, default: null }, 
  lessons: { type: Array, default: [] } 
});
const Course = mongoose.model('Course', courseSchema);

const submissionSchema = new mongoose.Schema({
  // UPDATED: String type to correctly support MongoDB _id strings
  assignmentId: String, 
  courseId: Number,
  studentEmail: String, 
  fileName: String,
  filePath: String,
  grade: { type: Number, default: null },
  submittedAt: { type: Date, default: Date.now }
});
const Submission = mongoose.model('Submission', submissionSchema);

const Quiz = mongoose.model('Quiz', new mongoose.Schema({ 
  courseId: { type: Number, required: true }, 
  title: String, 
  questions: [{
    question: { type: String, required: true }, 
    options: [String],
    correct: Number
  }] 
}));

const Assignment = mongoose.model('Assignment', new mongoose.Schema({ 
  courseId: { type: Number, required: true }, 
  id: { type: Number }, 
  title: String, 
  task: String,
  details: String, 
  dueDate: String  
}));

const Comment = mongoose.model('Comment', new mongoose.Schema({ 
    courseId: Number, 
    lessonId: Number, 
    email: String, 
    name: String, 
    text: String,
    instructorEmail: String,
    createdAt: { type: Date, default: Date.now },
    replies: [{
      text: String,
      adminName: String,
      adminEmail: String,
      createdAt: { type: Date, default: Date.now }
    }]
}));

const Certificate = mongoose.model('Certificate', new mongoose.Schema({
  studentEmail: String,
  studentName: String,
  courseId: Number,
  courseTitle: String,
  issuedBy: String,
  issuedAt: { type: Date, default: Date.now }
}));

/* ================================
4. AUTH & PROFILE MANAGEMENT
================================ */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ ...req.body, email: email.toLowerCase(), password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Success" });
  } catch (err) { res.status(500).json({ message: "Registration failed" }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });
    const role = user.email.endsWith('@adminedu.com') ? 'admin' : 'student';
    res.json({ email: user.email, firstName: user.firstName, role: role });
  } catch (err) { res.status(500).json({ message: "Login failed" }); }
});

app.get('/api/user/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Profile fetch failed" }); }
});

app.post('/api/user/profile/update', async (req, res) => {
  try {
    const { oldEmail, updates } = req.body;
    if (updates.email !== oldEmail) {
      const existing = await User.findOne({ email: updates.email.toLowerCase() });
      if (existing) return res.status(400).json({ message: "Email already taken" });
    }
    await User.findOneAndUpdate(
      { email: oldEmail.toLowerCase() },
      { $set: { firstName: updates.firstName, lastName: updates.lastName, email: updates.email.toLowerCase(), bio: updates.bio } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Update failed" }); }
});

app.post('/api/user/profile/password', async (req, res) => {
  try {
    const { email, current, new: newPass } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(current, user.password)))
      return res.status(401).json({ message: "Current password wrong" });
    user.password = await bcrypt.hash(newPass, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Security update failed" }); }
});

/* ================================
5. COURSE CATALOG & ENROLLMENT
=============================== */

app.get('/api/courses', async (req, res) => {
    try { 
      const { search } = req.query;
      let query = {};
      if (search) {
        query = { title: { $regex: search, $options: 'i' } };
      }
      const courses = await Course.find(query).lean();
      res.json(courses); 
    } catch (err) { res.status(500).json([]); }
});

app.post('/api/user/enroll', async (req, res) => {
    try {
      const { email, courseId } = req.body;
      const cid = Number(courseId);
      if (!email || isNaN(cid)) return res.status(400).json({ message: "Missing data" });
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(404).json({ message: "User not found" });
      const isEnrolled = user.enrolledCourses.some(c => c.id === cid);
      if (isEnrolled) return res.status(400).json({ message: "Already enrolled" });
      user.enrolledCourses.push({ id: cid, progress: 0 });
      await user.save();
      res.status(200).json({ success: true, message: "Successfully enrolled" });
    } catch (err) { res.status(500).json({ message: "Enrollment failed" }); }
});

/* ================================
6. CONTENT SYNC & DISCUSSIONS
================================ */

app.get('/api/user/courses/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    const enrolledIds = user.enrolledCourses.map(c => Number(c.id)).filter(id => !isNaN(id));
    const courses = await Course.find({ id: { $in: enrolledIds } }).lean();
    const merged = courses.map(course => {
      const enrollment = user.enrolledCourses.find(c => Number(c.id) === course.id);
      return { ...course, progress: enrollment ? enrollment.progress : 0 };
    });
    res.json({ firstName: user.firstName, courses: merged });
  } catch (err) { res.status(500).json({ message: "Dashboard failed" }); }
});

app.post('/api/user/update-progress', async (req, res) => {
  try {
    const { email, courseId, lessonIndex } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    const course = await Course.findOne({ id: Number(courseId) });

    const enrollment = user.enrolledCourses.find(c => c.id === Number(courseId));
    if (enrollment && course) {
      const totalLessons = course.lessons.length;
      const newProgress = Math.round(((lessonIndex + 1) / totalLessons) * 100);
      
      if (newProgress > enrollment.progress) {
        enrollment.progress = Math.min(newProgress, 100);
      }
      
      await user.save();
      res.json({ success: true, progress: enrollment.progress });
    } else {
      res.status(404).json({ message: "Enrollment not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Progress update failed" });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ id: Number(req.params.id) });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) { res.status(500).json({ message: "Course fetch failed" }); }
});

app.get('/api/comments/:courseId/all', async (req, res) => {
  try {
    const comments = await Comment.find({ courseId: Number(req.params.courseId) }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) { res.status(500).json([]); }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { courseId, text, name, email, lessonId, instructorEmail } = req.body;
    const course = await Course.findOne({ id: Number(courseId) });
    const comment = new Comment({
        courseId: Number(courseId),
        lessonId: Number(lessonId),
        email, name, text,
        instructorEmail: instructorEmail || (course ? course.instructorEmail : null)
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) { res.status(500).json({ message: "Post failed" }); }
});

app.post('/api/comments/reply', async (req, res) => {
  try {
    const { commentId, text, adminName, adminEmail } = req.body;
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            text,
            adminName,
            adminEmail: adminEmail.toLowerCase(),
            createdAt: Date.now()
          }
        }
      },
      { new: true }
    );
    res.status(201).json({ success: true, comment: updatedComment });
  } catch (err) {
    res.status(500).json({ message: "Reply failed" });
  }
});

/* ================================
7. ASSIGNMENTS & QUIZZES (FIXED SYNC)
================================ */

app.get('/api/user/assignments/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const enrolledIds = user.enrolledCourses.map(c => Number(c.id)).filter(id => !isNaN(id));
    const assignments = await Assignment.find({ courseId: { $in: enrolledIds } }).lean();
    
    const enriched = await Promise.all(assignments.map(async (asn) => {
      // Searching by string version of _id to match string-based submission record
      const sub = await Submission.findOne({ 
          assignmentId: asn._id.toString(), 
          studentEmail: email 
      });
      return { 
        ...asn, 
        isSubmitted: !!sub, 
        grade: sub ? sub.grade : null,
        submittedAt: sub ? sub.submittedAt : null,
        submittedFileName: sub ? sub.fileName : null 
      };
    }));
    
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: "Assignment sync failed" }); }
});

app.get('/api/user/quizzes/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    const courseIds = user.enrolledCourses.map(c => Number(c.id)).filter(id => !isNaN(id));
    const quizzes = await Quiz.find({ courseId: { $in: courseIds } }).lean();
    const enriched = quizzes.map(q => {
      const completion = user.completedQuizzes.find(cq => Number(cq.courseId) === q.courseId);
      return { ...q, isPassedByMe: completion ? completion.passed : false, myBestScore: completion ? completion.score : 0 };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: "Quiz sync failed" }); }
});

app.post('/api/user/quizzes/submit', async (req, res) => {
  try {
    const { email, courseId, score, passed } = req.body;
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $pull: { completedQuizzes: { courseId: Number(courseId) } } },
      { new: true }
    );
    user.completedQuizzes.push({ courseId: Number(courseId), score, passed });
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Quiz submit failed" }); }
});

app.post('/api/assignments/submit', upload.single('file'), async (req, res) => {
  try {
    const { assignmentId, courseId, studentEmail } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Upload failed: Please select a file and ensure key is 'file'." });
    }
    
    await Submission.findOneAndUpdate(
      { 
        assignmentId: assignmentId, 
        studentEmail: studentEmail.toLowerCase() 
      },
      { 
        courseId: Number(courseId),
        fileName: req.file.filename, 
        filePath: req.file.path, 
        submittedAt: Date.now(),
        grade: null 
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, message: "Assignment uploaded successfully" });
  } catch (err) { 
    console.error("Submission error:", err);
    res.status(500).json({ message: "Server-side upload processing failure." }); 
  }
});

/* ================================
8. ADMIN ACTIONS & CURRICULUM CREATION
================================ */

app.post('/api/admin/create-course', async (req, res) => {
    try {
      const { title, category, description, instructorEmail, instructorName, quizzes, assignments, lessons } = req.body;
      const lastCourse = await Course.findOne().sort({ id: -1 });
      const nextId = lastCourse ? lastCourse.id + 1 : 101;

      const newCourse = new Course({
        id: nextId, title, category, description, instructor: instructorName,
        instructorEmail: instructorEmail.toLowerCase(), lessons: lessons || [], 
        color: '#'+Math.floor(Math.random()*16777215).toString(16)
      });
      await newCourse.save();

      if (quizzes && quizzes.length > 0) {
        await new Quiz({ courseId: nextId, title: `${title} - Assessment`, questions: quizzes }).save();
      }

      if (assignments && assignments.length > 0) {
        const asgnDocs = assignments.map((a, index) => ({
          courseId: nextId, id: index + 1, title: a.title, task: a.task
        }));
        await Assignment.insertMany(asgnDocs);
      }
      res.status(201).json({ success: true, course: newCourse });
    } catch (err) { res.status(500).json({ message: "Curriculum creation failed" }); }
});

// claim an existing course as an instructor
app.post('/api/admin/claim-course', async (req, res) => {
  try {
    const { courseId, newInstructorEmail, newInstructorName } = req.body;
    
    await Course.findOneAndUpdate(
      { id: Number(courseId) },
      { 
        instructorEmail: newInstructorEmail.toLowerCase(),
        instructor: newInstructorName 
      }
    );
    
    res.json({ success: true, message: "Course claimed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while claiming course" });
  }
});

app.delete('/api/admin/delete-course/:id', async (req, res) => {
  try {
    const cid = Number(req.params.id);
    await Promise.all([
      Course.deleteOne({ id: cid }),
      Quiz.deleteMany({ courseId: cid }),
      Assignment.deleteMany({ courseId: cid }),
      Submission.deleteMany({ courseId: cid }),
      Comment.deleteMany({ courseId: cid })
    ]);
    res.json({ success: true, message: "Purged related course records" });
  } catch (err) { res.status(500).json({ message: "Delete failed." }); }
});

app.get('/api/admin/courses/:email', async (req, res) => {
    try { res.json(await Course.find({ instructorEmail: req.params.email.toLowerCase() })); } catch (err) { res.status(500).json([]); }
});

app.get('/api/admin/course-stats/:courseId', async (req, res) => {
  try {
    const cid = Number(req.params.courseId);
    const students = await User.find({ "enrolledCourses.id": cid });
    const assignments = await Assignment.find({ courseId: cid });

    const roster = await Promise.all(students.map(async (s) => {
      const subs = await Submission.find({ courseId: cid, studentEmail: s.email });
      const quizCompletion = s.completedQuizzes.find(cq => Number(cq.courseId) === cid);

      return {
        firstName: s.firstName, lastName: s.lastName, email: s.email,
        progress: s.enrolledCourses.find(c => Number(c.id) === cid)?.progress || 0,
        quizData: { score: quizCompletion ? quizCompletion.score : null, passed: quizCompletion ? quizCompletion.passed : false },
        assignments: assignments.map(a => {
          const sub = subs.find(subm => subm.assignmentId === a._id.toString());
          return { 
             id: a._id, 
             title: a.title, 
             fileUrl: sub ? `http://localhost:5001/uploads/${sub.fileName}` : null, 
             grade: sub ? sub.grade : null 
          };
        })
      };
    }));
    res.json(roster);
  } catch (err) { res.status(500).json({ message: "Stats sync failed" }); }
});

app.post('/api/admin/grade-assignment', async (req, res) => {
  try {
    const { studentEmail, courseId, assignmentId, grade } = req.body;
    const cid = Number(courseId);
    await Submission.findOneAndUpdate(
        { studentEmail: studentEmail.toLowerCase(), courseId: cid, assignmentId: assignmentId }, 
        { grade: Number(grade) }, { upsert: true }
    );
    const total = await Assignment.countDocuments({ courseId: cid });
    const graded = await Submission.countDocuments({ studentEmail: studentEmail.toLowerCase(), courseId: cid, grade: { $ne: null } });
    const newProgress = total > 0 ? Math.round((graded / total) * 100) : 0;
    await User.updateOne({ email: studentEmail.toLowerCase(), "enrolledCourses.id": cid }, { $set: { "enrolledCourses.$.progress": newProgress } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: "Grading sync failed" }); }
});

app.post('/api/admin/issue-certificate', async (req, res) => {
  try {
    const { studentEmail, studentName, courseId, courseTitle, issuedBy } = req.body;
    await new Certificate({ studentEmail: studentEmail.toLowerCase(), studentName, courseId: Number(courseId), courseTitle, issuedBy }).save();
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ message: "Certificate issuance failed" }); }
});

app.get('/api/user/certificates/:email', async (req, res) => {
    try { res.json(await Certificate.find({ studentEmail: req.params.email.toLowerCase() }).sort({ issuedAt: -1 })); } catch (err) { res.status(500).json([]); }
});

/* ================================
9. SERVER START
================================ */
const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));