// Tutor con IA a página completa (conversación general, no ligada a una lección).
import { iniciarPagina, $ } from '../core.js';
import { crearTutor } from '../tutor.js';

iniciarPagina();
const { panel } = crearTutor({ paginaCompleta: true });
$('#tutorHost').append(panel);
const q = new URLSearchParams(location.search).get('q');
if (q) panel.querySelector('textarea').value = q.slice(0, 500);
