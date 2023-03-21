const fs =require('fs');
const express=require("express");
const bodyParser=require("body-parser");
const cors = require("cors");
const path = require('path')
var mysql = require('mysql');
var base64Img5 = require('base64-img');
const { json } = require('body-parser');

const  Configs= {
  host: "localhost",
  user: "root",
  password: "haseeb",
  database:"webdatabase"
};


const app=express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

const port=process.env.PORT || 4000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, "js")));


app.get('/',(req,res)=>{
    res.send("Home Page is ready for you ");
});

app.get('/api',(req,res)=>{
   
    res.json({result:"hello form api"});
});

app.get('/api/getHomeData/:paramss',(req,res)=>{
  var obj = JSON.parse(req.params.paramss) 
  var limit = `limit ${(parseInt(obj.pageNo) - 1)* 12},${12} ;`;
  var search = obj.search;

  var whereClause = ` where p.product_name like '%${search}%' or c.category_name like '%${search}%' `

  var whereAndLimit = search ? whereClause + limit : limit;


  var con = mysql.createConnection(Configs);
  con.connect(function(err) {
      if (err)  
       return res.json({message:'database not connected'});
      
        console.log("Connected!");
      
        con.query('SELECT *,(select count(*) from product as p where p.category_id = pc.category_id)  As ProductsCount, (select count(*) from subcategory as sc where sc.categoryIds = pc.category_id)  As SubCategoriesCount  FROM webdatabase.productcategory as pc;',
         function (err, result) 
        {
      
          if (err) 
          return res.json({message:'You have an error in query ' + err.sqlMessage});
  
              con.query('select * from subcategory;', 
              function (err2, result2) 
              {
            
                if (err2) 
                return res.json({message:'You have an error in query ' + err2.sqlMessage});
        
                  console.log(result2);

                  con.query('select p.*,c.category_name,(select sc.subcategory_name from subcategory as sc where sc.subcategory_id = p.subcategory_id limit 1) as subcategory_name, (select pi.base64Arr from productimages as pi where pi.productId = p.product_id limit 1) as product_image from product p inner join productcategory c on p.category_id = c.category_id '+ whereAndLimit, 
                  function (err3, result3) 
                  {
                
                    if (err3) 
                    return res.json({message:'You have an error in query ' + err3.sqlMessage});
            
                       console.log(result3);

                      con.query('select count(*) as count from product;', 
                      function (err4, result4) 
                      {
                    
                        if (err4) 
                        return res.json({message:'You have an error in query ' + err4.sqlMessage});
                
                      console.log(result4);

                      con.query('select * from productfeatures;',
                      function (err5,result5){
                        if(err5)
                        return res.json({message:'You have an error in query ' + err5.sqlMessage});

                        console.log(result5);
                     
                      return res.json({message:'data fetched successfully',result:result,result2:result2,result3:result3,result4:result4,result5:result5});
                    });
               });
                  
                });
            });
      });

    });
});


app.get('/api/getcategory',(req,res)=>{
   
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "haseeb",
        database:"webdatabase"
      });
    con.connect(function(err) {
        if (err)  
         return res.json({message:'database not connected'});
        
          console.log("Connected!");
        
          con.query('SELECT *,(select count(*) from product as p where p.category_id = pc.category_id)  As ProductsCount, (select count(*) from subcategory as sc where sc.categoryIds = pc.category_id)  As SubCategoriesCount  FROM webdatabase.productcategory as pc;',
           function (err, result) 
          {
        
            if (err) 
            return res.json({message:'You have an error in query ' + err.sqlMessage});
    
                con.query('select * from subcategory;', 
                function (err2, result2) 
                {
              
                  if (err2) 
                  return res.json({message:'You have an error in query ' + err2.sqlMessage});
          
                console.log(result2);
                return res.json({message:'data fetched successfully',result:result,result2:result2});
              });
        });

      });
});

