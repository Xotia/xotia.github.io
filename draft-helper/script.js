// État global
let championsData = null;
let allyTeamCriteria = {};
let enemyTeamCriteria = {};

// Constantes pour les niveaux de CC
const CC_LEVELS = {
    NONE: 0,      // 0 CC
    LOW: 1,       // 1-2 CC
    MEDIUM: 2,    // 3-4 CC
    HIGH: 3       // 5+ CC
};

// Fonction pour évaluer le niveau de CC d'une équipe
function evaluateTeamCCLevel(teamCriteria) {
    // Additionner tous les types de CC
    const totalCC = (teamCriteria['Stun'] || 0) +
        (teamCriteria['Slow'] || 0) +
        (teamCriteria['Trap'] || 0) +
        (teamCriteria['Bump'] || 0) +
        (teamCriteria['Silence'] || 0);

    // Déterminer le niveau de CC
    if (totalCC === 0) return CC_LEVELS.NONE;
    if (totalCC <= 3) return CC_LEVELS.LOW;
    if (totalCC <= 6) return CC_LEVELS.MEDIUM;
    return CC_LEVELS.HIGH;
}

// Charger les champions
async function loadChampions() {
    try {
        const response = await fetch('../data/champions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        championsData = data;
        console.log('Champions chargés:', championsData); // Pour debug
        updateChampionsList();
    } catch (error) {
        console.error('Erreur lors du chargement des champions:', error);
        document.getElementById('champions-list').innerHTML = 'Erreur lors du chargement des champions';
    }
}

// Initialiser les compteurs
function initializeCriteria() {
    document.querySelectorAll('.criteria-item').forEach(item => {
        const criteriaName = item.querySelector('.criteria-name').textContent;
        allyTeamCriteria[criteriaName] = 0;
        enemyTeamCriteria[criteriaName] = 0;
    });
}

function checkResetButtonState() {
    const resetButton = document.getElementById('reset-button');
    const allCounters = document.querySelectorAll('.counter');
    let hasNonZeroCounter = false;

    allCounters.forEach(counter => {
        if (parseInt(counter.textContent) !== 0) {
            hasNonZeroCounter = true;
        }
    });

    if (hasNonZeroCounter) {
        resetButton.classList.remove('disabled');
    } else {
        resetButton.classList.add('disabled');
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
    checkResetButtonState();
    updateChampionsList();
}

// Calculer la priorité d'un champion
function calculateChampionPriority(champion) {
    let priority = 0;

    // Évaluer le niveau de CC des équipes
    const enemyTeamCCLevel = evaluateTeamCCLevel(enemyTeamCriteria);
    const allyTeamCCLevel = evaluateTeamCCLevel(allyTeamCriteria);

    // Bonus de base pour les champions du pool
    if (champion.criteria && champion.criteria['MyChampionPool'] === true) {
        priority += 2;
    }

    // Règles spécifiques pour chaque champion
    if (champion.name === "Volibear") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 1;
                break;
            case CC_LEVELS.LOW:
                priority -= 0.5;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 0.5;
                break;
            case CC_LEVELS.HIGH:
                priority += 1;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 1;
                break;
            case CC_LEVELS.LOW:
                priority += 0.5;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 0.5;
                break;
            case CC_LEVELS.HIGH:
                priority -= 1;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus pour chaque champion mêlée ennemi
        priority += (enemyTeamCriteria['Mêlée'] || 0) * 0.5;
    }

    if (champion.name === "Jarvan IV") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 0.5;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si l'équipe ennemie n'a pas de mobilité
        const enemyMobility = (enemyTeamCriteria['Escape'] || 0) +
            (enemyTeamCriteria['Dash'] || 0) +
            (enemyTeamCriteria['Traverse wall'] || 0) +
            (enemyTeamCriteria['TP'] || 0);
        if (enemyMobility === 0) {
            priority += 3;
        } else {
            priority -= 3 - enemyMobility * 0.5;
        }

        // Bonus pour wombo combo allié
        priority += allyTeamCriteria['Wombo combo'] || 0;
    }

    if (champion.name === "Master Yi") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) {
            priority += 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 2;

        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // Malus si peu ou pas de CC allié
        if (allyTeamCCLevel <= CC_LEVELS.LOW) {
            priority -= 2;
        }

        // Bonus pour chaque tank ennemi
        priority += enemyTeamCriteria['Tank'] || 0;

        // Bonus/Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }
    }

    if (champion.name === "Nocturne") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) {
            priority += 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 2;

        // Bonus pour chaque tank allié
        priority += allyTeamCriteria['Tank'] || 0;

        // Bonus pour chaque Global (allié ou ennemi)
        const globalPresence = (allyTeamCriteria['Global'] || 0) + (enemyTeamCriteria['Global'] || 0);
        priority += globalPresence;

        // Bonus/Malus selon la fragilité des ennemis
        priority += enemyTeamCriteria['Fragile'] || 0;
        priority -= enemyTeamCriteria['Tank'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) {
            priority += 2;
        }

        // Bonus/Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 3;
                break;
            case CC_LEVELS.LOW:
                priority += 2;
                break;
            case CC_LEVELS.HIGH:
                priority += 1;
                break;
        }

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
        }
    }

    if (champion.name === "Rammus") {
        // +1 pour chaque AD enemy
        priority += enemyTeamCriteria['AD'] || 0;

        // -1 pour chaque AP enemy
        priority -= enemyTeamCriteria['AP'] || 0;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2.5;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // -1 pour chaque Brut enemy (moins impactant que AP mais toujours négatif)
        priority -= (enemyTeamCriteria['Brut'] || 0) * 1;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 0.55;
        // -1 pour chaque Tank allié
        priority -= allyTeamCriteria['Tank'] || 0;

        // +2 si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority += 2;
        }

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;
    }

    if (champion.name === "Sejuani") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 1;
                break;
            case CC_LEVELS.LOW:
                priority -= 0.5;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 0.5;
                break;
            case CC_LEVELS.HIGH:
                priority += 1;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;

        // Bonus pour chaque champion mêlée allié
        priority += allyTeamCriteria['Mêlée'] || 1.5;
    }

    if (champion.name === "Shen") {
        // Bonus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 1;
                break;
        }
        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority += 2;
        }

        // Bonus si pas de support allié
        if ((allyTeamCriteria['Support'] || 0) === 0) {
            priority += 1;
        }

        // Bonus si plus de 1 carry allié
        if ((allyTeamCriteria['Carry'] || 0) > 1) {
            priority += 1.5;
        }

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2.5;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 1;

        // Bonus si pas de support allié
        if ((allyTeamCriteria['Support'] || 0) === 0) {
            priority += 1;
        }

        // Bonus pour les compos avec global
        const globalPresence = (allyTeamCriteria['Global'] || 0) + (enemyTeamCriteria['Global'] || 0);
        if (globalPresence > 0) {
            priority += 1;
        }

        // Bonus si pas de split pusher allié
        if ((allyTeamCriteria['Split push'] || 0) === 0) {
            priority += 1;
        }

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) {
            priority += 1;
        }

        // Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.LOW:
                priority -= 0.5;
                break;
            case CC_LEVELS.NONE:
                priority += 1;
                break;
        }

        // Malus pour chaque dégât brut ennemi
        priority -= enemyTeamCriteria['Brut'] || 0;

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 1;
    }

    if (champion.name === "Chogath") {
        // -1 pour chaque AP allié
        priority -= allyTeamCriteria['AP'] || 0;
        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Malus pour dash et traverse wall ennemis
        priority -= enemyTeamCriteria['Dash'] || 0;
        priority -= enemyTeamCriteria['TP'] || 0;
        priority -= enemyTeamCriteria['Escape'] || 0;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 1;

        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si moins de 4 points dans la catégorie "CC" allié
        if ((allyTeamCriteria['CC'] || 0) < 4) priority += 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;

        // Bonus pour chaque champion mêlée ennemi
        priority += enemyTeamCriteria['Mêlée'] || 0;

        // Malus pour chaque champion distance ennemi
        priority -= enemyTeamCriteria['Distance'] || 0;

        // Malus pour chaque dégât brut ennemi
        priority -= enemyTeamCriteria['Brut'] || 0;

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 1;

        // Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.LOW:
                priority -= 0.5;
                break;
            // Pas de malus si pas de CC
        }

        // Bonus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            // Pas de malus si pas de CC
        }


    }

    if (champion.name === "Warwick") {
        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus si au moins 1 tank allié
        if ((allyTeamCriteria['Tank'] || 0) >= 1) priority += 1;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 1;

        // Bonus/Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 1;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Wukong") {
        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si au moins 1 tank allié
        if ((allyTeamCriteria['Tank'] || 0) >= 1) priority += 1;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 1;

        // Bonus/Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 1;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Vi") {
        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si au moins 1 tank allié
        if ((allyTeamCriteria['Tank'] || 0) >= 1) priority += 1;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 1;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;

        // Bonus/Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 1;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Nunu") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // -1 pour chaque AP allié
        priority -= allyTeamCriteria['AP'] || 0;

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Malus pour chaque champion distance ennemi
        priority -= enemyTeamCriteria['Distance'] || 0;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 0.75;

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Bonus si stun allié
        if ((allyTeamCriteria['Stun'] || 0) > 0) priority += 1;

        // Malus pour dash et traverse wall ennemis
        priority -= enemyTeamCriteria['Dash'] || 0;
        priority -= (enemyTeamCriteria['Traverse wall'] || 0) * 2;
        priority -= enemyTeamCriteria['TP'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus pour wombo combo allié
        priority += allyTeamCriteria['Wombo combo'] || 0;
    }

    if (champion.name === "Amumu") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // -1 pour chaque AP allié
        priority -= allyTeamCriteria['AP'] || 0;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 2;

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Malus pour chaque champion distance ennemi
        priority -= enemyTeamCriteria['Distance'] || 0;

        // Bonus pour chaque champion Mêlée ennemi
        priority += enemyTeamCriteria['Mêlée'] || 0;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 1;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus si stun allié
        if ((allyTeamCriteria['Stun'] || 0) > 0) priority += 1;

        // Malus pour dash et traverse wall ennemis
        priority -= enemyTeamCriteria['Dash'] || 0;
        priority -= (enemyTeamCriteria['Traverse wall'] || 0) * 2;
        priority -= enemyTeamCriteria['TP'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus pour wombo combo allié
        priority += allyTeamCriteria['Wombo combo'] || 0;
    }

    if (champion.name === "Hecarim") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 0.75;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 0.75;

        // Bonus pour chaque champion mêlée ennemi
        priority += (enemyTeamCriteria['Mêlée'] || 0) * 0.75;

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 0.5;
    }

    if (champion.name === "Gwen") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AP allié
        priority -= allyTeamCriteria['AP'] || 0;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;

        // Bonus pour chaque tank ennemi
        priority += enemyTeamCriteria['Tank'] || 0;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 0.5;

        // Malus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 2;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 1;
    }

    if (champion.name === "Pantheon") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 0.75;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 2;

        // Bonus pour chaque Global (allié ou ennemi)
        const globalPresence = (allyTeamCriteria['Global'] || 0) + (enemyTeamCriteria['Global'] || 0);
        priority += globalPresence;

        // Malus pour dash et traverse wall ennemis
        priority -= enemyTeamCriteria['Dash'] || 0;
        priority -= (enemyTeamCriteria['Traverse wall'] || 0) * 2;
        priority -= enemyTeamCriteria['TP'] || 0;
    }

    if (champion.name === "Udyr") {
        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= (enemyTeamCriteria['Trap'] || 0) * 0.5;

        // Malus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 1;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 1.5;
    }

    if (champion.name === "Evelynn") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AP allié
        priority -= allyTeamCriteria['AP'] || 0;

        // Bonus/Malus selon la fragilité des ennemis
        priority += enemyTeamCriteria['Fragile'] || 0;
        priority -= enemyTeamCriteria['Tank'] || 0;

        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas d'assassin allié
        if ((allyTeamCriteria['Assassin'] || 0) === 0) priority += 1;

        // Bonus si pas de mage allié
        if ((allyTeamCriteria['Mage'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 2;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 2;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;
    }

    if (champion.name === "Kha'Zix") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas d'assassin allié
        if ((allyTeamCriteria['Assassin'] || 0) === 0) priority += 1;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 1;
                break;
            case CC_LEVELS.LOW:
                priority += 0.5;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 0.5;
                break;
            case CC_LEVELS.HIGH:
                priority -= 1;
                break;
        }

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;

        // Bonus/Malus selon la fragilité des ennemis
        priority += enemyTeamCriteria['Fragile'] || 0;
        priority -= enemyTeamCriteria['Tank'] || 0;
    }

    if (champion.name === "Zac") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Jax") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // malus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;

        // Bonus pour chaque champion distance ennemi
        priority += enemyTeamCriteria['Distance'] || 0;
    }

    if (champion.name === "Ivern") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas de mage allié
        if ((allyTeamCriteria['Mage'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Malus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Olaf") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 1;
                break;
            case CC_LEVELS.LOW:
                priority += 2;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 3;
                break;
            case CC_LEVELS.HIGH:
                priority += 4;
                break;
        }

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 1;
    }

    if (champion.name === "Skarner") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Dr.Mundo") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Malus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 2;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;

        // Bonus pour chaque champion mêlée ennemi
        priority += enemyTeamCriteria['Mêlée'] || 0;
    }

    if (champion.name === "Xin Zhao") {
        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si au moins 1 tank allié
        if ((allyTeamCriteria['Tank'] || 0) >= 1) priority += 1;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas peu de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) < 2) priority += 1;

        // Bonus/Malus selon le niveau de CC ennemi
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 1.5;
                break;
            case CC_LEVELS.LOW:
                priority += 0.5;
                break;
            case CC_LEVELS.HIGH:
                priority -= 1.5;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 0.5;
                break;
        }

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 1;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus pour chaque champion distance ennemi
        priority += enemyTeamCriteria['Distance'] || 0;
    }

    if (champion.name === "Poppy") {
        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;

        // Bonus pour chaque dash dans l'équipe ennemie
        priority += (enemyTeamCriteria['Dash'] || 0) * 1.5;
    }

    if (champion.name === "Malphite") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // -1 pour chaque AP allié
        priority -= allyTeamCriteria['AP'] || 0;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 1;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus si pas de mage allié
        if ((allyTeamCriteria['Mage'] || 0) === 0) priority += 1;

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Bonus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 1;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 1;

        // Bonus pour wombo combo allié
        priority += allyTeamCriteria['Wombo combo'] || 0;
    }

    if (champion.name === "Trundle") {
        // Malus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) {
            priority -= 2;
        }

        // -1 pour chaque AD allié
        priority -= allyTeamCriteria['AD'] || 0;

        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas d'AD allié
        if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;

        // Bonus si pas de bruiser allié
        if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Malus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;
    }

    if (champion.name === "Maokai") {
        // Bonus si pas d'AP allié
        if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;

        // Bonus si pas de tank allié
        if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;

        // Bonus/Malus selon le niveau de CC allié
        switch (allyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority -= 2;
                break;
            case CC_LEVELS.LOW:
                priority -= 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority += 1;
                break;
            case CC_LEVELS.HIGH:
                priority += 2;
                break;
        }

        // Bonus/Malus selon le niveau de CC ennemie
        switch (enemyTeamCCLevel) {
            case CC_LEVELS.NONE:
                priority += 2;
                break;
            case CC_LEVELS.LOW:
                priority += 1;
                break;
            case CC_LEVELS.MEDIUM:
                priority -= 1;
                break;
            case CC_LEVELS.HIGH:
                priority -= 2;
                break;
        }

        // Malus pour chaque trap ennemi
        priority -= enemyTeamCriteria['Trap'] || 0;

        // Bonus si pas d'engage allié
        if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;

        // Malus si pas de waveclear allié
        if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;

        // Bonus si pas de frontline allié
        if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;
    }

    return Math.round(priority * 10) / 10; // Arrondir à une décimale
}

