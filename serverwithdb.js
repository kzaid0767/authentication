//cookies authentication with api only

import express from "express";
import mongoose from "mongoose";
import path, { parse } from "path";
//import { json } from "stream/consumers";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
//bcryptjs for password hashing
import bcrypt from "bcryptjs";


const app = express();
const port = 8082 || process.env.PORT;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

//connect to mongoose
const uri = "mongodb+srv://kzaid0767:Reometry123$@cluster0.8d1aj.mongodb.net/players-db";
mongoose.connect(uri)
.then(() => console.log("Connected to MongoDB"))
.catch((error) => console.error("Error connecting to MongoDB:", error));


//create schema
const playerSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: {
        type: String,
        default: "user"
    }
});


//create model
const Player = mongoose.model("Player", playerSchema);



// app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());
app.set("views", path.join(__dirname, "views"));

//Simulated Database of Users

//not using browser for api only

app.get("/", (req, res) => {
    res.render("home");
});

//route to register player
app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newPlayer = await Player.create({ username, password: hashedPassword });
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async(req, res) => {    
    const { username, password } = req.body;
    
    //check if user exists in database
    const user = await Player.findOne({ username });
    if (!user) {
        res.redirect("/login");
        return;
    }
    
    //check if password is correct as the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
        //create some cookies
        res.cookie("user", JSON.stringify(user), 
        { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, secure: false, sameSite: "strict" });
        res.redirect("/dashboard");
    }else{
        res.send("Login failed, please try again");
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
    