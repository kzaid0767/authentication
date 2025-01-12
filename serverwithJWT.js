//Using JWT for authentication
import jwt from "jsonwebtoken";
import session from "express-session";
import MongoStore from "connect-mongo";
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
//app.set("views", path.join(__dirname, "views"));

//Simulated middleware


//configure express-session
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1 * 60 * 60 * 1000 // 1 hour
    },
    store: MongoStore.create({
        mongoUrl: uri
    })
}));


//isauthenticated
const isAuthenticated = (req, res, next) => {
    //check if user is logged in with JWT
    const token = req.cookies.token;
    
    if (token) {
        jwt.verify(token, "secret", (err, decoded) => {
            if (err) {
                res.redirect("/login");
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        res.redirect("/login");
    }
};

     

//isadmin middleware
const isAdmin = (req, res, next) => {
    const user = req.user;
    if (user.role === "admin") {
        next();
    } else {
        res.redirect("/dashboard");
    }
}; 


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

//admin route
app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
    const user = req.user;
    const username = user ? user.username : null; 
    res.render("admin", { username });
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
        //creat jwt token
        const token = jwt.sign({ username: user.username, role: user.role }, "secret", { expiresIn: "1h" });
        //saving token in cookie
        res.cookie("token", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24});;
        res.redirect("/dashboard");
    }else{
        res.send("Login failed, please try again");
    }  
});

app.get("/dashboard", isAuthenticated, (req, res) => {
    //get user from session
    const user = req.user;
    const username = user ? user.username : null;
    if (username) {
        res.render("dashboard", { username });
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {    
    //clear session
    res.clearCookie("token");
    res.redirect("/login");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
    