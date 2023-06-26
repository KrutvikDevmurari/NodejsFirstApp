const express = require('express')
const path = require('path')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
// db
mongoose.connect('mongodb://localhost:27017', {
    dbName: 'Backend'
}).then(() => console.log("Database Connected")).catch(e => console.log(e))
const users = []

//schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
})

const User = mongoose.model("User", userSchema)

// using middle wares
app.use(express.static(path.join(path.resolve(), 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies
    if (token) {
        const decoded = jwt.verify(token, "sdferijwiojojiojo")
        req.user = await User.findById(decoded._id)
        next()
    } else {
        res.render('login.ejs')
    }
}
// making api calls
app.get('/', isAuthenticated, (req, res) => {
    const { email,name } = req.user
    res.render('logout.ejs', { name })
})
app.get('/login', (req, res) => {
   res.render('login.ejs')
})
app.get('/register', (req, res) => {
    res.render('register.ejs')
})


app.post('/register', async (req, res) => {
    const {name, email, password } = req.body
    let user = await User.findOne({ email })
    const hashpassword = await bcrypt.hash(password,10)
    if (user) {
        return res.redirect('/login')
    }else {
        user = await User.create({name, email, password : hashpassword })
        const token = jwt.sign({ _id: user._id }, "sdferijwiojojiojo",  { algorithm: 'HS512', noTimestamp: true });
        res.cookie("token", token,
            {
                http: true,
                expires: new Date(Date.now() + 60 * 1000)
            })
        res.redirect('/')
    }
 

})
app.post('/login', async (req, res) => {
    const { email, password } = req.body
    let user = await User.findOne({ email })
    const ispassword = await bcrypt.compare(password,user.password)
    console.log(ispassword)
    if (user) {
        if(ispassword){
            const token = jwt.sign({ _id: user._id }, "sdferijwiojojiojo",  { algorithm: 'HS512', noTimestamp: true });
            res.cookie("token", token,
                {
                    http: true,
                    expires: new Date(Date.now() + 60 * 1000)
                })
                res.redirect('/')
        }else{
            res.render('login.ejs',{email, message : "Wrong Password"})  
        }
        
    }else {
        return res.redirect('/register')
    }
 

})

app.get('/logout', (req, res) => {
    res.cookie("token", null,
        {
            expires: new Date(Date.now())
        })
    res.redirect('/login')
})

app.listen(5000, () => {
    console.log('server is listening at  5000')
})