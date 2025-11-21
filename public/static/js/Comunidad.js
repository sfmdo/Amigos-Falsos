document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const sidebarUsername = document.getElementById('sidebar-username');
    const friendsListContainer = document.getElementById('friends-list');
    const logoutBtn = document.getElementById('logout-btn');
    const btnComunidad = document.getElementById('btn-comunidad');
    const btnMiLista = document.getElementById('btn-mi-lista');


    const API_URL = '/api';
    const POLLING_INTERVAL = 10000; // 10 segundos
    let usuarioId = null;
    let currentView = '/mi-lista'; // Vista por defecto

    const colorPalette = [
        '#B4B4B4', '#A7A7A7', '#9A9A9A', '#8D8D8D', '#808080',
        '#737373', '#666666', '#595959', '#4C4C4C', '#3B3B3B'
    ];

    // Cookies
    const getCookie = (name) => document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop() || null;
    const deleteCookie = (name) => document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;

    //Funciones principales

    async function fetchUserData() {
        try {
            const response = await fetch(`${API_URL}/usuario/${usuarioId}`);
            if (!response.ok) throw new Error('Usuario no encontrado');
            const user = await response.json();
            sidebarUsername.textContent = user.nombre_usuario;
        } catch (error) {
            console.error('Error fetching username:', error);
            sidebarUsername.textContent = 'Error';
        }
    }

    // Función unificada para renderizar tarjetas
    function renderCards(friends) {
        friendsListContainer.innerHTML = '';
        if (!friends || friends.length === 0) {
            const message = currentView === 'mi-lista' ? 'Tu lista está vacía.' : 'No hay publicaciones en la comunidad.';
            friendsListContainer.innerHTML = `<p style="text-align: center;">${message}</p>`;
            return;
        }

        friends.forEach(friend => {
            const card = document.createElement('div');
            card.className = 'friend-card';

            const nivel = friend.N_Traicion;
            if (nivel >= 1 && nivel <= 10) {
                card.style.backgroundColor = colorPalette[nivel - 1];
                if (nivel >= 5) {
                    card.style.color = 'white';
                } else {
                    card.style.color = '#333'; // Texto oscuro para fondos claros
                }
            }
            
            card.innerHTML = `
                <div class="card-content">
                    <div class="card-header">
                        <span>${friend.Nombre}</span>
                        <span>${new Date(friend.Fecha).toLocaleDateString()}</span>
                        <span>Nivel: ${friend.N_Traicion}</span>
                    </div>
                    <p class="card-description">${friend.Descripcion}</p>
                    <p class="card-author">Autor: ${friend.EsAnonimo ? 'Anónimo' : friend.AutorNombre}</p>
                </div>
            `;
            friendsListContainer.appendChild(card);
        });
    }

    // Otener datos de la vista actual
    async function fetchData() {
        const url = currentView === 'mi-lista' 
            ? `${API_URL}/amigosfalsos/usuario/${usuarioId}`
            : `${API_URL}/amigosfalsos/comunidad`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            renderCards(data);
        } catch (error) {
            console.error(`Error fetching data for ${currentView}:`, error);
        }
    }
    

    // Inicializacion y events listeners
    function init() {
        usuarioId = getCookie('usuarioId');
        if (!usuarioId) {
            window.location.href = '/login';
            return;
        }

        fetchUserData();
        fetchData(); 

        setInterval(fetchData, POLLING_INTERVAL);

        btnMiLista.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/mi-lista';
        });

        btnComunidad.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('Comunidad');
        });

        logoutBtn.addEventListener('click', () => {
            deleteCookie('usuarioId');
            window.location.href = 'login.html';
        });
    }

    init();

    
});