app.post('/api/savecategory',(req,res)=>{

 var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });

    SaveImageInDisk(req.body.categoryimage,function(Err,categoryimage){
      var query = `INSERT INTO productcategory (category_name,categoryimage) 
      VALUES ('${req.body.category_name}','${categoryimage}');`;

          con.connect(function(err) {
            if (err)  
            return res.json({success:false, message:'database not connected'});
            
              console.log("Connected!");
            
              con.query(query, function (error, result) {
            
                if (error) 
                return res.json({success:false,message:'You have an error in query ' + query + error});

                console.log(result);
                return res.json({success:true,message:'data inserted successfully'});
            });
        });
    });
});

app.get('/api/getcategorybyid/:category_id',(req,res)=>{

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
     return res.json({ success:false,message:'database not connected'});
    
      console.log("Connected!");
      var query = 'SELECT * FROM productcategory WHERE category_id ='+ req.params.category_id ;
      console.log(query);
      
      con.query(query, function (error, result) {
    
        if (error) 
        return  res.json({success:false,message:'You have an error in query ' + query});

      console.log(result);
      return  res.json({success:true,message:'data fetched successfully',result:result});
    });
  });

});

app.post('/api/updatecategory',(req,res)=>{
  SaveImageInDisk(req.body.categoryimage,function(Err,imageUrl){
  var query = `update productcategory set category_name = '${req.body.category_name}',
  categoryimage='${req.body.categoryimage}'  where category_id =${req.body.category_id};`;
 try{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
     return res.json({success:false, message:'database not connected'});
    
      console.log("Connected!");
    
      con.query(query, function (error, result) {
    
        if (error) 
         return res.status(200).send({success:false,message:'You have an error in query ' + query + error})
        // res.json({success:false,message:'You have an error in query ' + query + error, haseeb: 'jar khan'});

      console.log(result);
     return res.json({success:true,message:'data updated successfully'});
    });
  });
 }catch(e){
  res.json({success:false, message:e});
 }
});
 });

  app.post('/api/deletecategory',(req,res)=>{
    var query = "delete from productcategory where category_id="+req.body.category_id+"";
    var con = mysql.createConnection({
       host: "localhost",
       user: "root",
       password: "haseeb",
       database:"webdatabase"
     });
   con.connect(function(err) {
       if (err)  
        return res.json({success:false, message:'database not connected'});
       
         console.log("Connected!");
       
         con.query(query, function (error, result) {
       
           if (error) 
           return res.json({success:false,message:'You have an error in query ' + query + error});
   
         console.log(result);
        return res.json({success:true,message:'data deleted successfully'});
       });
     });
});



//subcategory section 
app.get('/api/getsubcategory',(req,res)=>{
   
  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
       return res.json({message:'database not connected'});
      
        console.log("Connected!");
      
        con.query('select * from subcategory sc inner join productcategory c on sc.categoryIds = c.category_id; ', function (err, result) {
      
          if (err) 
          return res.json({message:'You have an error in query ' + query});
  
        console.log(result);
       return res.json({message:'data fetched successfully',result:result});
      });
    });
});

// save subcategory api

app.post('/api/savesubcategory',(req,res)=>{

  
  
  var query = `INSERT INTO subcategory (subcategory_name,categoryIds)
   VALUES ('${req.body.subcategory_name}',${req.body.categoryIds} );`
  
  
  
    var con = mysql.createConnection({
       host: "localhost",
       user: "root",
       password: "haseeb",
       database:"webdatabase"
     });
   con.connect(function(err) {
       if (err)  
        return res.json({success:false, message:'database not connected'});
       
         console.log("Connected!");
       
         con.query(query, function (error, result) {
       
           if (error) 
           return res.json({success:false,message:'You have an error in query ' + query + error});
   
          console.log(result);
            
            return res.json({success:true,message:'data inserted successfully'});
          })
  
     });
   });



// get subcategory by id 

