import express from 'express';
import { faker } from '@faker-js/faker/locale/es';
import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { urlJson, urlDb, urlMongo } from './DB/config.js';
import { ContenedorMongoDb } from './contenedores/ContenedorMongoDb.js';
import { ContenedorFirebase } from './contenedores/ContenedorFirebase.js';
import { Mensaje } from './models/mensaje.js';
import { normalize, schema } from 'normalizr';
import util from 'util';
import moment from 'moment';

function print(objeto) {
  console.log(util.inspect(objeto, false, 12, true), {
    length: JSON.stringify(objeto).length,
  });
}

const miContenedorMongoDB = new ContenedorMongoDb(urlMongo, Mensaje);
const miContenedorFirebase = new ContenedorFirebase(urlJson, urlDb, 'ecommerce');

const newMensaje = {
  author: {
    id: 'leandro@anda.com',
    nombre: 'Leandro',
    apellido: 'Tabak',
    edad: '35',
    alias: 'Rulo',
    avatar: 'urlcopada',
  },
  text: 'Probando esta garompa',
  fyh: `[${moment().format('DD/MM/YYYY HH:mm:ss')}]`,
};

// //Guardar mensajes en Mongo
// const saveMensajeMongoDB = async (mensaje) => {
//   for (let i = 0; i < 10; i++) await miContenedorMongoDB.save(mensaje);
// };
// saveMensajeMongoDB(newMensaje);
// //Guardar mensajes en Firebase
// const saveMensajeFirebase = async (mensaje) => {
//   miContenedorFirebase.save(mensaje);
// };
// saveMensajeFirebase(newMensaje);

//get mensajes en Mongo;
const getMensajes = async () => {
  const arrayMensajes = await miContenedorMongoDB.getAll();
  const miObjetoMensajes = { id: 'mensajes', mensajes: arrayMensajes };

  const authorSchema = new schema.Entity('authors');

  const mensajeSchema = new schema.Entity('mensajes', { authors: [authorSchema] });

  const normalizedData = normalize(miObjetoMensajes, mensajeSchema);

  print(normalizedData);
};
getMensajes();
// function sendMessage() {
//   const date = moment().format('DD/MM/YYYY HH:mm:ss');
//   if (validateEmail(inputNameMessage.value)) {
//     const newMessage = {
//       name: inputNameMessage.value,
//       message: inputMessage.value,
//       date: `[${date}]`,
//     };

//     socket.emit('new-message', newMessage);

//     inputMessage.value = '';
//     textAlert.innerText = '';
//   } else {
//     textAlert.innerText = 'Por favor, ingresa una dirección de email válida';
//   }
// }

//Script para crear tabla productos en la db_productos
// const createTableProductos = async () => {
//   try {
//     await knexMDB.schema.createTable('products', (table) => {
//       table.increments('id');
//       table.string('title', 15);
//       table.float('price');
//       table.string('thumbnail');
//     });
//     console.log('Table products created');
//   } catch (err) {
//     console.log(err);
//   }
// };

// createTableProductos();

//Script para crear tabla mensajes en la db ecommerce
// const createTableMensajes = async () => {
//   try {
//     await knexSDB.schema.createTable('messages', (table) => {
//       table.increments('id');
//       table.string('name', 15);
//       table.string('message', 80);
//       table.string('date', 25);
//     });
//     console.log('Table messages created');
//   } catch (err) {
//     console.log(err);
//   }
// };
// createTableMensajes();

//Lista inicial de mensajes para cargar en la base de datos
// const mensajes = [
//   { name: 'carlos@hotmail.com', message: 'Hola!', date: '[03/08/2022 18:08:76]' },
//   { name: 'juan@gmail.com', message: 'Bien! Vos?', date: '[03/08/2022 18:08:76]' },
//   { name: 'carlos@hotmail.com', message: 'Todo bien por suerte!', date: '[03/08/2022 18:08:76]' },
// ];

// const myContenedorProducts = new Contenedor(optionsMariaDB, 'products'); // creo un objeto contenedor para los productos en la db_products
// const myContenedorMensajes = new Contenedor(optionsSqliteDB, 'messages'); // creo un objeto contenedor para los productos en la productsDB

//Script inicial para insertar los productos en la DB
// const execute = async () => {
//   await myContenedorProducts.save(productos);
//   const articulos = await myContenedorProducts.getAll();
//
// };
// execute();

//Script inicial para insertar los mensajes en la DB
// const execute = async () => {
//   // await myContenedorMensajes.save(mensajes);
//   const mensajes = await myContenedorMensajes.getAll();
//   console.log(mensajes);
// };
// execute();

function createRandomProduct() {
  return {
    nombre: faker.commerce.product(),
    precio: faker.commerce.price(),
    fotoUrl: faker.image.avatar(),
  };
}

const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('./public'));

const PORT = 8080;

httpServer.listen(PORT, function () {
  console.log('Servidor corriendo en http://localhost:8080');
});

app.get('/api/productos-test', (req, res) => {
  const qtyProducts = parseInt(req.query.cant) || 5;
  const fakeProducts = [];
  let id = 1;
  for (let i = 0; i < qtyProducts; i++) fakeProducts.push({ id: id++, ...createRandomProduct() });
  res.status(200).send(fakeProducts);
});

io.on('connection', async (socket) => {
  console.log('Un cliente se ha conectado');

  // const mensajes = [];
  // const mensajes = await myContenedorMensajes.getAll();
  // socket.emit('mensajes', mensajes);

  socket.on('new-product', async (newProduct) => {
    productos.push(newProduct);

    io.sockets.emit('productos', productos);
  });
  socket.on('new-message', async (newMessage) => {
    // await myContenedorMensajes.save(newMessage);
    // const mensajes = await myContenedorMensajes.getAll();
    const mensajes = [];

    io.sockets.emit('mensajes', mensajes);
  });
});

httpServer.on('error', (error) => console.log(`Error en el servidor: ${error}`));
