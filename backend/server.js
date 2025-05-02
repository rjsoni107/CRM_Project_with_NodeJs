const app = require("./app");
require("dotenv").config();
const { PORT, SERVER } = process.env;

app.listen(PORT, () => {
    console.log(`Server is running on ${SERVER || "http://localhost:"}${PORT || 3005}`);
});