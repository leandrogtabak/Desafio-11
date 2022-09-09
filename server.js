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
// const miContenedorFirebase = new ContenedorFirebase(urlJson, urlDb, 'ecommerce');

// const newMensaje = {
//   author: {
//     email: 'leandro@gmail.com',
//     nombre: 'Leandro',
//     apellido: 'Tabak',
//     edad: '35',
//     alias: 'Rulo',
//     avatar: 'http://LeandroAvatar',
//   },
//   text: 'Sisi, creo que para entenderlo bien hay que leer con mucho detenimiento',
//   fyh: `[${moment().format('DD/MM/YYYY HH:mm:ss')}]`,
//   id: 1,
// };

//Guardar mensajes en Mongo
// const saveMensajeMongoDB = async (mensaje) => {
//   for (let i = 0; i < 1; i++) await miContenedorMongoDB.save(mensaje);
// };
// saveMensajeMongoDB(newMensaje);

// //Guardar mensajes en Firebase
// const saveMensajeFirebase = async (mensaje) => {
//   miContenedorFirebase.save(mensaje);
// };
// saveMensajeFirebase(newMensaje);

/* ESQUEMAS PARA NORMALIZER */

// Definimos un esquema de autor
const schemaAuthor = new schema.Entity('author', {}, { idAttribute: 'email' });

// Definimos un esquema de mensaje
const schemaMensaje = new schema.Entity('post', { author: schemaAuthor }, { idAttribute: 'id' });

// Definimos un esquema de posts
const schemaMensajes = new schema.Entity('posts', { mensajes: [schemaMensaje] }, { idAttribute: 'id' });

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

  const arrayMensajes = await miContenedorMongoDB.getAll();
  const miObjetoMensajes = { id: 'mensajes', mensajes: arrayMensajes };
  const normalizedData = normalize(miObjetoMensajes, schemaMensajes);
  io.sockets.emit('mensajes', normalizedData);

  socket.on('new-message', async (newMessage) => {
    const mensajes = await miContenedorMongoDB.getAll();
    let id = mensajes[mensajes.length - 1] ? mensajes[mensajes.length - 1].id + 1 : 1;
    await miContenedorMongoDB.save({ ...newMessage, id: id });

    const arrayMensajes = await miContenedorMongoDB.getAll();
    const miObjetoMensajes = { id: 'mensajes', mensajes: arrayMensajes };
    const normalizedData = normalize(miObjetoMensajes, schemaMensajes);
    io.sockets.emit('mensajes', normalizedData);
  });
  socket.on('delete-messages', async () => {
    await miContenedorMongoDB.deleteAll();
    const mensajesActualizados = await miContenedorMongoDB.getAll();
    io.sockets.emit('mensajes', mensajesActualizados);
  });
});

httpServer.on('error', (error) => console.log(`Error en el servidor: ${error}`));
