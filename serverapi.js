//cookies authentication with api only

import express from "express";
import path, { parse } from "path";
//import { json } from "stream/consumers";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

const app = express();
const port = 8082 || process.env.PORT;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

 app.use(express.json());
// not needed for api only app.use(express.urlencoded({ extended: true }));
//app.set("view engine", "ejs");
app.use(cookieParser());
//app.set("views", path.join(__dirname, "views"));

//Simulated Database of Users
const users = [
    { id: 1, username: "user1", password: "password1", role: "admin" },
    { id: 2, username: "user2", password: "password2", role: "user" },
    { id: 3, username: "user3", password: "password3", role: "user" }
];

//not using browser for api only

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});

/* app.get("/login", (req, res) => {    
    res.render("login");
}); */

app.post("/login", (req, res) => {    
    const { username, password } = req.body;
    console.log(username, password);
    const user = users.find((u) => u.username === username && u.password === password);
   
    //create some cookies
    res.cookie("user", JSON.stringify(user), 
        { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, secure: false, sameSite: "strict" });
     if (user) {
       // req.session.user = user;
        res.json({ message: "Login successful", user });
    } else {
        res.json({ message: "Login failed" });
    } 
});

app.get("/dashboard", (req, res) => {
    //check if user is logged in
    const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    console.log( user);
    const username = user ? user.username : null;
    console.log(username);
    if (username) {
        res.json({ message: `Welcome ${username}, role: ${user.role}` });
    }
    else {
        res.json({ message: "User not logged in" });
    }
});

app.get("/logout", (req, res) => {    
    //clear cookies
    res.clearCookie("user");
    res.json({ message: "Logout successful" });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
    