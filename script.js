document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const playerName = pathParts[pathParts.length - 2];
    const pubgMatchId = pathParts[pathParts.length - 1];

    if (!pubgMatchId || !playerName || pathParts[1] !== 'match') {
        document.body.innerHTML = '<h1>Error: Invalid Match URL format</h1>';
        return;
    }

    const loader = document.getElementById('loader');
    const mainContainer = document.getElementById('main-container');
    loader.style.opacity = '1';
    mainContainer.style.opacity = '0';

    fetch(`/api/getMatch?pubg_id=${pubgMatchId}&player_name=${playerName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Match not found or API error (status: ${response.status})`);
            }
            return response.json();
        })
        .then(matchData => {
            fillPageData(matchData);
            createKillsList(matchData);
            createLobbyActivity(matchData);
            createKillFeed(matchData);

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

function highlightPlayerName(text, playerName) {
    const regex = new RegExp(`\\b(${playerName})\\b`, 'gi');
    return text.replace(regex, '<span class="highlight-player">$1</span>');
}

function createKillFeed(matchData) {
    const killFeedList = document.getElementById('kill-feed-list');
    const card = killFeedList.closest('.grid-card');
    const mainPlayerName = matchData.player_name;
    const teamNames = [mainPlayerName, ...(matchData.teammates || []).map(t => t.name)];

    if (!matchData.kill_feed || matchData.kill_feed.length === 0) {
        if (card) card.style.display = 'none';
        return;
    }

    if (card) card.style.display = 'block';
    killFeedList.innerHTML = '';

    matchData.kill_feed.forEach(kill => {
        const li = document.createElement('li');
        li.className = 'kill-feed-item';

        // Crear el contenido del elemento de la lista
        const timeSpan = document.createElement('span');
        timeSpan.className = 'kill-time';
        timeSpan.textContent = `[${kill.time}]`;

        const textSpan = document.createElement('span');
        textSpan.className = 'kill-text';
        textSpan.innerHTML = highlightPlayerName(kill.text, mainPlayerName);

        li.appendChild(timeSpan);
        li.appendChild(textSpan);

        // Resaltar si un miembro del equipo está involucrado
        const isPlayerInvolved = teamNames.some(name => kill.text.includes(name));
        if (isPlayerInvolved) {
            li.classList.add('involved');
        }

        killFeedList.appendChild(li);
    });
}

function fillPageData(matchData) {
    const playerNameLink = document.getElementById('playerNameLink');
    playerNameLink.href = `/player/${matchData.player_name}`;
    document.getElementById('playerName').textContent = matchData.player_name;

    const killedByLink = document.getElementById('killedByLink');
    if (matchData.killed_by) {
        killedByLink.href = `/player/${matchData.killed_by}`;
        document.getElementById('killedBy').textContent = matchData.killed_by;
    } else {
        document.getElementById('killedBy').textContent = 'N/A';
        killedByLink.removeAttribute('href'); 
    }

    document.getElementById('playerRank').textContent = `${matchData.player_rank_name} (${matchData.player_rank_points} Points)`;
    document.getElementById('date').textContent = matchData.match_date;
    document.getElementById('type').textContent = matchData.match_type;
    document.getElementById('map').textContent = matchData.match_map;
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
            li.innerHTML = `<div><i class="fa-solid fa-user-group"></i> <a href="/player/${p.name}">${p.name}</a></div><div class="rank-info">${rankText}</div>`;
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
            parent: ["brutal-puff.vercel.app", "localhost"]
        });
    } else {
        heroVideoSection.style.display = 'none';
    }
}

function createKillsList(matchData) {
    const killList = document.getElementById('kill-list');
    const card = killList.closest('.grid-card');
    const mainPlayerName = matchData.player_name;

    if (!matchData.kills_list || matchData.kills_list.length === 0) {
        if (card) card.style.display = 'none';
        return;
    }
    
    if (card) card.style.display = 'block';
    killList.innerHTML = '';
    matchData.kills_list.forEach(kill => {
        const li = document.createElement('li');
        const rankText = (kill.rankName !== 'Unranked') ? `(${kill.rankName} - ${kill.rankPoints} Points)` : '(Unranked)';
        
        // Lógica mejorada para encontrar el arma
        const killEvent = matchData.kill_feed.find(event => {
            const killerIndex = event.text.indexOf(mainPlayerName);
            const victimIndex = event.text.indexOf(kill.name);
            // Asegura que el jugador principal es el asesino y la víctima es la correcta
            return killerIndex !== -1 && victimIndex !== -1 && killerIndex < victimIndex;
        });

        let weaponText = '';
        if (killEvent) {
            // Extrae el arma del formato: "Killer [Weapon] Victim"
            const weaponMatch = killEvent.text.match(/\[(.*?)\]/);
            if (weaponMatch && weaponMatch[1]) {
                weaponText = `<span class="kill-weapon">${weaponMatch[1]}</span>`;
            }
        }

        // Construye el HTML final para el elemento de la lista
        li.innerHTML = `
            <div>
                <i class="fa-solid fa-skull"></i> 
                <a href="/player/${kill.name}">${kill.name}</a> 
                ${weaponText}
            </div>
            <div class="rank-info">${rankText}</div>`;
        killList.appendChild(li);
    });
}

function createLobbyActivity(matchData) {
    const container = document.getElementById('lobby-activity-content');
    const card = container.closest('.grid-card');
    
    if ((!matchData.online_streamers || matchData.online_streamers.length === 0) && (!matchData.offline_streamers_count || matchData.offline_streamers_count === 0)) {
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
        if (matchData.online_streamers && matchData.online_streamers.length > 0) {
            offlineInfo.textContent = `And ${matchData.offline_streamers_count} other known streamers were offline.`;
        } else {
            offlineInfo.textContent = `No streamers were online, ${matchData.offline_streamers_count} known streamers were offline.`;
        }
        container.appendChild(offlineInfo);
    }
}

