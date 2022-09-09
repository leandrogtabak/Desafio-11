const socket = io.connect();

async function fetchTemplate(listItems, url, domElem) {
  const template = await fetch(url);
  const textTemplate = await template.text();
  const functionTemplate = Handlebars.compile(textTemplate);
  const html = functionTemplate({ listItems });
  document.querySelector(domElem).innerHTML = html;
}

window.addEventListener('DOMContentLoaded', loadProducts);

/* Seleccion de elementos HTML */
const inputEmailMessage = document.querySelector('#emailMessage');
const inputNombreMessage = document.querySelector('#nombreMessage');
const inputApellidoMessage = document.querySelector('#apellidoMessage');
const inputEdadMessage = document.querySelector('#edadMessage');
const inputAliasMessage = document.querySelector('#aliasMessage');
const inputAvatarMessage = document.querySelector('#avatarMessage');
const inputTextMessage = document.querySelector('#textMessage');
const textAlert = document.querySelector('#alert');
const textCompresion = document.querySelector('#compresionLabel');

const btnSendMessage = document.querySelector('#sendMessage');
const btnDeleteMessages = document.querySelector('#deleteMessages');

btnSendMessage.addEventListener('click', sendMessage);
btnDeleteMessages.addEventListener('click', deleteMessages);

/* Defino los esquemas, que son los mismos con los que se normaliza */
// Definimos un esquema de autor
const schemaAuthor = new normalizr.schema.Entity('author', {}, { idAttribute: 'email' });
// Definimos un esquema de mensaje
const schemaMensaje = new normalizr.schema.Entity('post', { author: schemaAuthor }, { idAttribute: 'id' });
// Definimos un esquema de posts
const schemaMensajes = new normalizr.schema.Entity('posts', { mensajes: [schemaMensaje] }, { idAttribute: 'id' });

function validateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
}

function deleteMessages() {
  socket.emit('delete-messages');
}

function sendMessage() {
  const fyh = moment().format('DD/MM/YYYY HH:mm:ss');
  if (validateEmail(inputEmailMessage.value)) {
    const newMensaje = {
      author: {
        email: inputEmailMessage.value,
        nombre: inputNombreMessage.value,
        apellido: inputApellidoMessage.value,
        edad: inputEdadMessage.value,
        alias: inputAliasMessage.value,
        avatar: inputAvatarMessage.value,
      },
      text: inputTextMessage.value,
      fyh: `[${fyh}]`,
    };
    socket.emit('new-message', newMensaje);

    inputTextMessage.value = '';
    textAlert.innerText = '';
  } else {
    textAlert.innerText = 'Por favor, ingresa una dirección de email válida';
  }
}

function loadProducts() {
  fetch('http://localhost:8080/api/productos-test', {
    method: 'GET',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((data) => data.json())
    .then((productos) => {
      fetchTemplate(productos, '/templates/productos.hbs', '#productos');
    });
}

socket.on('mensajes', function (normalizedMensajes) {
  const lengthNormalizedMensajes = JSON.stringify(normalizedMensajes).length;
  const denormalizedMensajes = normalizr.denormalize(normalizedMensajes.result, schemaMensajes, normalizedMensajes.entities);
  const lengthDenormalizedMensajes = JSON.stringify(denormalizedMensajes).length;
  const porcentajeCompresion = parseInt((lengthNormalizedMensajes / lengthDenormalizedMensajes) * 100);
  if (porcentajeCompresion <= 100) {
    textCompresion.innerText = `(Compresion: ${porcentajeCompresion}%)`;
  } else {
    textCompresion.innerText = `(Compresion: N/A)`;
  }

  const mensajes = denormalizedMensajes.mensajes;
  mensajes !== undefined && fetchTemplate(mensajes, '/templates/chat.hbs', '#chat');
});
