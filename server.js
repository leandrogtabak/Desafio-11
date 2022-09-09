import express from 'express';
import { faker } from '@faker-js/faker/locale/es';
import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { urlJson, urlDb, urlMongo } from './DB/config.js';
import { ContenedorMongoDb } from './contenedores/ContenedorMongoDb.js';
import { ContenedorFirebase } from './contenedores/ContenedorFirebase.js';
import { ContenedorArchivo } from './contenedores/ContenedorArchivo.js';
import { Mensaje } from './models/mensaje.js';
import { normalize, schema } from 'normalizr';
import util from 'util';
import moment from 'moment';

function print(objeto) {
  console.log(util.inspect(objeto, false, 12, true), {
    length: JSON.stringify(objeto).length,
  });
}

// const miContenedorMongoDB = new ContenedorMongoDb(urlMongo, Mensaje);   //probar mongo descomentando esto y usand en las funciones de abajo, a este contenedor
// const miContenedorFirebase = new ContenedorFirebase(urlJson, urlDb, 'ecommerce'); //probar firebase descomentando esto y usand en las funciones de abajo, a este contenedor
const miContenedorArchivo = new ContenedorArchivo('./mensajes.json');

/* ESQUEMAS PARA NORMALIZER */

// Definimos un esquema de autor
const schemaAuthor = new schema.Entity('author', {}, { idAttribute: 'email' });
// Definimos un esquema de mensaje
const schemaMensaje = new schema.Entity('post', { author: schemaAuthor }, { idAttribute: 'id' });
// Definimos un esquema de posts
const schemaMensajes = new schema.Entity('posts', { mensajes: [schemaMensaje] }, { idAttribute: 'id' });

async function createRandomProduct() {
  return {
    nombre: faker.commerce.product(),
    precio: faker.commerce.price(),
    fotoUrl: faker.image.avatar(),
  };
}

async function getAndEmit(container, id) {
  const arrayMensajes = await container.getAll();
  const miObjetoMensajes = { id: id, mensajes: arrayMensajes };
  const normalizedData = normalize(miObjetoMensajes, schemaMensajes);
  io.sockets.emit(id, normalizedData);
}
async function saveByContainer(container, message) {
  const mensajes = await container.getAll();
  let id = mensajes && mensajes.length !== 0 ? mensajes[mensajes.length - 1].id + 1 : 1;
  await container.save({ ...message, id: id });
}
async function deleteByContainer(container) {
  await container.deleteAll();
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

app.get('/api/productos-test', async (req, res) => {
  const qtyProducts = parseInt(req.query.cant) || 5;
  const fakeProducts = [];
  let id = 1;
  for (let i = 0; i < qtyProducts; i++) fakeProducts.push({ id: id++, ...(await createRandomProduct()) });
  res.status(200).send(fakeProducts);
});

io.on('connection', async (socket) => {
  console.log('Un cliente se ha conectado');
  await getAndEmit(miContenedorArchivo, 'mensajes');

  socket.on('new-message', async (newMessage) => {
    await saveByContainer(miContenedorArchivo, newMessage);
    await getAndEmit(miContenedorArchivo, 'mensajes');
  });
  socket.on('delete-messages', async () => {
    await deleteByContainer(miContenedorArchivo);
    await getAndEmit(miContenedorArchivo, 'mensajes');
  });
});

httpServer.on('error', (error) => console.log(`Error en el servidor: ${error}`));