app.get('/api/getsubcategorybyid/:subcategory_id',(req,res)=>{

    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
         return  res.json({ success:false,message:'database not connected'});
      
        console.log("Connected!");
        var query = 'SELECT * FROM subcategory WHERE subcategory_id ='+ req.params.subcategory_id ;
        console.log(query);
        
        con.query(query, function (error, result) {
      
          if (error) 
           return res.json({success:false,message:'You have an error in query ' + query});
  
        console.log(result);
           return res.json({success:true,message:'data fetched successfully',result:result});
      });
    });
  
  });

// update subcategory 

app.post('/api/updatesubcategory',(req,res)=>{
  // var query4 = "update subcategory set subcategory_name ='"+ req.body.subcategory_name +
  //  "','"+"categoryIds='"+req.body.categoryIds+
  //  "' where subcategory_id ="+req.body.subcategory_id +"";

   const query=`UPDATE subcategory set subcategory_name='${req.body.subcategory_name}' 
  
    where subcategory_id=${req.body.subcategory_id}`;

 try{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
     return res.json({success:false, message:'database not connected'});
    
      console.log("Connected!");
    
      con.query(query, function (error, result) {
    
        if (error) 
         return res.status(200).send({success:false,message:'You have an error in query ' + query + error})

      console.log(result);
     return res.json({success:true,message:'data updated successfully'});
    });
  });
 }catch(e){
  debugger;
  res.json({success:false, message:e});
 }


 });


// delete sub category

app.post('/api/deletesubcategory',(req,res)=>{
  var query = "delete from subcategory where subcategory_id="+req.body.subcategory_id+"";
  var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
      return res.json({success:false, message:'database not connected'});
     
       console.log("Connected!");
     
       con.query(query, function (error, result) {
     
         if (error) 
         return res.json({success:false,message:'You have an error in query ' + query + error});
 
       console.log(result);
      return res.json({success:true,message:'data deleted successfully'});
     });
   });
});



// product server section   get api of product 

app.get('/api/getproduct',(req,res)=>{
   
  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      
        con.query(`select *,(select sc.subcategory_name from subcategory as
           sc where sc.subcategory_id = p.subcategory_id limit 1) as 
           subcategory_name,(select pi.base64Arr from productimages as 
            pi where pi.productId = p.product_id limit 1) as 
            ImageUrl from product p inner join productcategory c on
             p.category_id = c.category_id;`, function (err, result) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query '});
  
        console.log(result);
          return res.json({success:true,message:'data fetched successfully',result:result});
      });
    });
});

app.post('/api/getFilteredproduct',(req,res)=>{
   
  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      var queryFilter = `select *,(select sc.subcategory_name from subcategory as sc 
        where sc.subcategory_id = p.subcategory_id limit 1) as 
        subcategory_name,(select pi.base64Arr from productimages 
          as pi where pi.productId = p.product_id limit 1) as product_image 
          from product p inner join productcategory c on p.category_id = c.category_id
           where ` +req.body.filter;
        con.query(queryFilter, function (err, result) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query ' + queryFilter});
  
        console.log(result);
          return res.json({success:true,message:'data fetched successfully',result:result});
      });
    });
});


// prodect post api 

app.post('/api/saveproduct',(req,res)=>{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });

//method no 1

// var query2 = "INSERT INTO product (`product_name`,`category_id`)"+
//   " VALUES ('"+ req.body.product_name + "' " +"," + req.body.category_id+")";

//method no 2

// var query1 = "INSERT INTO product (product_name,category_id) VALUES ('@pname',@pid);"
// query1 =  query1.replace("@pname",req.body.product_name);
// query1 = query1.replace("@pid",req.body.category_id);

//method 3
var description1=req.body.description;
var description =description1.replaceAll("'","''");

