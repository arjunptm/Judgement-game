class ScoreBoard {
    constructor(players, cardsPerRound, trumpSuites) {
        this.players = players;
        this.scores = Object.fromEntries(players.map(player => [player, []]));
        this.predictions = Object.fromEntries(players.map(player => [player, []]));
        this.tricks = Object.fromEntries(players.map(player => [player, []]));
        this.cardsPerRound = cardsPerRound;
        this.trumpSuites = trumpSuites;
        this.currentRound = 0;
        this.currentPlayerIndex = 0;
        this.isPredictionPhase = true;
        this.playerOrder = [...players];
    }

    createScoreboard() {
        const table = document.getElementById('scoreTable');
        table.innerHTML = '';

        const header = table.createTHead();
        const headerRow = header.insertRow();
        ['Round', 'Cards', 'Trump', ...this.players.flatMap(player => [`${player} Pred`, 'Tricks', 'Score'])].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

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
                row.insertCell().textContent = ''; // Prediction
                row.insertCell().textContent = ''; // Tricks
                row.insertCell().textContent = ''; // Score
            });
        }

        const totalRow = body.insertRow();
        totalRow.insertCell().textContent = 'Total';
        totalRow.insertCell().textContent = '';
        totalRow.insertCell().textContent = '';
        this.players.forEach(player => {
            totalRow.insertCell().textContent = '';
            totalRow.insertCell().textContent = '';
            const totalScoreCell = totalRow.insertCell();
            totalScoreCell.id = `${player}-total-score`;
            totalScoreCell.textContent = '0';
        });
    }

    highlightCurrentCell() {
        const table = document.getElementById('scoreTable');
        const row = table.rows[this.currentRound + 1]; // +1 to account for header row
        const player = this.playerOrder[this.currentPlayerIndex];
        const column = this.isPredictionPhase ? 'Pred' : 'Tricks';
        const cellIndex = 3 + this.players.indexOf(player) * 3 + (column === 'Pred' ? 0 : 1);
        
        // Remove highlight from all cells
        Array.from(table.getElementsByTagName('td')).forEach(cell => cell.classList.remove('highlighted'));
        
        // Highlight current cell
        row.cells[cellIndex].classList.add('highlighted');
    }

    updateScoreboard() {
        const table = document.getElementById('scoreTable');
        for (let i = 0; i < this.cardsPerRound.length; i++) {
            const row = table.rows[i + 1]; // +1 to account for header row
            this.players.forEach((player, playerIndex) => {
                const predIndex = 3 + playerIndex * 3;
                const tricksIndex = 4 + playerIndex * 3;
                const scoreIndex = 5 + playerIndex * 3;

                row.cells[predIndex].textContent = this.predictions[player][i] !== undefined ? this.predictions[player][i] : '';
                row.cells[tricksIndex].textContent = this.tricks[player][i] !== undefined ? this.tricks[player][i] : '';
                row.cells[scoreIndex].textContent = this.scores[player][i] !== undefined ? this.scores[player][i] : '';
            });
        }

        // Update total scores
        this.players.forEach(player => {
            const totalScore = this.scores[player].reduce((a, b) => a + b, 0);
            document.getElementById(`${player}-total-score`).textContent = totalScore;
        });
    }

    handleInput(value) {
        const player = this.playerOrder[this.currentPlayerIndex];
        const cards = this.cardsPerRound[this.currentRound];
        const numValue = parseInt(value);
    
        if (isNaN(numValue) || numValue < 0 || numValue > cards) {
            alert(`Please enter a valid number between 0 and ${cards}.`);
            return;
        }
    
        if (this.isPredictionPhase) {
            this.predictions[player][this.currentRound] = numValue;
        } else {
            this.tricks[player][this.currentRound] = numValue;
            this.updateScore(player);
        }
    
        this.updateScoreboard();
        this.moveToNextInput();
        
        // Clear the input field
        document.getElementById('inputValue').value = '';
    }

    updateScore(player) {
        const prediction = this.predictions[player][this.currentRound];
        const tricks = this.tricks[player][this.currentRound];
        const score = prediction === tricks ? 10 + prediction : (10 + prediction) * -1;
        this.scores[player][this.currentRound] = score;
    }

    moveToNextInput() {
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
            if (!this.isPredictionPhase) {
                this.currentRound++;
                this.isPredictionPhase = true;
                // Rotate player order for the next round
                this.playerOrder.push(this.playerOrder.shift());
            } else {
                this.isPredictionPhase = false;
            }
        }
        if (this.currentRound >= this.cardsPerRound.length) {
            this.endGame();
            return;
        }
        this.highlightCurrentCell();
        this.updateRoundInfo();
        this.createNumberButtons(); // Update the number buttons for the new round/phase
    }

    updateRoundInfo() {
        const roundInfo = document.getElementById('roundInfo');
        const phase = this.isPredictionPhase ? 'Prediction' : 'Tricks';
        const player = this.playerOrder[this.currentPlayerIndex];
        const cards = this.cardsPerRound[this.currentRound];
        const trump = this.trumpSuites[this.currentRound % this.trumpSuites.length];
        roundInfo.textContent = `Round ${this.currentRound + 1}, Cards: ${cards}, Trump: ${trump}, ${phase} for ${player}`;
        this.createNumberButtons();
    }

    endGame() {
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'results';
        resultsDiv.innerHTML = '<h2>Game Over</h2>';
    
        const finalScores = this.players.map(player => ({
            name: player,
            score: this.scores[player].reduce((a, b) => a + b, 0)
        }));
    
        finalScores.sort((a, b) => b.score - a.score);
    
        resultsDiv.innerHTML += '<h3>Final Scores:</h3>';
        finalScores.forEach(player => {
            resultsDiv.innerHTML += `<p>${player.name}: ${player.score}</p>`;
        });
    
        resultsDiv.innerHTML += `<h3>The winner is ${finalScores[0].name} with ${finalScores[0].score} points!</h3>`;
    
        // Append the results div after the scoreboardContainer
        document.getElementById('scoreboardContainer').insertAdjacentElement('afterend', resultsDiv);
    
        // Disable further input
        document.getElementById('inputValue').disabled = true;
        document.getElementById('submitInput').disabled = true;
    }

    createNumberButtons() {
        const buttonContainer = document.getElementById('numberButtons');
        buttonContainer.innerHTML = '';
        const maxCards = this.cardsPerRound[this.currentRound];
        for (let i = 0; i <= maxCards; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.addEventListener('click', () => {
                this.handleInput(i);
            });
            buttonContainer.appendChild(button);
        }
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

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    scoreboard.createScoreboard();
    scoreboard.highlightCurrentCell();
    scoreboard.updateRoundInfo();
}

function handleInput() {
    const inputValue = document.getElementById('inputValue').value.trim();
    
    // Check for blank input
    if (inputValue === '') {
        alert('Please enter a value. Blank inputs are not allowed.');
        return;
    }

    const numericValue = parseInt(inputValue);

    // Check for NaN
    if (isNaN(numericValue)) {
        alert('Please enter a valid number.');
        return;
    }

    scoreboard.handleInput(numericValue);
    // const inpNode = document.getElementById('inputValue');
    // console.log(inpNode)
    document.getElementById('inputValue').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startGame').addEventListener('click', startGame);
    document.getElementById('submitInput').addEventListener('click', handleInput);
    document.getElementById('inputValue').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleInput();
        }
    });
});
