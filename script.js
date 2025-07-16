document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS DE EJEMPLO (MOCK DATA) ---
    const datosDePartida = {
        playerName: "VSNZ",
        fecha: "16/07/2025 a las 02:15",
        tipo: "Partida Normal",
        mapa: "Erangel",
        modo: "Duo FPP",
        asesinadoPor: "Aced1354",
        companeros: ["My_Team_Wins"],
        posicion: 48,
        kills: 1,
        asistencias: 0,
        dano: 149.85,
        twitchChannel: "vsnz"
    };
    // --- FIN DE LOS DATOS DE EJEMPLO ---

    function rellenarDatos() {
        document.getElementById('playerName').textContent = datosDePartida.playerName;
        document.getElementById('fecha').textContent = datosDePartida.fecha;
        document.getElementById('tipo').textContent = datosDePartida.tipo;
        document.getElementById('mapa').textContent = datosDePartida.mapa;
        document.getElementById('modo').textContent = datosDePartida.modo;
        document.getElementById('asesinadoPor').textContent = datosDePartida.asesinadoPor;
        document.getElementById('posicion').textContent = datosDePartida.posicion;
        document.getElementById('kills').textContent = datosDePartida.kills;
        document.getElementById('asistencias').textContent = datosDePartida.asistencias;
        document.getElementById('dano').textContent = Math.round(datosDePartida.dano);

        const equipoLista = document.getElementById('equipo');
        equipoLista.innerHTML = '';
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

    function crearReproductorTwitch() {
        if (datosDePartida.twitchChannel) {
            new Twitch.Embed("twitch-embed", {
                width: "100%",
                height: 300,
                channel: datosDePartida.twitchChannel,
                layout: "video",
                parent: ["brutal-puff.vercel.app"]
            });
        }
    }

    rellenarDatos();
    crearReproductorTwitch();

});
