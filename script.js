document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS DE EJEMPLO (MOCK DATA) ---
    const datosDePartida = {
        playerName: "VSNZ",
        fecha: "16/07/2025 a las 02:15",
        tipo: "Partida Normal",
        mapa: "Erangel",
        modo: "Duo FPP",
        asesinadoPor: "Aced1354",
        companeros: ["My_Team_Wins"], // Lo ponemos como un array para el futuro
        posicion: 48,
        kills: 1,
        asistencias: 0,
        dano: 149.85,
        streamerInfo: "📢 ¡Streamers ACTIVOS en esta partida! • vsnz (https://www.twitch.tv/vsnz)"
    };
    // --- FIN DE LOS DATOS DE EJEMPLO ---


    // Función para rellenar los datos en la página
    function rellenarDatos() {
        // Rellenar datos de texto
        document.getElementById('playerName').textContent = datosDePartida.playerName;
        document.getElementById('fecha').textContent = datosDePartida.fecha;
        document.getElementById('tipo').textContent = datosDePartida.tipo;
        document.getElementById('mapa').textContent = datosDePartida.mapa;
        document.getElementById('modo').textContent = datosDePartida.modo;
        document.getElementById('asesinadoPor').textContent = datosDePartida.asesinadoPor;
        
        // Rellenar estadísticas
        document.getElementById('posicion').textContent = datosDePartida.posicion;
        document.getElementById('kills').textContent = datosDePartida.kills;
        // document.getElementById('asistencias').textContent = datosDePartida.asistencias;
        document.getElementById('dano').textContent = Math.round(datosDePartida.dano);
        
        // Rellenar información del streamer
        document.getElementById('streamerInfo').textContent = datosDePartida.streamerInfo;

        // Rellenar la lista de compañeros de equipo
        const equipoLista = document.getElementById('equipo');
        equipoLista.innerHTML = ''; // Limpiamos la lista por si acaso
        
        if (datosDePartida.companeros.length > 0) {
            datosDePartida.companeros.forEach(companero => {
                const li = document.createElement('li');
                li.textContent = `• ${companero}`;
                equipoLista.appendChild(li);
            });
        } else {
             const li = document.createElement('li');
             li.textContent = 'Ninguno';
             equipoLista.appendChild(li);
        }
    }

    // Llamamos a la función para que se ejecute
    rellenarDatos();

});

    // Llamamos a la función para que se ejecute
    rellenarDatos();

});
