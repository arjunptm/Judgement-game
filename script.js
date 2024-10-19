class ScoreBoard {
    constructor(players, cardsPerRound, trumpSuites) {
        this.players = players;
        this.scores = Object.fromEntries(players.map(player => [player, []]));
        this.predictions = Object.fromEntries(players.map(player => [player, []]));
        this.tricks = Object.fromEntries(players.map(player => [player, []]));
        this.cardsPerRound = cardsPerRound;
        this.trumpSuites = trumpSuites;
        this.currentRound = 0;
    }

    updateScoreboard() {
        const table = document.getElementById('scoreTable');
        table.innerHTML = ''; // Clear existing table

        // Create header
        const header = table.createTHead();
        const headerRow = header.insertRow();
        ['Round', 'Cards', 'Trump', ...this.players.flatMap(player => [`${player} Pred`, 'Tricks', 'Score'])].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // Create body
        const body = table.createTBody();
        for (let i = 0; i < this.cardsPerRound.length; i++) {
            const row = body.insertRow();
            const roundNum = i + 1;
            const cards = this.cardsPerRound[i];
            const trump = this.trumpSuites[i % this.trumpSuites.length];

            row.insertCell().textContent = roundNum;
            row.insertCell().textContent = cards;
            row.insertCell().textContent = trump;

            this.players.forEach(player => {
                row.insertCell().textContent = this.predictions[player][i] || '';
                row.insertCell().textContent = this.tricks[player][i] || '';
                row.insertCell().textContent = this.scores[player][i] || '';
            });
        }

        // Create total row
        const totalRow = body.insertRow();
        totalRow.insertCell().textContent = 'Total';
        totalRow.insertCell().textContent = '';
        totalRow.insertCell().textContent = '';
        this.players.forEach(player => {
            totalRow.insertCell().textContent = '';
            totalRow.insertCell().textContent = '';
            totalRow.insertCell().textContent = this.scores[player].reduce((a, b) => a + b, 0);
        });
    }

    highlightCell(roundNum, player, column) {
        const table = document.getElementById('scoreTable');
        const row = table.rows[roundNum];
        const playerIndex = this.players.indexOf(player);
        const cellIndex = 3 + playerIndex * 3 + (column === 'Pred' ? 0 : column === 'Tricks' ? 1 : 2);
        row.cells[cellIndex].classList.add('highlighted');
    }

    removeHighlight() {
        const highlightedCells = document.querySelectorAll('.highlighted');
        highlightedCells.forEach(cell => cell.classList.remove('highlighted'));
    }
}

function generateTrumpSuiteOrder() {
    const redSuites = ['♥', '♦'];
    const blackSuites = ['♠', '♣'];
    shuffleArray(redSuites);
    shuffleArray(blackSuites);
    const trumpOrder = [];
    for (let i = 0; i < 2; i++) {
        trumpOrder.push(redSuites[i]);
        trumpOrder.push(blackSuites[i]);
    }
    trumpOrder.push('No Trump');
    return trumpOrder;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function calculateCardsPerRound(numPlayers) {
    const maxCards = Math.floor(52 / numPlayers);
    const cardsPerRound = [];
    
    // Decreasing
    for (let i = maxCards; i > 0; i--) {
        cardsPerRound.push(i);
    }
    
    // Increasing (excluding maxCards as it's already included)
    for (let i = 2; i <= maxCards; i++) {
        cardsPerRound.push(i);
    }
    
    return cardsPerRound;
}

let scoreboard;
let playerOrder;
let currentPlayerIndex;
let isGettingPredictions;

function startGame() {
    const playerInput = document.getElementById('playerInput');
    const players = playerInput.value.split(',').map(p => p.trim()).filter(p => p);
    
    if (players.length < 2) {
        alert('Please enter at least 2 players.');
        return;
    }

    const cardsPerRound = calculateCardsPerRound(players.length);
    const trumpSuites = generateTrumpSuiteOrder();
    scoreboard = new ScoreBoard(players, cardsPerRound, trumpSuites);
    playerOrder = [...players];
    currentPlayerIndex = 0;

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    scoreboard.updateScoreboard();
    nextRound();
}

function nextRound() {
    scoreboard.currentRound++;
    if (scoreboard.currentRound > scoreboard.cardsPerRound.length) {
        endGame();
        return;
    }

    const roundInfo = document.getElementById('roundInfo');
    roundInfo.textContent = `Round ${scoreboard.currentRound}, Cards: ${scoreboard.cardsPerRound[scoreboard.currentRound - 1]}, Trump: ${scoreboard.trumpSuites[(scoreboard.currentRound - 1) % scoreboard.trumpSuites.length]}`;

    currentPlayerIndex = 0;
    isGettingPredictions = true;
    getPredictions();
}


function getPredictions() {
    const player = playerOrder[currentPlayerIndex];
    const cards = scoreboard.cardsPerRound[scoreboard.currentRound - 1];
    
    document.getElementById('currentAction').textContent = `${player}, enter your prediction (0-${cards}):`;
    scoreboard.highlightCell(scoreboard.currentRound, player, 'Pred');
}

function getTricks() {
    const player = playerOrder[currentPlayerIndex];
    const cards = scoreboard.cardsPerRound[scoreboard.currentRound - 1];
    
    document.getElementById('currentAction').textContent = `${player}, enter actual tricks won (0-${cards}):`;
    scoreboard.highlightCell(scoreboard.currentRound, player, 'Tricks');
}

function submitInput() {
    const inputValue = parseInt(document.getElementById('inputValue').value);
    const cards = scoreboard.cardsPerRound[scoreboard.currentRound - 1];
    const player = playerOrder[currentPlayerIndex];

    if (isNaN(inputValue) || inputValue < 0 || inputValue > cards) {
        alert(`Please enter a valid number between 0 and ${cards}.`);
        return;
    }

    if (isGettingPredictions) {
        scoreboard.predictions[player].push(inputValue);
    } else {
        scoreboard.tricks[player].push(inputValue);
        const prediction = scoreboard.predictions[player][scoreboard.currentRound - 1];
        const score = prediction === inputValue ? 10 + inputValue : -Math.abs(10 + prediction);
        scoreboard.scores[player].push(score);
    }

    scoreboard.updateScoreboard();
    scoreboard.removeHighlight();

    currentPlayerIndex++;
    if (currentPlayerIndex >= playerOrder.length) {
        if (isGettingPredictions) {
            isGettingPredictions = false;
            currentPlayerIndex = 0;
            getTricks();
        } else {
            nextRound();
        }
    } else {
        if (isGettingPredictions) {
            getPredictions();
        } else {
            getTricks();
        }
    }

    document.getElementById('inputValue').value = '';
}

function endGame() {
    document.getElementById('game').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    const finalScores = scoreboard.players.map(player => ({
        name: player,
        score: scoreboard.scores[player].reduce((a, b) => a + b, 0)
    }));

    finalScores.sort((a, b) => b.score - a.score);

    const resultsDiv = document.getElementById('finalScores');
    resultsDiv.innerHTML = '<h2>Final Scores:</h2>';
    finalScores.forEach(player => {
        resultsDiv.innerHTML += `<p>${player.name}: ${player.score}</p>`;
    });

    resultsDiv.innerHTML += `<h3>The winner is ${finalScores[0].name} with ${finalScores[0].score} points!</h3>`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startGame').addEventListener('click', startGame);
    document.getElementById('submitInput').addEventListener('click', submitInput);
});