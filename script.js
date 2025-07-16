document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS DE EJEMPLO (MOCK DATA) ---
    const matchData = {
        playerName: "KantQvQ",
        playerRank: { rankName: "Bronze 2", rankPoints: 1298 },
        date: "16/07/2025 at 06:35",
        type: "Ranked",
        map: "Taego",
        killedBy: "Shapp2k",
        killerRank: { rankName: "Master 1", rankPoints: 3679 },
        teammates: [
            { name: "SoulJokers", rankName: "Bronze 2", rankPoints: 1264 },
            { name: "PabloExequielC", rankName: "Bronze 4", rankPoints: 880 },
            { name: "BricioB2-RJ", rankName: "Crystal 4", rankPoints: 2687 }
        ],
        position: 12,
        kills: 3,
        assists: 1,
        damage: 326.85,
        // ESTRUCTURA CORREGIDA: Usamos videoId y timestamp
        encounters: [
            { streamerName: "maxzeraa_", videoId: "2513562881", timestamp: "4h47m55s" }
        ]
    };
    // --- FIN DE LOS DATOS DE EJEMPLO ---

    // --- Rellenar datos en la página ---
    document.getElementById('playerName').textContent = matchData.playerName;
    document.getElementById('playerRank').textContent = `${matchData.playerRank.rankName} (${matchData.playerRank.rankPoints} Points)`;
    document.getElementById('date').textContent = matchData.date;
    document.getElementById('type').textContent = matchData.type;
    document.getElementById('map').textContent = matchData.map;
    document.getElementById('killedBy').textContent = matchData.killedBy;
    document.getElementById('killerRank').textContent = `${matchData.killerRank.rankName} (${matchData.killerRank.rankPoints} Points)`;
    document.getElementById('position').textContent = matchData.position;
    document.getElementById('kills').textContent = matchData.kills;
    document.getElementById('assists').textContent = matchData.assists;
    document.getElementById('damage').textContent = Math.round(matchData.damage);

    // Rellenar lista de compañeros
    const teamList = document.getElementById('team-list');
    teamList.innerHTML = '';
    matchData.teammates.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `${p.name} <span class="rank-info">(${p.rankName} - ${p.rankPoints} Points)</span>`;
        teamList.appendChild(li);
    });

    // Crear reproductor de Twitch
    const heroVideoSection = document.querySelector('.hero-video-section');
    const encounter = matchData.encounters.length > 0 ? matchData.encounters[0] : null;

    if (encounter && encounter.videoId) {
        new Twitch.Embed("twitch-embed", {
            width: "100%",
            height: "100%",
            // LÓGICA CORREGIDA: Usamos 'video' y 'time'
            video: encounter.videoId,
            time: encounter.timestamp,
            parent: ["brutal-puff.vercel.app"]
        });
    } else {
        heroVideoSection.style.display = 'none';
    }
});
