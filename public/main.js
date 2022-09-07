const socket = io.connect();

async function fetchTemplate(listItems, url, domElem) {
  const template = await fetch(url);
  const textTemplate = await template.text();
  const functionTemplate = Handlebars.compile(textTemplate);
  const html = functionTemplate({ listItems });
  document.querySelector(domElem).innerHTML = html;
}

window.addEventListener('DOMContentLoaded', loadProducts);

const inputTitle = document.querySelector('#title');
const inputPrice = document.querySelector('#price');
const inputThumbail = document.querySelector('#thumbail');

const inputNameMessage = document.querySelector('#nameMessage');
const inputMessage = document.querySelector('#message');
const textAlert = document.querySelector('#alert');
const btnSendMessage = document.querySelector('#sendMessage');
btnSendMessage.addEventListener('click', sendMessage);

function validateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
}

function sendMessage() {
  const date = moment().format('DD/MM/YYYY HH:mm:ss');
  if (validateEmail(inputNameMessage.value)) {
    const newMessage = {
      name: inputNameMessage.value,
      message: inputMessage.value,
      date: `[${date}]`,
    };

    socket.emit('new-message', newMessage);

    inputMessage.value = '';
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

socket.on('mensajes', function (mensajes) {
  fetchTemplate(mensajes, '/templates/chat.hbs', '#chat');
});