var query = `INSERT INTO product (product_name,category_id,subcategory_id,price,
  manufacture,description,phone,city,size,expiry,weight,quality,color)
 VALUES ('${req.body.product_name}',
 ${req.body.category_id},
 ${req.body.subcategory_id},
 ${req.body.price},
'${req.body.manufacture}',
'${description}',
'${req.body.phone}',
'${req.body.city}',
'${req.body.size}',
'${req.body.expiry}',
'${req.body.weight}',
'${req.body.quality}',
'${req.body.color}');`


      con.connect(function(err) {
          if (err)  
            return res.json({success:false, message:'database not connected'});
          
            console.log("Connected!");
          
            con.query(query, function (error, result) {
          
              if (error) 
              return res.json({success:false,message:'You have an error in query ' + query + error});
      
              console.log(result);

              var fquery = `INSERT INTO productfeatures (size,expiry,weight,quality,product_id)
              VALUES ('${req.body.size}',
                    '${req.body.expiry}',
                    '${req.body.weight}',
                    '${req.body.quality}',
                    '${result.insertId}');`;
                    
                con.query(fquery,function(errorf,fresult){
                    if(errorf)
                      return res.json({success:false,message:'You have an error in query ' + fquery + errorf});

                  //images 
                        var queryStart =  "INSERT INTO productimages (base64Arr,productId) values";
                        var recArr=[];
                        req.body.base64Arr.forEach(element => {
                            SaveImageInDisk(element,function(Err,imageUrl){
                              var queryI =  `('${imageUrl}','${result.insertId}')`
                              recArr.push(queryI); 
                                  if(recArr.length == req.body.base64Arr.length){
                                      queryStart += recArr.toString();
                                      con.query(queryStart, function (error1, result1){
                                        if (error1) 
                                          return res.json({success:false,message:'You have an error in query ' + queryStart + error1});
                                          
                                          return res.json({success:true,message:'data inserted successfully'});
                                      })
                                      
                                  }          
                            });                             
                        });                                               
                  })
          });

   });
 });


// get product by their id 

app.get('/api/getproductbyid/:product_id',(req,res)=>{
   var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
       return res.json({ success:false,message:'database not connected'});
       
     
       console.log("Connected!");

       var query = 'SELECT * FROM product WHERE product_id ='+ req.params.product_id ;
       console.log(query);
     
       
       con.query(query, function (error, result) {
         if (error) {
         return  res.json({success:false,message:'You have an error in query ' + query});
         }
          console.log(result);
        

       var getimagequery = 'SELECT * FROM productimages WHERE productId ='+ req.params.product_id ;
       console.log(getimagequery);
       con.query(getimagequery, function (error, imageresult){
        if(error)
        return  res.json({success:false,message:'You have an error in query ' + getimagequery});

        var cquery=`select c.category_name,sc.subcategory_name from product p, productcategory c,subcategory sc 
        where p.category_id =c.category_id and 
        sc.subcategory_id=p.subcategory_id and p.product_id=${req.params.product_id}`;

        console.log(cquery);
        con.query(cquery,function(errc,cresult){
          if(errc)
            return  res.json({success:false,message:'You have an error in query ' + cquery});

           var relatedquery=`select p.*,pm.base64Arr from product p inner join productimages pm  on p.product_id=pm.productId 
           and p.category_id=${result[0].category_id} group by p.product_id;`


           console.log(relatedquery);

           con.query(relatedquery,function(relatederr,relatedresult){
            if(relatederr)
              return  res.json({success:false,message:'You have an error in query ' + relatedquery});
            else
              return res.json({success:true,message:'data fetched successfully',
              imageresult:imageresult,result:result,cresult:cresult,relatedresult:relatedresult});

              })
                
            })       
 
        });


      
      })
    
     });
   });



 // product update api

 app.post('/api/updateproduct',(req,res)=>{
  var query = "update product set product_name ='"+ req.body.product_name 
  +"' "+","+ "price='"+req.body.price 

  +"' "+","+ "manufacture='"+ req.body.manufacture + "', verified = "+req.body.isverified+" where product_id ="+req.body.product_id +"";

 try{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase",
    multipleStatements:true
  });
    con.connect(function(err) {
        if (err)  
        return res.json({success:false, message:'database not connected'});
        
          console.log("Connected!");
        
            con.query(query, function (error, result) {
          
              if (error) 
              return res.status(200).send({success:false,message:'You have an error in query ' + query + error})
              // res.json({success:false,message:'You have an error in query ' + query + error, haseeb: 'jar khan'});

                console.log(result);
            
                  var queryStart =  `delete from productimages where productId=${req.body.product_id};`+"INSERT INTO productimages (base64Arr,productId) values";
                  var recArr=[];
                  req.body.base64Arr.forEach(element => {
                      SaveImageInDisk(element,function(Err,imageUrl){
                        var queryI =  `('${imageUrl}','${req.body.product_id}')`
                        recArr.push(queryI); 
                            if(recArr.length == req.body.base64Arr.length){
                                queryStart += recArr.toString();
                                con.query(queryStart, function (error1, result1){
                                  if (error1) 
                                    return res.json({success:false,message:'You have an error in query ' + queryStart + error1});
                                    
                                    return res.json({success:true,message:'data inserted successfully'});
                                })
                            }          
                      });                             
                  });
          });
      });
 }catch(e){
  debugger;
  res.json({success:false, message:e});
 }

 });

