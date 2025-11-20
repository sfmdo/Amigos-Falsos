document.addEventListener('DOMContentLoaded', () => {
    const usernameDisplay = document.getElementById('username-display');
    const friendsListContainer = document.getElementById('friends-list');
    const modal = document.getElementById('friend-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('friend-form');
    const addFriendBtn = document.getElementById('add-friend-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const modalActionBtn = document.getElementById('modal-action-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    const API_URL = 'http://localhost:3000/api';
    let usuarioId = null;

    const colorPalette = [
        '#FFFACD', // Nivel 1: Amarillo Pálido
        '#FFF176', // Nivel 2: Amarillo Vainilla
        '#FFEB3B', // Nivel 3: Amarillo Intenso
        '#FFD54F', // Nivel 4: Ámbar Claro
        '#FFB74D', // Nivel 5: Naranja Claro
        '#FF9800', // Nivel 6: Naranja
        '#FB8C00', // Nivel 7: Naranja Profundo
        '#F4511E', // Nivel 8: Naranja Rojizo
        '#E64A19', // Nivel 9: Rojo Tomate
        '#E53935'  // Nivel 10: Rojo Normal
    ];

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function deleteCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // Cargar nombre de usuario
    async function fetchUsername() {
        try {
            const response = await fetch(`${API_URL}/usuario/${usuarioId}`);
            if (!response.ok) throw new Error('Usuario no encontrado');
            const user = await response.json();
            usernameDisplay.textContent = user.nombre_usuario;
        } catch (error) {
            console.error('Error fetching username:', error);
            usernameDisplay.textContent = 'Desconocido';
        }
    }

    // Cargar y mostrar lista de amigos falsos
    async function fetchFriends() {
        try {
            const response = await fetch(`${API_URL}/amigosfalsos/usuario/${usuarioId}`);
            const friends = await response.json();
            
            friendsListContainer.innerHTML = ''; // Limpiar lista actual
            
            if (friends.length === 0) {
                friendsListContainer.innerHTML = '<p>No tienes amigos falsos en tu lista. ¡Agrega uno!</p>';
            } else {
                friends.forEach(friend => {
                    const card = document.createElement('div');
                    card.className = 'friend-card';
                    const nivel = friend.N_Traicion;
                    if (nivel >= 1 && nivel <= 10) {
                        card.style.backgroundColor = colorPalette[nivel - 1];
                    }
                    card.innerHTML = `
                        <div class="card-content">
                            <div class="card-header">
                                <span>${friend.Nombre}</span>
                                <span>Fecha: ${new Date(friend.Fecha).toLocaleDateString()}</span>
                                <span>Nivel: ${friend.N_Traicion}</span>
                            </div>
                            <p class="card-description">${friend.Descripcion}</p>
                        </div>
                        <div class="card-actions">
                            <button class="edit-btn" data-id="${friend.ID}"><i class="fa-solid fa-gear"></i></button>
                            <button class="delete-btn" data-id="${friend.ID}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                    friendsListContainer.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }

    // Mostrar el modal en modo agregar o editar
        function showModal(mode = 'add', friendData = null) {
        form.reset();
        if (mode === 'add') {
            modalTitle.textContent = 'Agregar Nuevo Amigo Falso';
            modalActionBtn.textContent = 'Agregar';
            document.getElementById('friend-id').value = '';
        } else if (mode === 'edit' && friendData) {
            modalTitle.textContent = 'Editar Amigo Falso';
            modalActionBtn.textContent = 'Guardar Cambios';
            document.getElementById('friend-id').value = friendData.ID;
            document.getElementById('nombre').value = friendData.Nombre;
            // Formatear la fecha para el input type="date" (YYYY-MM-DD)
            document.getElementById('fecha').value = new Date(friendData.Fecha).toISOString().split('T')[0];
            document.getElementById('nivel').value = friendData.N_Traicion;
            document.getElementById('descripcion').value = friendData.Descripcion;
        }
        modal.style.display = 'flex';
    }

    
    function hideModal() {
        modal.style.display = 'none';
    }

    // Manejar envío del formulario (Crear o Actualizar)
    async function handleFormSubmit(event) {
        event.preventDefault();
        const friendId = document.getElementById('friend-id').value;
        
        const friendData = {
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
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(friendData)
            });

            if (!response.ok) throw new Error('Falló la solicitud');
            
            hideModal();
            fetchFriends();
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    }

    // Manejar clics en la lista (para Editar y Eliminar)
    async function handleListClick(event) {
        const target = event.target.closest('button');
        if (!target) return;

        const friendId = target.dataset.id;

        if (target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que quieres eliminar a esta persona de la lista?')) {
                try {
                    await fetch(`${API_URL}/amigosfalsos/${friendId}`, { method: 'DELETE' });
                    fetchFriends(); // Recargar lista
                } catch (error) {
                    console.error('Error deleting friend:', error);
                }
            }
        } else if (target.classList.contains('edit-btn')) {
            try {
                const response = await fetch(`${API_URL}/amigosfalsos/usuario/${usuarioId}`);
                const friends = await response.json();
                const friendToEdit = friends.find(f => f.ID == friendId);
                if (friendToEdit) {
                    showModal('edit', friendToEdit);
                }
            } catch (error) {
                console.error('Error fetching friend data for edit:', error);
            }
        }
    }

    // Verificar si el usuario ha iniciado sesión
    usuarioId = getCookie('usuarioId');
    if (!usuarioId) {
        alert('No has iniciado sesión. Serás redirigido.');
        window.location.href = 'login.html';
        return;
    }

    fetchUsername();
    fetchFriends();

    // Listeners de eventos
    addFriendBtn.addEventListener('click', () => showModal('add'));
    cancelBtn.addEventListener('click', hideModal);
    form.addEventListener('submit', handleFormSubmit);
    friendsListContainer.addEventListener('click', handleListClick);

    logoutBtn.addEventListener('click', () => {
        deleteCookie('usuarioId');
        alert('Has cerrado sesión correctamente.');
        window.location.href = 'login.html';
    });
});