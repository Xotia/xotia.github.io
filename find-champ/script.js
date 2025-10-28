// État global
let championsData = [];
let allyTeamCriteria = {};
let enemyTeamCriteria = {};

// Initialiser les compteurs
function initializeCriteria() {
    document.querySelectorAll('.criteria-item').forEach(item => {
        const criteriaName = item.querySelector('.criteria-name').textContent;
        allyTeamCriteria[criteriaName] = 0;
        enemyTeamCriteria[criteriaName] = 0;
    });
}

// Charger les champions
async function loadChampions() {
    try {
        const response = await fetch('champions.json');
        const data = await response.json();
        championsData = data.champions;
        updateChampionsList();
    } catch (error) {
        console.error('Erreur lors du chargement des champions:', error);
    }
}

// Mettre à jour les compteurs
function updateCounter(button, increment, isAllyTeam) {
    const criteriaItem = button.closest('.criteria-item');
    const counter = criteriaItem.querySelector('.counter');
    const criteriaName = criteriaItem.querySelector('.criteria-name').textContent;
    const criteria = isAllyTeam ? allyTeamCriteria : enemyTeamCriteria;

    let value = parseInt(counter.textContent);
    value += increment;
    value = Math.max(0, value); // Empêcher les valeurs négatives

    counter.textContent = value;
    criteria[criteriaName] = value;

    updateChampionsList();
}

// Calculer la priorité d'un champion
function calculateChampionPriority(champion) {
    let priority = 0;

    // Règles de priorité basées sur l'équipe adverse
    // Composition AD/AP
    if (enemyTeamCriteria['AD'] >= 4 && champion.criteria['Tank']) priority += 3;
    if (enemyTeamCriteria['AP'] >= 4 && champion.criteria['Tank']) priority += 3;
    if (enemyTeamCriteria['AD'] >= 3 && champion.name === "Rammus") priority += 4;
    if (enemyTeamCriteria['AP'] >= 3 && champion.name === "Galio") priority += 4;

    // Contre les compos mêlée/distance
    if (enemyTeamCriteria['Mêlée'] >= 4 && champion.criteria['Range']) priority += 2;
    if (enemyTeamCriteria['Distance'] >= 4 && champion.criteria['Dash']) priority += 2;

    // Contre les compos fragiles
    if (enemyTeamCriteria['Fragile'] >= 3 && champion.criteria['Assassin']) priority += 2;
    if (enemyTeamCriteria['Fragile'] >= 3 && champion.criteria['Engage']) priority += 2;

    // Contre les compos mobile
    if (enemyTeamCriteria['Dash'] >= 3 && champion.criteria['CC']) priority += 2;
    if (enemyTeamCriteria['Escape'] >= 3 && champion.criteria['Lock']) priority += 2;

    // Contre les compos tank
    if (enemyTeamCriteria['Tank'] >= 2 && champion.criteria['Brut']) priority += 2;
    if (enemyTeamCriteria['Tank'] >= 3 && champion.name === "Trundle") priority += 3;

    // Contre les compos assassin
    if (enemyTeamCriteria['Assassin'] >= 2 && champion.criteria['CC']) priority += 2;
    if (enemyTeamCriteria['Assassin'] >= 2 && champion.criteria['Tank']) priority += 2;

    // Contre les compos poke
    if (enemyTeamCriteria['Poke'] >= 3 && champion.criteria['Engage']) priority += 3;
    if (enemyTeamCriteria['Poke'] >= 3 && champion.criteria['Global']) priority += 2;

    // Contre les compos engage
    if (enemyTeamCriteria['Engage'] >= 3 && champion.criteria['Disengage']) priority += 3;
    if (enemyTeamCriteria['Engage'] >= 3 && champion.criteria['Peel']) priority += 2;

    // Équilibrage de la composition alliée
    if (allyTeamCriteria['AP'] <= 1 && champion.criteria['AP']) priority += 1;
    if (allyTeamCriteria['AD'] <= 1 && champion.criteria['AD']) priority += 1;
    if (allyTeamCriteria['Tank'] === 0 && champion.criteria['Tank']) priority += 2;
    if (allyTeamCriteria['CC'] <= 1 && champion.criteria['CC']) priority += 1;

    // Bonus pour les champions du pool
    if (champion.criteria['MyChampionPool']) priority += 1;

    return priority;
}

// Mettre à jour la liste des champions
function updateChampionsList() {
    const championsList = document.getElementById('champions-list');
    championsList.innerHTML = '';

    // Calculer les priorités et trier les champions
    const championPriorities = championsData
        .map(champion => ({
            ...champion,
            priority: calculateChampionPriority(champion)
        }))
        .sort((a, b) => b.priority - a.priority);

    // Afficher les champions avec leurs priorités
    championPriorities.forEach(champion => {
        if (champion.priority > 0) { // N'afficher que les champions pertinents
            const championCard = document.createElement('div');
            championCard.className = 'champion-card';
            championCard.innerHTML = `
                <img src="${champion.image}" alt="${champion.name}">
                <div class="name">${champion.name}</div>
                <div class="priority">Priorité: ${champion.priority}</div>
            `;
            championsList.appendChild(championCard);
        }
    });
}

// Ajouter les écouteurs d'événements
function setupEventListeners() {
    document.querySelectorAll('.minus-btn').forEach(button => {
        button.addEventListener('click', () => {
            const isAllyTeam = button.closest('.team-section').classList.contains('ally-team');
            updateCounter(button, -1, isAllyTeam);
        });
    });

    document.querySelectorAll('.plus-btn').forEach(button => {
        button.addEventListener('click', () => {
            const isAllyTeam = button.closest('.team-section').classList.contains('ally-team');
            updateCounter(button, 1, isAllyTeam);
        });
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeCriteria();
    loadChampions();
    setupEventListeners();
});