// Mettre à jour la liste des champions
function updateChampionsList() {
    if (!championsData) {
        console.log('Pas de données de champions disponibles');
        return;
    }

    const championsList = document.getElementById('champions-list');
    if (!championsList) {
        console.log('Liste des champions non trouvée dans le DOM');
        return;
    }

    championsList.innerHTML = '';

    // Calculer les priorités et trier les champions
    const championPriorities = championsData.champions
        .map(champion => ({
            ...champion,
            priority: calculateChampionPriority(champion)
        }))
        .sort((a, b) => b.priority - a.priority);

    console.log('Champions avec priorités:', championPriorities);

    // Afficher les champions
    championPriorities.forEach(champion => {
        const championCard = document.createElement('div');
        championCard.className = 'champion-card';
        championCard.innerHTML = `
            <img src="${champion.image}" alt="${champion.name}">
            <div class="name">${champion.name}</div>
            <div class="priority">Priorité: ${champion.priority}</div>
        `;
        championsList.appendChild(championCard);
    });
}

// Réinitialiser tous les compteurs
function resetAllCounters() {
    const resetButton = document.getElementById('reset-button');
    if (resetButton.classList.contains('disabled')) {
        return;
    }

    document.querySelectorAll('.counter').forEach(counter => {
        counter.textContent = '0';
    });

    // Réinitialiser les critères
    Object.keys(allyTeamCriteria).forEach(key => {
        allyTeamCriteria[key] = 0;
    });
    Object.keys(enemyTeamCriteria).forEach(key => {
        enemyTeamCriteria[key] = 0;
    });

    checkResetButtonState();
    updateChampionsList();
}

// Configurer les écouteurs d'événements
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
    console.log('DOM chargé, initialisation...');
    setTimeout(() => {
        initializeCriteria();
        setupEventListeners();
        loadChampions();
        checkResetButtonState();

        // Ajouter l'écouteur d'événement pour le bouton reset
        document.getElementById('reset-button').addEventListener('click', resetAllCounters);
    }, 100);
});