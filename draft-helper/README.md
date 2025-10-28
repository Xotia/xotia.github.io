# LoL Draft Helper

Un outil d'aide à la sélection de champions pendant la phase de draft de League of Legends.

## Description

Cette application web aide à choisir le meilleur champion en fonction de la composition des équipes pendant la phase de draft. Elle analyse en temps réel les caractéristiques des équipes et suggère les champions les plus appropriés selon un système de points de priorité.

## Fonctionnalités

### Interface de compteurs d'équipe
- Deux panneaux (équipe alliée et adverse)
- Boutons +1/-1 pour chaque caractéristique
- Mise à jour en temps réel des compteurs

### Caractéristiques suivies
1. **Type de dégâts**
   - AD
   - AP

2. **Rôles**
   - Assassin
   - Tank
   - Bruiser
   - Carry

3. **Portée**
   - Mêlée
   - Distance

4. **Contrôle**
   - CC
   - Slow
   - Trap

5. **Mobilité/Utilité**
   - Poke
   - Global
   - Escape
   - Dash

6. **Mécaniques spécifiques**
   - Skillshot unique à dodge
   - Wall type Yasuo
   - Wombo Combo

7. **Style de combat**
   - Fragile

8. **Stratégie**
   - Frontline
   - Splitpusher
   - Accès à la backline
   - Engage

### Système de priorité
- Calcul dynamique des points de priorité pour chaque champion
- Classement en temps réel des champions recommandés
- Système de conditions personnalisables pour attribuer des points

## Structure du projet
```
LolHelpPicker/
├── index.html         # Page principale
├── style.css         # Styles
├── script.js         # Logique principale
├── champions.json    # Base de données des champions
└── conditions.js     # Règles de priorité
```

## Installation
1. Cloner le repository
2. Ouvrir index.html dans un navigateur web

## Utilisation
1. Cliquer sur les boutons +/- pour ajuster les compteurs de chaque équipe
2. Observer la liste des champions recommandés se mettre à jour
3. Les champions sont classés par points de priorité

## Développement
Le projet utilise :
- HTML/CSS pour l'interface
- JavaScript vanilla pour la logique
- Stockage des données en JSON
- Pas de dépendances externes requises