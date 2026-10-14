# Student Course Management System

A web-based Student Course Management System built using **Node.js, Express.js, MongoDB, and Mongoose**. This project provides an interface to manage student records and courses, filter and sort marks, and view student-course relationships.

## Features

- **Student Management:** Add, view, update, and delete student records.
- **Course Management:** Manage course records associated with students.
- **Unique Identifiers:** Use unique Student IDs (SID) and Course IDs (CID).
- **Data Validation:** Validate student details and marks.
- **Student-Course Relationship:** Associate courses with existing students.
- **Deletion Protection:** Prevent deletion of students who have registered courses.
- **Dashboard:** Display student and course statistics.
- **Marks Filtering and Sorting:** Filter students by minimum marks and sort results by marks.
- **Aggregation:** Calculate average and highest marks using MongoDB aggregation.
- **Student-Course Overview:** Combine student and course information using MongoDB `$lookup`.

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Community Server
- **ODM:** Mongoose
- **Development Tools:** Visual Studio Code, Git, GitHub

## Prerequisites

Install the following before running the project:

- [Node.js and npm](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (optional, for viewing database records)
- [Visual Studio Code](https://code.visualstudio.com/)

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Santosh02244/student-course-management-system.git
cd student-course-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB

Make sure your local MongoDB Community Server is running.

The application connects to:

```text
mongodb://127.0.0.1:27017/studentCourseDB
```

The database is named `studentCourseDB`. The application uses the `student_master` and `course_master` collections.

### 4. Start the application

```bash
npm start
```

Open your browser and visit:

```text
http://localhost:3000
```

## Database Structure

### Student Collection — `student_master`

Stores student information, including:

- Student ID (SID)
- Name
- Age
- Marks

### Course Collection — `course_master`

Stores course information, including:

- Course ID (CID)
- Student ID (SID)
- Course name

Each course references an existing student through the SID field.

## MongoDB Concepts Demonstrated

- CRUD operations
- Schema validation and unique fields
- `$match` for filtering records
- `$sort` for sorting results
- `$project` for selecting fields
- `$group` for calculating statistics
- `$avg` and `$max` for aggregate calculations
- `$lookup` for combining student and course data
- Referential integrity checks in application logic

## Project Structure

```text
student-course-management-system/
├── public/
│   └── index.html
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Future Enhancements

- User authentication and role-based access
- Pagination and advanced search
- Export student and course reports
- Improved reporting and analytics

## Author

**Sai Santosh**

GitHub: [@Santosh02244](https://github.com/Santosh02244)

## License

This project is currently provided for educational and learning purposes. No specific open-source license has been added.
