function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // path=/ asegura que la cookie esté disponible en todo el sitio
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Función para leer una cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
document.getElementById('registroForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const nombreUsuario = document.getElementById('username').value;
    const correo = document.getElementById('email').value;
    const contrasena = document.getElementById('password').value;


    try {
        const response = await fetch('http://localhost:3000/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre_usuario: nombreUsuario,
                correo_electronico: correo,
                contrasena: contrasena 
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Elpepe");
            setCookie('usuarioId', result.id, 7);
            alert(result.mensaje);
            window.location.href = 'VerAmigosFalsos.html';
        } else {
            throw new Error(result.error || 'Ocurrió un error al registrarse.');
        }

    } catch (error) {
        console.error('Error en el registro:', error);
        alert(error.message);
    }
});