// delete product data api

 app.post('/api/deleteproduct',(req,res)=>{
  var query = "delete from product where product_id="+req.body.product_id+"";
  var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
      return res.json({success:false, message:'database not connected'});
     
       console.log("Connected!");
     
       con.query(query, function (error, result) {
     
         if (error) 
         return res.json({success:false,message:'You have an error in query ' + query + error});
 
       console.log(result);
      return res.json({success:true,message:'data deleted successfully'});
     });
   });
});


//product section is ended 

// product feature section is started 

app.get('/api/getproductfeatures',(req,res)=>{
   
  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      
        con.query("select * from productfeatures pf inner join product p on pf.product_id = p.product_id;", function (err, result) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query ' + query});
  
        console.log(result);
          return res.json({success:true,message:'data fetched successfully',result:result});
      });
    });
});


//post product // save product features api 

app.post('/api/saveproductfeatures',(req,res)=>{

  var query = `INSERT INTO productfeatures (size,expiry,weight,quality)
   VALUES ('${req.body.size}',

   '${req.body.expiry}','${req.body.weight}',

   '${req.body.quality}');`
  
  
  
    var con = mysql.createConnection({
       host: "localhost",
       user: "root",
       password: "haseeb",
       database:"webdatabase"
     });
   con.connect(function(err) {
       if (err)  
        return res.json({success:false, message:'database not connected'});
       
         console.log("Connected!");
       
         con.query(query, function (error, result) {
       
           if (error) 
           return res.json({success:false,message:'You have an error in query ' + query + error});
   
         console.log(result);
        return res.json({success:true,message:'data inserted successfully'});
       });
     });
   });

// get  productfeature by id  api section 

app.get('/api/getproductfeaturebyid/:feature_id',(req,res)=>{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
      return res.json({ success:false,message:'database not connected'});
    
      console.log("Connected!");
      var query = 'SELECT * FROM productfeatures WHERE feature_id ='+ req.params.feature_id ;
      console.log(query);
      
      con.query(query, function (error, result) {
    
        if (error) 
        return  res.json({success:false,message:'You have an error in query ' + query});

      console.log(result);
      return res.json({success:true,message:'data fetched successfully',result:result});
    });
  });

});

// post update productfeatures api section 

app.post('/api/updateproductfeatures',(req,res)=>{

  var query = "update productfeatures set size ='"+ req.body.size 

  +"' "+","+ "expiry='"+req.body.expiry

  +"' "+","+ "weight='"+req.body.weight

  +"' "+","+ "quality='"+req.body.quality
  
  
  + "' where feature_id ="+req.body.feature_id +"";

 try{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
     return res.json({success:false, message:'database not connected'});
    
      console.log("Connected!");
    
      con.query(query, function (error, result) {
    
        if (error) 
         return res.status(200).send({success:false,message:'You have an error in query ' + query + error})

      console.log(result);
     return res.json({success:true,message:'data updated successfully'});
    });
  });
 }catch(e){
  debugger;
  res.json({success:false, message:e});
 }

 });

 // delete product feature api 
 app.post('/api/deleteproductfeatures',(req,res)=>{
  var query = "delete from productfeatures where feature_id="+req.body.feature_id+"";
  var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
      return res.json({success:false, message:'database not connected'});
     
       console.log("Connected!");
     
       con.query(query, function (error, result) {
     
         if (error) 
         return res.json({success:false,message:'You have an error in query ' + query + error});
 
       console.log(result);
      return res.json({success:true,message:'data deleted successfully'});
     });
   });
});








