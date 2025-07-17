document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA MODIFICADA PARA LA NUEVA URL ---
    // Lee la URL, ej: /match/KantQvQ/abc-123
    const pathParts = window.location.pathname.split('/'); 
    const pubgMatchId = pathParts[pathParts.length - 1];

    // Comprueba que el formato de la URL sea correcto
    if (!pubgMatchId || pathParts[1] !== 'match') {
        document.body.innerHTML = '<h1>Error: Invalid Match URL format</h1>';
        return;
    }
    // --- FIN DE LA LÓGICA MODIFICADA ---

    // Muestra el loader (tu código se mantiene)
    const loader = document.getElementById('loader');
    const mainContainer = document.getElementById('main-container');
    loader.style.opacity = '1';
    mainContainer.style.opacity = '0';

    // --- FETCH MODIFICADO ---
    // Llama a la API con el nuevo parámetro 'pubg_id'
    fetch(`/api/getMatch?pubg_id=${pubgMatchId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Match not found or API error (status: ${response.status})`);
            }
            return response.json();
        })
        .then(matchData => {
            // Llama a tus funciones para rellenar la página (sin cambios aquí)
            fillPageData(matchData);
            createKillsList(matchData);
            createLobbyActivity(matchData);

            // Oculta el loader y muestra el contenido (tu código se mantiene)
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            mainContainer.style.opacity = '1';
        })
        .catch(error => {
            console.error('Failed to fetch match data:', error);
            loader.style.display = 'none';
            document.body.innerHTML = `<h1>Error loading match data: ${error.message}</h1>`;
        });
});

// El resto de tus funciones no necesitan cambios.
function fillPageData(matchData) {
    document.getElementById('playerName').textContent = matchData.player_name;
    document.getElementById('playerRank').textContent = `${matchData.player_rank_name} (${matchData.player_rank_points} Points)`;
    document.getElementById('date').textContent = matchData.match_date;
    document.getElementById('type').textContent = matchData.match_type;
    document.getElementById('map').textContent = matchData.match_map;
    document.getElementById('killedBy').textContent = matchData.killed_by || 'N/A';
    document.getElementById('killerRank').textContent = matchData.killer_rank_name !== 'Unranked' ? `${matchData.killer_rank_name} (${matchData.killer_rank_points} Points)` : 'Unranked';
    document.getElementById('position').textContent = `#${matchData.position}`;
    document.getElementById('kills').textContent = matchData.kills;
    document.getElementById('assists').textContent = matchData.assists;
    document.getElementById('damage').textContent = Math.round(matchData.damage);

    const teamList = document.getElementById('team-list');
    teamList.innerHTML = '';
    if (matchData.teammates && matchData.teammates.length > 0) {
        matchData.teammates.forEach(p => {
            const li = document.createElement('li');
            const rankText = (p.rankName !== 'Unranked') ? `(${p.rankName} - ${p.rankPoints} Points)` : '';
            li.innerHTML = `<div><i class="fa-solid fa-user-group"></i> ${p.name}</div><div class="rank-info">${rankText}</div>`;
            teamList.appendChild(li);
        });
    } else {
        teamList.innerHTML = '<li>No teammates in this match.</li>';
    }

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

function createKillsList(matchData) {
    const killList = document.getElementById('kill-list');
    const card = killList.closest('.grid-card');
    if (!matchData.kills_list || matchData.kills_list.length === 0) {
        if (card) card.style.display = 'none';
        return;
    }
    
    if (card) card.style.display = 'block';
    killList.innerHTML = '';
    matchData.kills_list.forEach(kill => {
        const li = document.createElement('li');
        const rankText = (kill.rankName !== 'Unranked') ? `(${kill.rankName} - ${kill.rankPoints} Points)` : '(Unranked)';
        li.innerHTML = `<div><i class="fa-solid fa-skull"></i> ${kill.name}</div><div class="rank-info">${rankText}</div>`;
        killList.appendChild(li);
    });
}

function createLobbyActivity(matchData) {
    const container = document.getElementById('lobby-activity-content');
    const card = container.closest('.grid-card');
    
    if (!matchData.online_streamers && !matchData.offline_streamers_count) {
        if(card) card.style.display = 'none';
        return;
    }

    container.innerHTML = '';

    if (matchData.online_streamers && matchData.online_streamers.length > 0) {
        const onlineTitle = document.createElement('h3');
        onlineTitle.textContent = 'Online Streamers in Lobby';
        container.appendChild(onlineTitle);

        const onlineList = document.createElement('ul');
        onlineList.className = 'online-streamer-list';
        matchData.online_streamers.forEach(streamer => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="https://twitch.tv/${streamer.name}" target="_blank" rel="noopener noreferrer">
                    <div>
                        <span class="online-icon">●</span>
                        <span class="online-streamer-name">${streamer.name}</span>
                    </div>
                    <div class="online-streamer-viewers">${streamer.viewers.toLocaleString()} viewers</div>
                </a>
            `;
            onlineList.appendChild(li);
        });
        container.appendChild(onlineList);
    }

    if (matchData.offline_streamers_count > 0) {
        const offlineInfo = document.createElement('div');
        offlineInfo.className = 'offline-streamers-info';
        offlineInfo.textContent = `And ${matchData.offline_streamers_count} other known streamers were offline.`;
        container.appendChild(offlineInfo);
    }
}
