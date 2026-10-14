
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Student schema
const studentSchema = new mongoose.Schema(
  {
    sid: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 100 },
    marks: { type: Number, required: true, min: 0, max: 100 }
  },
  { collection: "student_master" }
);

// Course schema
const courseSchema = new mongoose.Schema(
  {
    cid: { type: String, required: true, unique: true, trim: true },
    sid: { type: String, required: true, trim: true },
    cname: { type: String, required: true, trim: true }
  },
  { collection: "course_master" }
);

const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", courseSchema);

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Dashboard statistics
app.get("/api/dashboard", async (req, res) => {
  try {
    const [stats] = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          averageMarks: { $avg: "$marks" },
          highestMarks: { $max: "$marks" }
        }
      }
    ]);

    res.json({
      totalStudents: stats?.totalStudents || 0,
      totalCourses: await Course.countDocuments(),
      averageMarks: stats
        ? Number(stats.averageMarks.toFixed(1))
        : 0,
      highestMarks: stats?.highestMarks || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE student
app.post("/api/students", async (req, res) => {
  try {
    const { sid, name, age, marks } = req.body;

    if (!sid?.trim() || !name?.trim() || age === "" ||
        marks === "" || age == null || marks == null) {
      return res.status(400).json({
        message: "Please fill in all student fields."
      });
    }

    const student = await Student.create({
      sid,
      name,
      age: Number(age),
      marks: Number(marks)
    });

    res.status(201).json({
      message: "Student added successfully!",
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This Student ID (SID) already exists."
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// READ students: $match, $sort, $project
app.get("/api/students", async (req, res) => {
  try {
    const pipeline = [];
    const minMarks = req.query.minMarks;
    const sortBy = req.query.sortBy || "sid";
    const order = req.query.order === "desc" ? -1 : 1;

    if (minMarks !== undefined && minMarks !== "") {
      const minimum = Number(minMarks);

      if (!Number.isFinite(minimum) || minimum < 0 || minimum > 100) {
        return res.status(400).json({
          message: "Minimum marks must be between 0 and 100."
        });
      }

      pipeline.push({
        $match: { marks: { $gte: minimum } }
      });
    }

    if (!["sid", "name", "marks", "age"].includes(sortBy)) {
      return res.status(400).json({
        message: "Invalid sort field."
      });
    }

    pipeline.push({ $sort: { [sortBy]: order } });

    pipeline.push({
      $project: {
        _id: 0,
        sid: 1,
        name: 1,
        age: 1,
        marks: 1
      }
    });

    res.json(await Student.aggregate(pipeline));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE student
app.put("/api/students/:sid", async (req, res) => {
  try {
    const { name, age, marks } = req.body;

    if (!name?.trim() || age === "" || marks === "" ||
        age == null || marks == null) {
      return res.status(400).json({
        message: "Please fill in all student fields."
      });
    }

    const student = await Student.findOneAndUpdate(
      { sid: req.params.sid },
      { name, age: Number(age), marks: Number(marks) },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student updated successfully!", student });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE student only when no courses reference it
app.delete("/api/students/:sid", async (req, res) => {
  try {
    if (await Course.exists({ sid: req.params.sid })) {
      return res.status(409).json({
        message: "Cannot delete this student because courses reference this SID."
      });
    }

    const student = await Student.findOneAndDelete({
      sid: req.params.sid
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE course; SID must exist
app.post("/api/courses", async (req, res) => {
  try {
    const { cid, sid, cname } = req.body;

    if (!cid?.trim() || !sid?.trim() || !cname?.trim()) {
      return res.status(400).json({
        message: "Please fill in all course fields."
      });
    }

    if (!(await Student.exists({ sid }))) {
      return res.status(400).json({
        message: "Select an existing student."
      });
    }

    const course = await Course.create({ cid, sid, cname });

    res.status(201).json({
      message: "Course added successfully!",
      course
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This Course ID (CID) already exists."
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// READ courses with student name using $lookup
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.aggregate([
      {
        $lookup: {
          from: "student_master",
          localField: "sid",
          foreignField: "sid",
          as: "student"
        }
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          cid: 1,
          sid: 1,
          cname: 1,
          studentName: "$student.name"
        }
      },
      { $sort: { cid: 1 } }
    ]);

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE course
app.put("/api/courses/:cid", async (req, res) => {
  try {
    const { sid, cname } = req.body;

    if (!sid?.trim() || !cname?.trim()) {
      return res.status(400).json({
        message: "Please fill in all course fields."
      });
    }

    if (!(await Student.exists({ sid }))) {
      return res.status(400).json({
        message: "Select an existing student."
      });
    }

    const course = await Course.findOneAndUpdate(
      { cid: req.params.cid },
      { sid, cname },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json({ message: "Course updated successfully!", course });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE course
app.delete("/api/courses/:cid", async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      cid: req.params.cid
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json({ message: "Course deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student dropdown options
app.get("/api/student-options", async (req, res) => {
  try {
    const students = await Student.find()
      .select("sid name")
      .sort({ name: 1 })
      .lean();

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student + Course Overview using $lookup
app.get("/api/overview", async (req, res) => {
  try {
    const overview = await Student.aggregate([
      {
        $lookup: {
          from: "course_master",
          localField: "sid",
          foreignField: "sid",
          as: "courses"
        }
      },
      {
        $project: {
          _id: 0,
          sid: 1,
          name: 1,
          age: 1,
          marks: 1,
          courses: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                cid: "$$course.cid",
                cname: "$$course.cname"
              }
            }
          }
        }
      },
      { $sort: { sid: 1 } }
    ]);

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server after MongoDB connects
async function startServer() {
  try {
    await mongoose.connect(
      "mongodb://127.0.0.1:27017/studentCourseDB"
    );

    console.log("MongoDB Connected: studentCourseDB");

    app.listen(PORT, () => {
      console.log("Server running at http://localhost:" + PORT);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
