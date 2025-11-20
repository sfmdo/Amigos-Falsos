const mysql = require('mysql2');

const connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"amigosfalsos"
});

connection.connect((err)=>{
    if(err){
        console.log("Error al conectar", err);
    } else{
        console.log("Conexion a la base de datos exitosa");
    }
});
module.exports = connection;