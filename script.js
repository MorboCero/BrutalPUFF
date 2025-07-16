// Espera a que la página se cargue
document.addEventListener('DOMContentLoaded', () => {

    // Extrae la ID de la partida desde la URL de la página
    const pathParts = window.location.pathname.split('/');
    const matchId = pathParts[pathParts.length - 1];

    if (!matchId) {
        document.body.innerHTML = '<h1>Error: Match ID not found in URL</h1>';
        return;
    }

    // Llama a nuestra propia API para obtener los datos de la partida
    fetch(`/api/getMatch?id=${matchId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Match not found or API error (status: ${response.status})`);
            }
            return response.json();
        })
        .then(matchData => {
            // Una vez que tenemos los datos reales, llamamos a las funciones para rellenar la página
            fillPageData(matchData);
        })
        .catch(error => {
            console.error('Failed to fetch match data:', error);
            document.body.innerHTML = `<h1>Error loading match data: ${error.message}</h1>`;
        });
});

// Todas las funciones que rellenan la web ahora reciben los datos como un parámetro
function fillPageData(matchData) {
    // Info del jugador
    document.getElementById('playerName').textContent = matchData.player_name;
    document.getElementById('playerRank').textContent = `${matchData.player_rank_name} (${matchData.player_rank_points} Points)`;

    // Info de la partida
    document.getElementById('date').textContent = matchData.match_date;
    document.getElementById('type').textContent = matchData.match_type;
    document.getElementById('map').textContent = matchData.match_map;
    document.getElementById('killedBy').textContent = matchData.killed_by;
    document.getElementById('killerRank').textContent = `${matchData.killer_rank_name} (${matchData.killer_rank_points} Points)`;
    
    // Estadísticas
    document.getElementById('position').textContent = matchData.position;
    document.getElementById('kills').textContent = matchData.kills;
    document.getElementById('assists').textContent = matchData.assists;
    document.getElementById('damage').textContent = Math.round(matchData.damage);

    // Lista de compañeros
    const teamList = document.getElementById('team-list');
    teamList.innerHTML = '';
    if (matchData.teammates && matchData.teammates.length > 0) {
        matchData.teammates.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `<div>${p.name}</div><div class="rank-info">${p.rankName} (${p.rankPoints} Points)</div>`;
            teamList.appendChild(li);
        });
    } else {
        teamList.innerHTML = '<li>No teammates in this match.</li>';
    }

    // Reproductor de Twitch
    const heroVideoSection = document.querySelector('.hero-video-section');
    const encounter = matchData.encounters && matchData.encounters.length > 0 ? matchData.encounters[0] : null;

    if (encounter && encounter.videoId) {
        new Twitch.Embed("twitch-embed", {
            width: "100%",
            height: "100%",
            video: encounter.videoId,
            time: encounter.timestamp,
            parent: ["brutal-puff.vercel.app"]
        });
    } else {
        heroVideoSection.style.display = 'none';
    }
}
