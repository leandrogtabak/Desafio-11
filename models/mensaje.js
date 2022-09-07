//Schema mensaje para MongoDB

import mongoose from 'mongoose';

const mensajesCollection = 'mensajes';

const AuthorSchema = mongoose.Schema({
  id: { type: String, required: true, maxLength: 50 },
  nombre: { type: String, required: true, maxLength: 50 },
  apellido: { type: String, required: true, maxLength: 50 },
  edad: { type: String, required: true, maxLength: 3 },
  alias: { type: String, required: true, maxLength: 50 },
  avatar: { type: String, required: true, maxLength: 50 },
});

const mensajeSchema = new mongoose.Schema({
  author: { type: AuthorSchema },
  text: { type: String, required: true, maxLength: 500 },
  fyh: { type: String, required: true, maxLength: 50 },
});

export const Mensaje = mongoose.model(mensajesCollection, mensajeSchema);
