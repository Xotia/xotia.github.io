import json

def load_champions():
    try:
        with open('find-champ/champions.json', 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        try:
            with open('data/champions.json', 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            print("Erreur : Impossible de trouver le fichier champions.json")
            return None

def find_champion(champions_data, champion_name):
    if not champions_data or 'champions' not in champions_data:
        print("Erreur : Les données des champions sont invalides ou manquantes")
        return None

    # Créer une liste de tous les noms de champions disponibles
    available_champions = [champion.get('name', '') for champion in champions_data['champions']]

    # Chercher le champion
    for champion in champions_data['champions']:
        if champion.get('name', '').lower() == champion_name.lower():
            return champion

    # Si le champion n'est pas trouvé, afficher un message d'erreur avec des suggestions
    print(f"\nErreur : Champion '{champion_name}' non trouvé.")
    print("\nChampions disponibles :")
    print(", ".join(sorted(available_champions)))
    return None

def generate_rules(champion):
    rules = []
    rules.append(f"if (champion.name === \"{champion['name']}\") {{")

    # Vérification du critère Tank
    if not champion['criteria'].get('Tank', False):
        rules.append('''    // Malus si pas de tank allié
    if ((allyTeamCriteria['Tank'] || 0) === 0) {
        priority -= 2;
    }''')

    # Vérifier les critères de base
    if champion['criteria'].get('AP'):
        rules.append('''    // Bonus si pas d'AP allié
    if ((allyTeamCriteria['AP'] || 0) === 0) priority += 2;''')

    if champion['criteria'].get('AD'):
        rules.append('''    // Bonus si pas d'AD allié
    if ((allyTeamCriteria['AD'] || 0) === 0) priority += 2;''')

    if champion['criteria'].get('Tank'):
        rules.append('''    // Bonus si pas de tank allié
    if ((allyTeamCriteria['Tank'] || 0) === 0) priority += 2;''')

    if champion['criteria'].get('Bruiser'):
        rules.append('''    // Bonus si pas de bruiser allié
    if ((allyTeamCriteria['Bruiser'] || 0) === 0) priority += 1;''')

    if champion['criteria'].get('Assassin'):
        rules.append('''    // Bonus si pas d'assassin allié
    if ((allyTeamCriteria['Assassin'] || 0) === 0) priority += 1;''')

    if champion['criteria'].get('Mage'):
        rules.append('''    // Bonus si pas de mage allié
    if ((allyTeamCriteria['Mage'] || 0) === 0) priority += 2;''')

    # Questions à l'utilisateur
    if input("\nEst-ce que le champion est dépendant des CC de la team allié ? (oui/non) ").lower() == 'oui':
        rules.append('''    // Bonus/Malus selon le niveau de CC allié
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
    }''')

    if input("\nEst-ce que le champion est sensible aux CC de l'équipe ennemie ? (oui/non) ").lower() == 'oui':
        rules.append('''    // Bonus/Malus selon le niveau de CC ennemie
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
    }''')

    if input("\nEst-ce que le champion est sensible aux trap ennemie ? (oui/non) ").lower() == 'oui':
        rules.append('''    // Malus pour chaque trap ennemi
    priority -= enemyTeamCriteria['Trap'] || 0;''')

    # Nouvelle question pour l'engage
    engage_response = input("\nEst-ce que le champion a un potentiel d'engage ? (oui/non) ").lower()
    if engage_response == 'oui':
        rules.append('''    // Bonus si pas d'engage allié
    if ((allyTeamCriteria['Engage'] || 0) === 0) priority += 2;''')
    else:
        rules.append('''    // Malus si pas d'engage allié
    if ((allyTeamCriteria['Engage'] || 0) === 0) priority -= 2;''')

    # Nouvelle question pour le waveclear
    waveclear_response = input("\nEst-ce que le champion a un potentiel de waveclear ? (oui/non) ").lower()
    if waveclear_response == 'oui':
        rules.append('''    // Bonus si pas de waveclear allié
    if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority += 2;''')
    else:
        rules.append('''    // Malus si pas de waveclear allié
    if ((allyTeamCriteria['Waveclear'] || 0) === 0) priority -= 2;''')

    # Nouvelle question pour le frontline
    frontline_response = input("\nEst-ce que le champion a un potentiel de frontline ? (oui/non) ").lower()
    if frontline_response == 'oui':
        rules.append('''    // Bonus si pas de frontline allié
    if ((allyTeamCriteria['Frontline'] || 0) === 0) priority += 2;''')
    else:
        rules.append('''    // malus si pas de frontline allié
    if ((allyTeamCriteria['Frontline'] || 0) === 0) priority -= 2;''')

    # Fermer la condition if
    rules.append("}")

    return "\n\n".join(rules)

def main():
    print("=== Générateur de règles pour les champions ===\n")
    
    # Charger les données des champions
    champions_data = load_champions()
    if not champions_data:
        return

    # Demander le nom du champion
    champion_name = input("Entrez le nom du champion : ")

    # Trouver le champion
    champion = find_champion(champions_data, champion_name)

    if champion:
        print(f"\nChampion trouvé : {champion['name']}")
        
        # Générer les règles
        rules = generate_rules(champion)

        # Sauvegarder dans un fichier
        with open('resultats.txt', 'w', encoding='utf-8') as file:
            file.write(rules)
        print(f"\nLes règles ont été générées dans le fichier 'resultats.txt'")
    else:
        print(f"\nChampion '{champion_name}' non trouvé.")

if __name__ == "__main__":
    main()