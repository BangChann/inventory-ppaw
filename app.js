var express = require('express')
var session = require('express-session')
var mysql = require('mysql')
const fileUpload = require('express-fileupload');

const uniqueString = require('unique-string');

var app = express()

app.use(session({secret: 'ssshhhhh!'}));

app.use(fileUpload());

app.locals.baseUrl = "http://localhost:3000"

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require("bcryptjs");
const { redirect } = require('express/lib/response');

var pwHash = (pwd) => {
  return bcrypt.hashSync(pwd, 10);
}

var pwVerify = (pwd,hash) => {
  if(bcrypt.compareSync(pwd, hash)) {
    return true;
  } else {
    return false;
  } 
}

//static folder
app.use(express.static('static'))

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'inventorydb'
})

connection.connect(function(err) {
  if (err) {
    console.log("Cannot connect to mysql...")
    throw err
  }
  console.log('Connected to mysql...')
})

//set view engine to ejs
app.set('view engine', 'ejs');

//register an Admin manually
app.get('/secretadminreg', function (req, res) {
  let pwwd = pwHash('administrator')
  let username = 'admin'+Math.floor(Math.random() * 100) + 1;;
  connection.query(`insert into admins(username, password) values('${username}', '${pwwd}')`, function(err, rows, fields) {
    if (!err){
      console.log('Added User: ', rows);
      console.log('User added!\n'+'username:'+username+'\t'+'password:'+'administrator');
      res.redirect('/')
    }
    else {
      throw err;
      console.log('Error while performing Query.');
    } 
  });
})

//log out
app.get('/logout',(req,res)=> {
  req.session.destroy();
  res.redirect('/');
})

//404
app.get('/404',(req,res)=> {
  res.render('404')
})

//login page
app.get('/',(req,res)=> {
  res.render("admin/login", {title: "Admin Login"})
})

//login script
app.post('/admin', function (req, res) {
  console.log(req.body)
  let usr = req.body
  connection.query(`SELECT * from admins where username="${usr.uname}"`, function(err, rows, fields) {
    if (!err) {
      console.log('The solution is: ', rows[0]);

      if(typeof rows[0] != 'undefined' && pwVerify(usr.pwd, rows[0].password)){
        console.log("Successful Login");
        req.session.admin = {
          id : rows[0].id,
          username : rows[0].username,
        };
        res.redirect('admin/dashboard');
      } else {
        res.render('admin/login', {title: "Failed! Try again", failed: true});
      }
    }
    else
      throw err;
  });
})

//admin dashboard
app.get("/admin/dashboard",function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    res.render("admin/dash")
  } else {
    res.redirect("/")
  }
  
})

// TYPES MODULES
// Render the form
app.get('/admin/types/new', (req,res) => {
  res.render('admin/types/new')
})

// Save the Form
app.post('/admin/types/save', (req, res) => {
  let data =  req.body
  connection.query(`INSERT into types(name) values('${data.name}')`, function (error, results, fields) {
    if (error) throw error;
    res.redirect('/admin/manage')
  });
})

// Render main types dashboard
app.get("/admin/types/manage", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query('SELECT * from types', function (error, results, fields) {
      if (error) throw error;
      res.render('admin/types/manage', {
        types: results
      })
    });
  } else {
    res.redirect("/")
  }
})


// TUTORIAL ROUTES
// app.get("/admin/manage", function(req,res){

//   if(req.session.admin) {
//     res.locals.admin = req.session.admin
//     connection.query('SELECT * from products', function (error, results, fields) {
//       if (error) throw error;
//       res.render('admin/manage', {
//         products: results
//       })
//     });
//   } else {
//     res.redirect("/")
//   }

// })
// app.get("/admin/new", function(req, res) {
//   if(req.session.admin) {
//     res.locals.admin = req.session.admin
//     res.render("admin/new")
//   } else {
//     res.redirect("/")
//   }
// })
// app.post('/admin/new', function(req, res) {
//   if (Object.keys(req.files).length == 0) {
//     return res.status(400).send('No files were uploaded.');
//   }

//   // The name of the input field
//   let imgFile = req.files.image;

//   let imgUnique = uniqueString()

//   let imgUrl = '/static/uploads/'+imgUnique+'.jpg';

  
//   // Use the mv() method to move to a place in server
//   imgFile.mv(__dirname + imgUrl, function(err) {
//     if (err)
//       return res.status(500).send(err);

//     // res.send('File uploaded!');

//     let data =  req.body
//     connection.query(`INSERT into products(name,descr,price,stock,picture) values('${data.name}','${data.descr}','${data.price}', '${data.stock}','${imgUnique}.jpg')`, function (error, results, fields) {
//       if (error) throw error;
//       res.redirect('/admin/manage')
//     });
//   });
// });
// app.get("/admin/edit/:id", function(req, res) {
//   if(req.session.admin) {
//     res.locals.admin = req.session.admin
//     connection.query('SELECT * from products where id='+req.params.id, function (error, results, fields) {
//       if (error) throw error;
//       res.render('admin/edit', {
//         product: results[0]
//       })
//     });
//   } else {
//     res.redirect("/")
//   }
// })
// app.post("/admin/edit/:id", function(req, res) {
//   let data =  req.body
//   if (Object.keys(req.files).length == 0) {
//     connection.query(`UPDATE products set name='${data.name}', descr = '${data.descr}', stock=${data.stock}, price = ${data.price} where id=${req.params.id}`, function (error, results, fields) {
//       if (error) throw error;
//       res.redirect("/admin/manage")
//     });
//   } else {

//     // The name of the input field
//     let imgFile = req.files.image;

//     let imgUnique = uniqueString()

//     let imgUrl = '/static/uploads/'+imgUnique+'.jpg';

    

//     // Use the mv() method to move to a place in server
//     imgFile.mv(__dirname + imgUrl, function(err) {
//       if (err)
//         return res.status(500).send(err);

//         connection.query(`UPDATE products set name='${data.name}', descr = '${data.descr}', stock=${data.stock}, price = ${data.price}, picture='${imgUnique}.jpg' where id=${req.params.id}`,function (error, results, fields) {
//           if (error) throw error;
//           res.redirect("/admin/manage")
//         });
//     })
//   }
// })


// PORT MANAGEMENT
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Server started at port "+port)
    console.log("http://localhost:"+port)
})