// Définition des catégories de critères
const criteriaCategories = [
    {
        title: "Type de dégât",
        items: ["AD", "AP", "Brut"]
    },
    {
        title: "Rôles",
        items: ["Assassin", "Tank", "Bruiser", "Carry", "Mage", "Support"]
    },
    {
        title: "Portée",
        items: ["Mêlée", "Distance"]
    },
    {
        title: "CC",
        items: ["Stun", "Slow", "Trap", "Bump", "Silence"]
    },
    {
        title: "Mobilité",
        items: ["Escape", "Dash", "Traverse wall", "TP"]
    },
    {
        title: "Type de menace",
        items: [
            "Poke",
            "Global",
            "Engage",
            "Flank",
            "Split push",
            "Wombo combo",
            "Frontline",
            "Accès à la back line",
            "Waveclear"
        ]
    },
    {
        title: "Fragilité",
        items: ["Fragile"]
    }
];

// Fonction pour générer la structure HTML des critères
function generateCriteriaHTML(containerElement) {
    containerElement.innerHTML = ''; // Nettoyer le conteneur

    criteriaCategories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'criteria-group';

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category.title;
        categoryDiv.appendChild(categoryTitle);

        category.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'criteria-item';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'minus-btn';
            minusBtn.textContent = '-';

            const itemName = document.createElement('span');
            itemName.className = 'criteria-name';
            itemName.textContent = item;

            const counter = document.createElement('span');
            counter.className = 'counter';
            counter.textContent = '0';

            const plusBtn = document.createElement('button');
            plusBtn.className = 'plus-btn';
            plusBtn.textContent = '+';

            itemDiv.appendChild(minusBtn);
            itemDiv.appendChild(itemName);
            itemDiv.appendChild(counter);
            itemDiv.appendChild(plusBtn);
            categoryDiv.appendChild(itemDiv);
        });

        containerElement.appendChild(categoryDiv);
    });
}

// Initialisation des critères pour les deux équipes
document.addEventListener('DOMContentLoaded', () => {
    const allyContainer = document.querySelector('.ally-team .criteria-list');
    const enemyContainer = document.querySelector('.enemy-team .criteria-list');

    if (allyContainer && enemyContainer) {
        generateCriteriaHTML(allyContainer);
        generateCriteriaHTML(enemyContainer);
        console.log('Critères générés avec succès');
    } else {
        console.error('Conteneurs de critères non trouvés');
    }
});