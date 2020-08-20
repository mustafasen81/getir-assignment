//server.js
const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Application started at http://localhost:${PORT}`);
});