// User_type section is started

app.get('/api/getusertype',(req,res)=>{

  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      
        con.query("SELECT *,(select count(*) from users as u where u.user_type_id = ut.user_type_id )  As Count  FROM usertype as ut", function (err, result) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query ' + query});
  
        console.log(result);
          return res.json({success:true,message:'data fetched successfully',result:result});
      });
    });
});


// user type post method 

app.post('/api/saveusertype',(req,res)=>{

  var query = `INSERT INTO usertype(user_type_name) VALUES('${req.body.user_type_name}');`
  

  
  
    var con = mysql.createConnection({
       host: "localhost",
       user: "root",
       password: "haseeb",
       database:"webdatabase"
     });
   con.connect(function(err) {
       if (err)  
        return res.json({success:false, message:'database not connected'});
       
         console.log("Connected!");
       
         con.query(query, function (error, result) {
       
           if (error) 
           return res.json({success:false,message:'You have an error in query ' + query + error});
   
         console.log(result);
        return res.json({success:true,message:'data inserted successfully'});
       });
     });
   });


// user type update method API

app.post('/api/updateusertype',(req,res)=>{
  var query = "update usertype set user_type_name ='"+ req.body.user_type_name 
  + "' where user_type_id ="+req.body.user_type_id +"";

 try{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
     return res.json({success:false, message:'database not connected'});
    
      console.log("Connected!");
    
      con.query(query, function (error, result) {
    
        if (error) 
         return res.status(200).send({success:false,message:'You have an error in query ' + query + error})
        // res.json({success:false,message:'You have an error in query ' + query + error, haseeb: 'jar khan'});

      console.log(result);
     return res.json({success:true,message:'data updated successfully'});
    });
  });
 }catch(e){
  debugger;
  res.json({success:false, message:e});
 }

 });

 // get usertype by id 

 app.get('/api/getusertypebyid/:user_type_id',(req,res)=>{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
      return res.json({ success:false,message:'database not connected'});
    
      console.log("Connected!");
      var query = 'SELECT * FROM usertype WHERE user_type_id ='+ req.params.user_type_id ;
      console.log(query);
      
      con.query(query, function (error, result) {
    
        if (error) 
        return  res.json({success:false,message:'You have an error in query ' + query});

      console.log(result);
      return res.json({success:true,message:'data fetched successfully',result:result});
    });
  });

})

// delete user type api 

app.post('/api/deleteusertype',(req,res)=>{
  var query = "delete from usertype where user_type_id="+req.body.user_type_id+"";
  var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
      return res.json({success:false, message:'database not connected'});
     
       console.log("Connected!");
     
       con.query(query, function (error, result) {
     
         if (error) 
         return res.json({success:false,message:'You have an error in query ' + query + error});
 
       console.log(result);
      return res.json({success:true,message:'data deleted successfully'});
     });
   });
});



//login api 

 app.post('/api/login',(req,res)=>{

  var con = mysql.createConnection(Configs);
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
         //check user type id from table
         var verifierId = 22; //from db

        var query1= `select *,(select user_type_name from usertype as ut where ut.user_type_id = u.user_type_id limit 1) as 'user_type_name' from users as u where  u.user_name='${req.body.user_name}' and u.password='${req.body.password}';`;
        con.query(query1, function (err, selectUserResult) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query ' + query1});
    
          if(selectUserResult && selectUserResult.length <1)
          return  res.json({success:false,message:'Invalid Username and password'});
        
          console.log(selectUserResult);
        
          return res.json({success:true,message:'data fetched successfully',result:selectUserResult});
      });
    });
});

