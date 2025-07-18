document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const playerName = pathParts[pathParts.length - 1];

    if (!playerName) {
        document.body.innerHTML = '<h1>Error: Player name not found in URL</h1>';
        return;
    }

    document.title = `${playerName} - Player Stats`;
    document.getElementById('playerName').textContent = playerName;
    
    fetch(`/api/getPlayerMatches?player=${playerName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Could not fetch player data (status: ${response.status})`);
            }
            return response.json();
        })
        .then(matches => {
            if (matches.length === 0) {
                document.getElementById('history-body').innerHTML = '<tr><td colspan="6">No match data found for this player.</td></tr>';
                document.getElementById('matches-analyzed').textContent = '0';
                return;
            }
            calculateAndDisplayStats(matches);
            populateMatchHistory(matches);
        })
        .catch(error => {
            console.error('Failed to fetch match data:', error);
            document.getElementById('history-body').innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
        });
});

function calculateAndDisplayStats(matches) {
    let totalKills = 0;
    let totalDamage = 0;
    let totalPlacement = 0;
    let deathCount = 0;

    matches.forEach(match => {
        totalKills += match.kills;
        totalDamage += match.damage;
        totalPlacement += match.position;
        if (match.position > 1) {
            deathCount++;
        }
    });

    const matchesAnalyzed = matches.length;
    const kdRatio = deathCount > 0 ? (totalKills / deathCount).toFixed(2) : totalKills.toFixed(2);
    const avgDamage = (totalDamage / matchesAnalyzed).toFixed(2);
    const avgPosition = (totalPlacement / matchesAnalyzed).toFixed(2);

    document.getElementById('kd-ratio').textContent = kdRatio;
    document.getElementById('avg-damage').textContent = Math.round(avgDamage);
    document.getElementById('avg-position').textContent = `#${Math.round(avgPosition)}`;
    document.getElementById('matches-analyzed').textContent = matchesAnalyzed;
}

function populateMatchHistory(matches) {
    const tableBody = document.getElementById('history-body');
    tableBody.innerHTML = '';

    const recentMatches = matches.slice(0, 50); // Mostramos hasta 50 partidas

    recentMatches.forEach(match => {
        const row = document.createElement('tr');
        const link = `/match/${match.player_name}/${match.pubg_match_id}`;

        row.innerHTML = `
            <td>${match.match_map}</td>
            <td>#${match.position}</td>
            <td>${match.kills}</td>
            <td>${Math.round(match.damage)}</td>
            <td>${match.match_date}</td>
            <td><a href="${link}" class="link-icon" title="View Match Details"><i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
        `;
        tableBody.appendChild(row);
    });
}
