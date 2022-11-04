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
    res.redirect('/admin/types/manage')
  });
})

//view all the type
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

//view edit form
app.get("/admin/types/edit/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`SELECT * from types WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.render('admin/types/new', {
        type: results
      })
    });
  } else {
    res.redirect("/")
  }
})

//Save updates
app.post("/admin/types/update/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`UPDATE types SET name = '${req.body.name}' WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      res.redirect('/admin/types/manage')
    });
  } else {
    res.redirect("/")
  }
})

//Delete data
app.get("/admin/types/delete/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`DELETE from types WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.redirect('/admin/types/manage')
    });
  } else {
    res.redirect("/")
  }
})







// CATEGORIES MODULES
// Render the form
app.get('/admin/categories/new', (req,res) => {
  res.render('admin/categories/new')
})

// Save the form
app.post('/admin/categories/save', (req, res) => {
  let data =  req.body
  connection.query(`INSERT into categories(name) values('${data.name}')`, function (error, results, fields) {
    if (error) throw error;
    res.redirect('/admin/categories/manage')
  });
})

//view all the categories
app.get("/admin/categories/manage", function(req,res){

  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query('SELECT * from categories', function (error, results, fields) {
      if (error) throw error;
      res.render('admin/categories/manage', {
        categories: results
      })
    });
  } else {
    res.redirect("/")
  }

})

//View edit form
app.get("/admin/categories/edit/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`SELECT * from categories WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.render('admin/categories/new', {
        categories: results
      })
    });
  } else {
    res.redirect("/")
  }
})

//Save updates
app.post("/admin/categories/update/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`UPDATE categories SET name = '${req.body.name}' WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      res.redirect('/admin/categories/manage')
    });
  } else {
    res.redirect("/")
  }
})

//Delete data
app.get("/admin/categories/delete/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`DELETE from categories WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.redirect('/admin/categories/manage')
    });
  } else {
    res.redirect("/")
  }
})





// SHELVES MODULES
//add new for shelves
app.get('/admin/shelves/new', (req,res) => {
  res.render('admin/shelves/new')
})

app.post('/admin/shelves/save', (req, res) => {
  let data =  req.body
  connection.query(`INSERT into shelves(shelf_name,location,description) values('${data.name}','${data.location}','${data.description}')`, function (error, results, fields) {
    if (error) throw error;
    res.redirect('/admin/shelves/manage')
  });
})

//view all the shelves
app.get("/admin/shelves/manage", function(req,res){

  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query('SELECT * from shelves', function (error, results, fields) {
      if (error) throw error;
      res.render('admin/shelves/manage', {
        shelves: results
      })
    });
  } else {
    res.redirect("/")
  }

})

//View edit form
app.get("/admin/shelves/edit/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`SELECT * from shelves WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.render('admin/shelves/new', {
        shelves: results
      })
    });
  } else {
    res.redirect("/")
  }
})

//Save updates
app.post("/admin/shelves/update/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`UPDATE shelves SET shelf_name = '${req.body.name}', location = '${req.body.location}', description = '${req.body.description}' WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      res.redirect('/admin/shelves/manage')
    });
  } else {
    res.redirect("/")
  }
})

//Delete data
app.get("/admin/shelves/delete/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`DELETE from shelves WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.redirect('/admin/shelves/manage')
    });
  } else {
    res.redirect("/")
  }
})








// ITEMS MODULES
// Create new Item
app.get('/admin/items/new', function(req,res){
  connection.query('SELECT * from shelves', function (error, results, fields) {
    if (error) throw error;
    res.render('admin/items/new', {
      shelves: results
    })
  });
})

// Saving item
app.post('/admin/items/save', (req, res) => {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field
  let imgFile = req.files.image;

  let imgUnique = uniqueString()

  let imgUrl = '/static/uploads/'+imgUnique+'.jpg';

  // Use the mv() method to move to a place in server
  imgFile.mv(__dirname + imgUrl, function(err) {
  if (err)
    return res.status(500).send(err);

  // res.send('File uploaded!');
  })

  let data =  req.body
  connection.query(`INSERT into items(name,shelf_id,description,qty,img) values('${data.name}','${data.shelf_id}','${data.description}','${data.qty}','${imgUnique}.jpg')`, function (error, results, fields) {
    if (error) throw error;
    res.redirect('/admin/items/manage')
  });
})

// Manage Items
app.get('/admin/items/manage', (req,res)=>{
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query('SELECT items.id, shelf_name, name, qty, img, status from items LEFT JOIN shelves ON items.shelf_id = shelves.id GROUP BY items.id', function (error, results, fields) {
      if (error) throw error;
      res.render('admin/items/manage', {
        items: results
      })
    });
  } else {
    res.redirect("/")
  }  
})

//View edit form
app.get("/admin/items/edit/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`SELECT * from items where id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.render('admin/items/new', {
        items: results
      })
    });
  } else {
    res.redirect("/")
  }
})

//Save updates
app.post("/admin/items/update/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`UPDATE shelves SET shelf_name = '${req.body.name}', location = '${req.body.location}', description = '${req.body.description}' WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      res.redirect('/admin/shelves/manage')
    });
  } else {
    res.redirect("/")
  }
})

//Delete data
app.get("/admin/items/delete/:id", function(req,res){
  if(req.session.admin) {
    res.locals.admin = req.session.admin
    connection.query(`DELETE from items WHERE id = ${req.params.id}`, function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.redirect('/admin/items/manage')
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
//       res.redirect('/admin/dashboard')
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