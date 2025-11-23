document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const sidebarUsername = document.getElementById('sidebar-username');
    const friendsListContainer = document.getElementById('friends-list');
    const addFriendBtn = document.getElementById('add-friend-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Modales
    const friendModal = document.getElementById('friend-modal');
    const publishModal = document.getElementById('publish-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');

    // Formularios y botones
    const friendForm = document.getElementById('friend-form');
    const publishForm = document.getElementById('publish-form');
    const modalActionBtn = document.getElementById('modal-action-btn');
    
    // --- DATOS GLOBALES ---
    const API_URL = '/api';
    let usuarioId = null;
    let username = 'Usuario';
    let pendingPublishId = null; // ID de la traición pendiente de publicar
    let pendingDeleteId = null; // ID de la traición pendiente de eliminar

    const colorPalette = [
        '#B4B4B4', // Nivel 1
        '#A7A7A7', // Nivel 2
        '#9A9A9A', // Nivel 3
        '#8D8D8D', // Nivel 4
        '#808080', // Nivel 5
        '#737373', // Nivel 6
        '#666666', // Nivel 7
        '#595959', // Nivel 8
        '#4C4C4C', // Nivel 9
        '#3B3B3B'  // Nivel 10
    ];

    // Cookies
    const getCookie = (name) => document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop() || null;
    const deleteCookie = (name) => document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;

    // Funciones principales

    async function fetchUserData() {
        try {
            const response = await fetch(`${API_URL}/usuario/${usuarioId}`);
            if (!response.ok) throw new Error('Usuario no encontrado');
            const user = await response.json();
            username = user.nombre_usuario;
            sidebarUsername.textContent = username;
        } catch (error) {
            console.error('Error fetching username:', error);
            sidebarUsername.textContent = 'Error';
        }
    }

    async function fetchFriends() {
        try {
            const response = await fetch(`${API_URL}/amigosfalsos/usuario/${usuarioId}`);
            const friends = await response.json();
            friendsListContainer.innerHTML = '';
            
            if (friends.length === 0) {
                friendsListContainer.innerHTML = '<p style="text-align: center;">Tu lista de traiciones está vacía.</p>';
                return;
            }

            friends.forEach(friend => {
                const card = document.createElement('div');
                card.className = `friend-card ${friend.usuario_id != usuarioId ? 'dark' : ''}`;
                
                const nivel = friend.N_Traicion;
                if (nivel >= 1 && nivel <= 10) {
                    card.style.backgroundColor = colorPalette[nivel - 1];

                    if (nivel >= 5) {
                        card.style.color = 'white';
                    }
                }

                // Icono de publicación
                const publishIcon = friend.EsPublico 
                    ? `<i class="fa-solid fa-flag publish-icon" title="Publicado"></i>` 
                    : `<i class="fa-regular fa-flag publish-icon" title="No publicado"></i>`;

                card.innerHTML = `
                    <div class="card-content">
                        <div class="card-header">
                            <span>${friend.nombre}</span>
                            <span>${new Date(friend.fecha).toLocaleDateString()}</span>
                            <span>Nivel: ${friend.n_traicion}</span>
                        </div>
                        <p class="card-description">${friend.descripcion}</p>
                        <p class="card-author">Autor: ${friend.esanonimo ? 'Anónimo' : friend.autornombre}</p>
                    </div>
                    <div class="card-actions">
                        <!-- Botón de Publicar/Enviar -->
                        <button class="publish-btn" data-id="${friend.id}" title="Publicar / Editar publicación">
                            <i class="fa-solid fa-arrow-up-from-bracket"></i>
                        </button>
                        <button class="edit-btn" data-id="${friend.id}" title="Editar"><i class="fa-solid fa-gear"></i></button>
                        <button class="delete-btn" data-id="${friend.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                friendsListContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }

    // Modales Funciones
    const showFriendModal = (mode = 'add', data = null) => {
        friendForm.reset();
        document.getElementById('friend-id').value = '';
        if (mode === 'add') {
            document.getElementById('modal-title').textContent = 'Registrar traicion';
            modalActionBtn.textContent = 'Agregar';
        } else {
            document.getElementById('modal-title').textContent = 'Editar traicion';
            modalActionBtn.textContent = 'Guardar Cambios';
            document.getElementById('friend-id').value = data.ID;
            document.getElementById('nombre').value = data.Nombre;
            document.getElementById('fecha').value = new Date(data.Fecha).toISOString().split('T')[0];
            document.getElementById('nivel').value = data.N_Traicion;
            document.getElementById('descripcion').value = data.Descripcion;
        }
        friendModal.style.display = 'flex';
    };

    const showPublishModal = (friendId, esPublico = false, esAnonimo = false) => {
        pendingPublishId = friendId;
        publishForm.reset();
        document.getElementById('accept-publish').checked = !!esPublico;
        document.getElementById('publish-anonymous').checked = !!esAnonimo;
        publishModal.style.display = 'flex';
    };
    
    const showDeleteModal = (friendId) => {
        pendingDeleteId = friendId;
        deleteConfirmModal.style.display = 'flex';
    };

    const hideAllModals = () => {
        friendModal.style.display = 'none';
        publishModal.style.display = 'none';
        deleteConfirmModal.style.display = 'none';
    };

    // Formularios y acciones
    async function handleFriendFormSubmit(event) {
        event.preventDefault();
        const friendId = document.getElementById('friend-id').value;
        const data = {
            nombre: document.getElementById('nombre').value,
            fecha: document.getElementById('fecha').value,
            n_traicion: document.getElementById('nivel').value,
            descripcion: document.getElementById('descripcion').value,
            usuario_id: usuarioId 
        };

        const isEditing = !!friendId;
        const url = isEditing ? `${API_URL}/amigosfalsos/${friendId}` : `${API_URL}/amigosfalsos`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falló la solicitud');
            
            hideAllModals();
            if (isEditing) {
                fetchFriends(); 
            } else {
                showPublishModal(result.id, false, false); 
            }
        } catch (error) { console.error('Error submitting form:', error); }
    }

    async function handlePublishFormSubmit(event) {
        event.preventDefault();
        const data = {
            es_publico: document.getElementById('accept-publish').checked ? 1 : 0,
            es_anonimo: document.getElementById('publish-anonymous').checked ? 1 : 0,
        };

        try {
            await fetch(`${API_URL}/amigosfalsos/publicar/${pendingPublishId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            hideAllModals();
            fetchFriends();
        } catch (error) { console.error('Error publishing:', error); }
    }
    
    async function handleDeleteConfirm() {
        try {
            await fetch(`${API_URL}/amigosfalsos/${pendingDeleteId}`, { method: 'DELETE' });
            hideAllModals();
            fetchFriends();
        } catch (error) { console.error('Error deleting:', error); }
    }

    // Eventos y Listeners
    function init() {
        usuarioId = getCookie('usuarioId');
        if (!usuarioId) {
            window.location.href = 'login.html';
            return;
        }

        fetchUserData();
        fetchFriends();

        // Botones principales
        addFriendBtn.addEventListener('click', () => showFriendModal('add'));
        logoutBtn.addEventListener('click', () => {
            deleteCookie('usuarioId');
            window.location.href = '/login';
        });

        // Formularios
        friendForm.addEventListener('submit', handleFriendFormSubmit);
        publishForm.addEventListener('submit', handlePublishFormSubmit);

        // Botones de cancelación en modales
        friendModal.querySelector('#modal-cancel-btn').addEventListener('click', hideAllModals);
        publishModal.querySelector('#publish-cancel-btn').addEventListener('click', hideAllModals);
        deleteConfirmModal.querySelector('#delete-cancel-btn').addEventListener('click', hideAllModals);
        
        // Botón de confirmación de borrado
        deleteConfirmModal.querySelector('#delete-confirm-btn').addEventListener('click', handleDeleteConfirm);

        // Clics en tarjetas (Editar/Eliminar)
        friendsListContainer.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return;
            const id = button.dataset.id;
            
            if (button.classList.contains('edit-btn')) {
                const response = await fetch(`${API_URL}/amigosfalsos/usuario/${usuarioId}`);
                const friends = await response.json();
                const friendToEdit = friends.find(f => f.ID == id);
                if(friendToEdit) showFriendModal('edit', friendToEdit);
            } else if (button.classList.contains('delete-btn')) {
                showDeleteModal(id);
            } else if (button.classList.contains('publish-btn')) {
                const response = await fetch(`${API_URL}/amigosfalsos/usuario/${usuarioId}`);
                const friends = await response.json();
                const friendToPublish = friends.find(f => f.ID == id);
                if (friendToPublish) {
                    showPublishModal(id, friendToPublish.EsPublico, friendToPublish.EsAnonimo);
                }
            }
        });
    }

    init();
});