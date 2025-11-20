function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const nombreUsuario = document.getElementById('username').value;
    const contrasena = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre_usuario: nombreUsuario,
                contrasena: contrasena 
            })
        });

        const result = await response.json();

        if (response.ok) {
            setCookie('usuarioId', result.id, 7);
            
            alert(result.mensaje);
            window.location.href = 'VerListaAmigosFalsos.html';
        } else {
            throw new Error(result.error || 'Ocurrió un error al iniciar sesión.');
        }

    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        alert(error.message);
    }
});