app.post('/api/register',(req,res)=>{

  var con = mysql.createConnection(Configs);
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
       
        var username = req.body.username;
        con.query(`select * from users where user_name='${username}'`, function (error, userSelectResult) {
        console.log(userSelectResult);
       
        if(userSelectResult && userSelectResult.length > 0)
             return res.json({success:false,message:'user name already taken'});
             else{
              var password = req.body.password;
              var address = req.body.address;
              var phone = req.body.phone;
              var usertype = req.body.usertype;
              //check user type id from table
              var verifierId = 22; //from db
              var activeStatus = usertype == verifierId ? 0 : 1
              var name = req.body.full_name;
              var email = req.body.email;
              var query1= `insert into users(user_name,user_phone,user_email,user_type_id,active,address,password,full_name) 
              values('${username}','${phone}','${email}',${usertype},${activeStatus},'${address}','${password}','${name}');`;
              
              con.query(query1, function (insertUsererr, insertUserResult) {
            
                if (insertUsererr) 
                return  res.json({success:false,message:'You have an error in query ' + query1 + insertUsererr});
        
                console.log(insertUserResult);
                return res.json({success:true,message:'data fetched successfully',result:insertUserResult});
            });

             }
      });      
    });
});


// start user section  

 // get user api



 app.get('/api/getusers',(req,res)=>{

  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      
        con.query(`select u.*,c.category_name from users u LEFT JOIN  
        productcategory c on u.category_id = c.category_id ;`, function (err, result) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query ' + query});
  
        console.log(result);
          return res.json({success:true,message:'data fetched successfully',result:result})
      });
    });
});

// post user api 

app.post('/api/saveusers',(req,res)=>{

  
  var query = `INSERT INTO users (user_name,user_phone,user_email,address,password,full_name,user_type_id,category_id,active,city)
   VALUES ('${req.body.user_name}','${req.body.user_phone}','${req.body.user_email}','${req.body.user_address}','${req.body.password}',
   '${req.body.full_name}','${req.body.user_type_id}',${req.body.category_id},1,'${req.body.city}');`

  
  
    var con = mysql.createConnection({
       host: "localhost",
       user: "root",
       password: "haseeb",
       database:"webdatabase"
     });

   con.connect(function(err) {
       if (err)  
        return res.json({success:false, message:'database not connected'});
       
         console.log("Connected!");
         var username = req.body.user_name;
         
         con.query(`select * from users where user_name='${username}'`, function (error, userSelectResult) {
         console.log(userSelectResult);
        
         if(userSelectResult && userSelectResult.length > 0)
              return res.json({success:false,message:'user name already taken'});
              else{
                con.query(query, function (error, result) {
       
                  if (error) 
                  return res.json({success:false,message:'You have an error in query ' + query + error});
          
                console.log(result);
                  return res.json({success:true,message:'User Added successfully'});
              });
              }
        
        });


     });
   });


// get user by id  api
app.get('/api/getuserbyid/:user_id',(req,res)=>{
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "haseeb",
    database:"webdatabase"
  });
con.connect(function(err) {
    if (err)  
      return res.json({ success:false,message:'database not connected'});
    
      console.log("Connected!");
      var query = 'SELECT * FROM users WHERE user_id ='+ req.params.user_id ;
      console.log(query);
      
      con.query(query, function (error, result) {
    
        if (error) 
        return  res.json({success:false,message:'You have an error in query ' + query});

      console.log(result);
      return res.json({success:true,message:'data fetched successfully',result:result});
    });
  });

})


// user update api

