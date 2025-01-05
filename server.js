import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 8082 || process.env.PORT;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Simulated Database of Users
const users = [
    { id: 1, username: "user1", password: "password1", role: "admin" },
    { id: 2, username: "user2", password: "password2", role: "user" },
    { id: 3, username: "user3", password: "password3", role: "user" }
];

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {    
    res.render("login");
});

app.post("/login", (req, res) => {    
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
        req.session.user = user;
        res.redirect("/dashboard");
    } else {
        res.redirect("/login");
    }
});

app.get("/dashboard", (req, res) => {
    if (req.session.user) {
        res.render("dashboard", { username: req.session.user.username });        
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {    
    req.session.destroy();
    res.redirect("/login");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
    