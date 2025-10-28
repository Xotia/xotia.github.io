# Instructions pour le Copilot LoL Helper

## Description du Projet
Ce projet contient deux applications complémentaires pour aider à la sélection de champions dans League of Legends :

1. **Find-Champ** : Un filtre pour trouver des champions selon des critères spécifiques
2. **Draft-Helper** : Un outil d'aide à la décision pendant la phase de draft

## Structure du Projet
```
data/
    champions.json         # Base de données partagée des champions et leurs critères
find-champ/              # Application de recherche de champions
    index.html
    script.js
    style.css
draft-helper/            # Application d'aide au draft
    index.html
    script.js
    style.css
    criteria.js
```

## Format des Données
Les champions sont définis dans champions.json avec la structure suivante :
```javascript
{
    "id": number,
    "name": string,
    "image": string,
    "criteria": {
        [criteriaName: string]: boolean
    }
}
```

## Critères Disponibles
### Type de dégât
- AD
- AP

### Rôles
- Assassin
- Tank
- Bruiser
- Carry
- Mage
- Support

### Portée
- Mêlée
- Distance

### CC (Crowd Control)
- Stun
- Slow
- Trap
- Bump
- Silence

### Mobilité
- Escape
- Dash
- Traverse wall
- TP

### Type de menace
- Poke
- Global
- Engage
- Flank
- Split push
- Wombo combo
- Frontline
- Accès à la back line

### Fragilité
- Duelliste
- Fragile
- Tank

## Instructions pour les Règles de Priorité

### Format des Règles
Pour définir les règles de priorité d'un champion dans le draft-helper, utilisez la structure suivante :
```javascript
if (champion.name === "NomDuChampion") {
    // Points selon les critères de l'équipe adverse
    priority += enemyTeamCriteria['Critère'] || 0;
    priority -= enemyTeamCriteria['Critère'] || 0;

    // Points selon les critères de l'équipe alliée
    priority += allyTeamCriteria['Critère'] || 0;
    priority -= allyTeamCriteria['Critère'] || 0;

    // Bonus/Malus conditionnels
    if (condition) priority += points;
}
```

### Exemples de Règles
```javascript
// Exemple pour Rammus
if (champion.name === "Rammus") {
    // +1 pour chaque AD enemy
    priority += enemyTeamCriteria['AD'] || 0;
    // -1 pour chaque AP enemy
    priority -= enemyTeamCriteria['AP'] || 0;
    // +2 si pas de tank allié
    if ((allyTeamCriteria['Tank'] || 0) === 0) {
        priority += 2;
    }
}
```

## Exemples de Règles Complexes

### Règles avec Conditions Multiples
```javascript
// Exemple pour Shen - Règles basées sur la composition d'équipe
if (champion.name === "Shen") {
    // Conditions de base
    if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;
    if ((allyTeamCriteria['Support'] || 0) === 0) priority += 1;

    // Condition qui vérifie les deux équipes
    const globalPresence = (allyTeamCriteria['Global'] || 0) + (enemyTeamCriteria['Global'] || 0);
    if (globalPresence > 0) priority += 1;

    // Conditions multiples pour le style de jeu
    if ((allyTeamCriteria['Split push'] || 0) === 0) priority += 1;
    if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 1;

    // Malus basé sur l'équipe ennemie
    priority -= enemyTeamCriteria['Kite'] || 0;
}
```

### Règles basées sur les Synergies d'Équipe
```javascript
// Exemple de synergie avec les comps Globals
if (champion.criteria['Global']) {
    // Bonus si d'autres champions globals dans l'équipe
    if (allyTeamCriteria['Global'] > 0) priority += 1;
    
    // Bonus supplémentaire pour une comp split push
    if (allyTeamCriteria['Split push'] > 0) priority += 1;
}

// Exemple de synergie tank/engage
if (champion.criteria['Tank'] && champion.criteria['Engage']) {
    // Bonus si l'équipe a déjà du follow-up
    if (allyTeamCriteria['CC'] >= 2) priority += 2;
}
```

## Gestion des Priorités Négatives

Les priorités négatives sont importantes pour indiquer les mauvais matchups ou les compositions défavorables. Voici comment les gérer :

1. Les malus s'appliquent après les bonus
2. Une priorité négative finale indique un très mauvais choix
3. Utilisez des seuils pour les malus (-1 par point de counter, mais pas plus de -3)

```javascript
// Exemple de gestion des priorités négatives
let priority = 0;

// D'abord appliquer les bonus
priority += positiveConditions;

// Ensuite appliquer les malus avec un seuil
const malus = enemyTeamCriteria['Counter'] || 0;
priority -= Math.min(malus, 3); // Limite le malus à -3
```

## Test des Règles

Pour tester vos règles, suivez ces étapes :

1. Testez les cas basiques :
   ```javascript
   // Test de base pour Shen
   allyTeamCriteria['Tank'] = 0;  // Devrait donner +2
   allyTeamCriteria['Support'] = 0;  // Devrait donner +1
   ```

2. Testez les interactions :
   ```javascript
   // Test des interactions entre règles
   allyTeamCriteria['Global'] = 1;
   enemyTeamCriteria['Global'] = 1;  // Ne devrait donner qu'une fois le bonus
   ```

3. Testez les limites :
   ```javascript
   // Test des valeurs limites
   enemyTeamCriteria['Kite'] = 5;  // Vérifier que les malus ne sont pas trop pénalisants
   ```

### Entrées/Sorties d'Exemple
Entrée utilisateur :
"Pour Shen : +2 points si pas de tank allié, +1 point si pas de support allié, +1 point si présence de global dans une des deux équipes, +1 point si pas de split push allié, +1 point si pas d'engage allié, -1 point par kite ennemi"

Sortie générée :
```javascript
if (champion.name === "Shen") {
    // Bonus si pas de tank allié
    if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;
    
    // Bonus si pas de support allié
    if ((allyTeamCriteria['Support'] || 0) === 0) priority += 1;
    
    // Bonus pour les compos avec global
    const globalPresence = (allyTeamCriteria['Global'] || 0) + (enemyTeamCriteria['Global'] || 0);
    if (globalPresence > 0) priority += 1;
    
    // Bonus pour les rôles manquants
    if ((allyTeamCriteria['Split push'] || 0) === 0) priority += 1;
    if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 1;
    
    // Malus contre les comps kite
    priority -= enemyTeamCriteria['Kite'] || 0;
}
```