app.post('/api/updateuser',(req,res)=>{
 var query = `update users set user_name ='${req.body.user_name}' ,
 user_phone='${req.body.user_phone}' ,user_email='${req.body.user_email}',city='${req.body.city}',
 active =${req.body.active},category_id=${req.body.category_id} 
 where user_id =${req.body.user_id}` ;

try{
 var con = mysql.createConnection({
   host: "localhost",
   user: "root",
   password: "haseeb",
   database:"webdatabase"
 });
con.connect(function(err) {
   if (err)  
    return res.json({success:false, message:'database not connected'});
   
     console.log("Connected!");
   
     con.query(query, function (error, result) {
   
       if (error) 
        return res.status(200).send({success:false,message:'You have an error in query ' + query + error})
       // res.json({success:false,message:'You have an error in query ' + query + error, haseeb: 'jar khan'});

     console.log(result);
    return res.json({success:true,message:'data updated successfully'});
   });
 });
}catch(e){
 debugger;
 res.json({success:false, message:e});
}

});

//getfilter city 

app.post('/api/getFilteredcity',(req,res)=>{
   
  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      var cityqueryFilter = `select * from users where city= ${req.body.filter} `;
        con.query(cityqueryFilter, function (cityerr, cityresult) {
      
          if (cityerr) 
          return  res.json({success:false,message:'You have an error in query ' + cityqueryFilter});
  
        console.log(result);
          return res.json({success:true,message:'data fetched successfully',cityresult:cityresult});
      });
    });
});

// delete user data api 

app.post('/api/deleteuser',(req,res)=>{
  var query = "delete from users where user_id="+req.body.user_id+"";
  var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
      return res.json({success:false, message:'database not connected'});
     
       console.log("Connected!");
     
       con.query(query, function (error, result) {
     
         if (error) 
         return res.json({success:false,message:'You have an error in query ' + query + error});
 
       console.log(result);
      return res.json({success:true,message:'data deleted successfully'});
     });
   });
});

// contact us api 

app.get('/api/getcontactus',(req,res)=>{

  var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "haseeb",
      database:"webdatabase"
    });
  con.connect(function(err) {
      if (err)  
        return res.json({success:false,message:'database not connected'});
      
        console.log("Connected!");
      var query="select * from contactusinfo;";
        con.query(query, function (err, contactresult) {
      
          if (err) 
          return  res.json({success:false,message:'You have an error in query ' + query});

          return res.json({success:true,message:'data fetched successfully',contactresult:contactresult});
      });
    });
});

//save contactus info 

app.post('/api/savecontactus',(req,res)=>{

  
  var query = `INSERT INTO contactusinfo (name,contactemail,message)
   VALUES ('${req.body.name}','${req.body.contactemail}','${req.body.message}');`

  
  
    var con = mysql.createConnection({
       host: "localhost",
       user: "root",
       password: "haseeb",
       database:"webdatabase"
     });
   con.connect(function(err) {
       if (err)  
        return res.json({success:false, message:'database not connected'});
       
         console.log("Connected!");
       
         con.query(query, function (error, contactresult) {
       
           if (error) 
           return res.json({success:false,message:'You have an error in query ' + query + error});
          
          return res.json({success:true,message:'data inserted successfully'});
       });
     });
   });

//delete contact us 

app.post('/api/deletecontactus',(req,res)=>{
  var query = "delete from contactusinfo where contact_id="+req.body.contact_id+"";
  var con = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "haseeb",
     database:"webdatabase"
   });
 con.connect(function(err) {
     if (err)  
      return res.json({success:false, message:'database not connected'});
     
       console.log("Connected!");
     
       con.query(query, function (error, deleteresult) {
     
         if (error) 
         return res.json({success:false,message:'You have an error in query ' + query + error});

         return res.json({success:true,message:'data deleted successfully'});
     });
   });
});





app.listen(port,()=>{
    console.log("4000 is runing ");
});




function uuidv4() {
  return (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
}


function SaveImageInDisk(base64,callback){
  try{
    var imagefilename = uuidv4();
  var imageUrl = "http://localhost:8084/"+imagefilename;
  base64Img5.img(base64, 'E:\\hostedapps\\app2\\', imagefilename, function(err, filepath) {
    if(err){
      callback(err,base64);
    }
    else{
      var filepathArr = filepath.split(".");
      imageUrl += "."+filepathArr[filepathArr.length-1];
      callback(null,imageUrl);
    }
  });
  }catch(e){
    callback(e,base64);
   }
}