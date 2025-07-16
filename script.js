// Espera a que todo el contenido de la página (HTML) se haya cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS DE EJEMPLO (MOCK DATA) ---
    // En el futuro, estos datos vendrán de tu base de datos.
    const datosDePartida = {
        playerName: "VSNZ",
        mapa: "Erangel",
        modo: "Duo FPP",
        asesinadoPor: "Aced1354",
        posicion: 48,
        kills: 1,
        dano: 149.85,
        streamerInfo: "📢 ¡Streamers ACTIVOS en esta partida! • vsnz (https://www.twitch.tv/vsnz)"
    };
    // --- FIN DE LOS DATOS DE EJEMPLO ---


    // Función para rellenar los datos en la página
    function rellenarDatos() {
        // Obtenemos los elementos del HTML por su ID
        document.getElementById('playerName').textContent = datosDePartida.playerName;
        document.getElementById('mapa').textContent = datosDePartida.mapa;
        document.getElementById('modo').textContent = datosDePartida.modo;
        document.getElementById('asesinadoPor').textContent = datosDePartida.asesinadoPor;
        document.getElementById('posicion').textContent = datosDePartida.posicion;
        document.getElementById('kills').textContent = datosDePartida.kills;
        document.getElementById('dano').textContent = Math.round(datosDePartida.dano); // Redondeamos el daño
        document.getElementById('streamerInfo').textContent = datosDePartida.streamerInfo;
    }

    // Llamamos a la función para que se ejecute
    rellenarDatos();

});