const app = require("./app"); // ✅ Import the Express app
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = server; // ✅ Export server for cleanup in tests
