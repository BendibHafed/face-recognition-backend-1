const express = require('express');

const app = express();

// Routes && Endpoints
app.get('/', (req, res) => {
    res.send("<h1> It is working ...</h1>")
});









// ----------------------------------- Server Runtime -------------------
app.listen(3000, () => {
    console.log('Application is running on port 3000');
})