document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS DE EJEMPLO (MOCK DATA) ---
    const datosDePartida = {
        playerName: "KantQvQ",
        playerRank: { rankName: "Bronze 2", rankPoints: 1298 },
        fecha: "16/07/2025 a las 06:35",
        tipo: "Competitiva",
        mapa: "Taego",
        modo: "Squad FPP",
        asesinadoPor: "Shapp2k",
        killerRank: { rankName: "Master 1", rankPoints: 3679 },
        companeros: [
            { name: "SoulJokers", rankName: "Bronze 2", rankPoints: 1264 },
            { name: "PabloExequielC", rankName: "Bronze 4", rankPoints: 880 },
            { name: "BricioB2-RJ", rankName: "Crystal 4", rankPoints: 2687 }
        ],
        posicion: 12,
        kills: 3,
        asistencias: 1,
        dano: 326.85,
        clips: [
            { streamerName: "maxzeraa_", clipURL: "https://www.twitch.tv/videos/2513562881?t=4h47m55s" }
        ]
    };
    // --- FIN DE LOS DATOS DE EJEMPLO ---

    function rellenarDatos() {
        // Info del jugador
        document.getElementById('playerName').textContent = datosDePartida.playerName;
        document.getElementById('playerRank').textContent = `${datosDePartida.playerRank.rankName} (${datosDePartida.playerRank.rankPoints} Puntos)`;

        // Info de la partida
        document.getElementById('fecha').textContent = datosDePartida.fecha;
        document.getElementById('tipo').textContent = datosDePartida.tipo;
        document.getElementById('mapa').textContent = datosDePartida.mapa;
        document.getElementById('modo').textContent = datosDePartida.modo;

        // Info del asesino
        document.getElementById('asesinadoPor').textContent = datosDePartida.asesinadoPor;
        document.getElementById('killerRank').textContent = `${datosDePartida.killerRank.rankName} (${datosDePartida.killerRank.rankPoints} Puntos)`;

        // Estadísticas
        document.getElementById('posicion').textContent = datosDePartida.posicion;
        document.getElementById('kills').textContent = datosDePartida.kills;
        document.getElementById('asistencias').textContent = datosDePartida.asistencias;
        document.getElementById('dano').textContent = Math.round(datosDePartida.dano);
    }

    function crearListaCompaneros() {
        const equipoLista = document.getElementById('equipo');
        equipoLista.innerHTML = '';
        datosDePartida.companeros.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `${p.name} <span class="rank-info">(${p.rankName} - ${p.rankPoints} Puntos)</span>`;
            equipoLista.appendChild(li);
        });
    }

    function crearListaDeClips() {
        const clipsLista = document.getElementById('clips-list');
        clipsLista.innerHTML = '';
        datosDePartida.clips.forEach(clip => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = clip.clipURL;
            a.textContent = `Ver clip del encuentro con ${clip.streamerName}`;
            a.target = "_blank"; // Abre en una nueva pestaña
            a.rel = "noopener noreferrer";
            li.appendChild(a);
            clipsLista.appendChild(li);
        });
    }

    function crearReproductorTwitch() {
        // Usamos el nombre del streamer del primer clip para el reproductor
        const streamerChannel = datosDePartida.clips.length > 0 ? datosDePartida.clips[0].streamerName : null;
        
        if (streamerChannel) {
            new Twitch.Embed("twitch-embed", {
                width: "100%",
                height: "100%",
                channel: streamerChannel,
                layout: "video",
                parent: ["brutal-puff.vercel.app"]
            });
        }
    }

    // Ejecutar todas las funciones
    rellenarDatos();
    crearListaCompaneros();
    crearListaDeClips();
    crearReproductorTwitch();

});
