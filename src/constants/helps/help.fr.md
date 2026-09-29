# Aide AblaufDiagramm

## Raccourcis clavier

| Raccourci | Action |
| --- | --- |
| `Ctrl + Z` | Annuler la dernière opération |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Rétablir l'opération annulée |
| `Ctrl + D` | Dupliquer les nœuds sélectionnés, y compris en sélection multiple |
| `Delete` / `Backspace` | Supprimer les nœuds ou la relation sélectionnés, ignoré dans les champs de saisie |
| `Ctrl + A` | Sélectionner tous les nœuds personne |
| `Ctrl + =` / `Ctrl + +` | Zoom avant |
| `Ctrl + -` | Zoom arrière |
| `Escape` | Tout désélectionner / annuler une relation en cours |
| `Space + Drag` | Maintenir Espace et faire glisser pour déplacer le canevas |
| `Mouse Wheel` | Zoomer le canevas (10% ~ 1000%) |
| `Ctrl + Click` | Sélection multiple / désélection de nœuds individuels |
| `Drag on empty canvas` | Sélectionner plusieurs nœuds par rectangle |

## Guide d'utilisation

### Ajouter des nœuds

1. Cliquez sur `+` dans la barre latérale compacte pour créer un nouveau nœud personne sur le canevas.
2. Sélectionnez un nœud, puis cliquez sur `↳` dans la barre latérale ou sur `+` dans la barre contextuelle du nœud pour créer un enfant en dessous avec une relation parent-enfant automatique.
3. Sélectionnez un nœud, puis cliquez sur `⇄` dans la barre contextuelle du nœud pour créer un conjoint à côté avec une relation conjoint automatique.
4. La barre contextuelle du nœud propose aussi `⧉` pour dupliquer le nœud et `×` pour le supprimer.

### Sélectionner des nœuds et des relations

1. Cliquez sur un nœud pour le sélectionner ; un contour bleu apparaît autour du nœud.
2. Cliquez sur une relation pour la sélectionner ; l'inspecteur contextuel à droite affiche ses propriétés.
3. Cliquez sur une zone vide du canevas pour effacer la sélection actuelle.
4. Maintenez `Ctrl` en cliquant sur les nœuds pour sélectionner plusieurs éléments ou désélectionner un nœud.
5. Faites glisser sur une zone vide du canevas pour sélectionner plusieurs nœuds par rectangle.

### Créer des relations

1. Survolez le bord d'un nœud pour afficher quatre poignées de connexion : haut, bas, gauche et droite.
2. Faites glisser depuis une poignée puis relâchez sur la poignée d'un nœud cible.
3. Avant de faire glisser, choisissez le type de relation dans le menu `⇄` de la barre latérale : **Parent-enfant** ou **Conjoint**.
4. La couleur de la relation hérite de la couleur personnalisée du nœud source ; une relation sélectionnée est surlignée en bleu.
5. Cliquez sur une zone vide du canevas pour annuler une relation en cours.

### Inspecteur de propriétés

Lorsqu'un nœud est sélectionné, l'inspecteur contextuel à droite permet de modifier les propriétés suivantes :

| Champ | Description |
| --- | --- |
| Avatar | Image intégrée à gauche ; prend en charge une URL (http/https/data URI) ou l'import d'une image locale |
| Titre | Première ligne du nœud, affichée en gras |
| Sous-titre 1 | Deuxième ligne |
| Sous-titre 2 | Troisième ligne |
| Identité | Texte d'identité |
| Temps | Texte temporel |
| Informations supplémentaires | Texte optionnel |
| Badge | Texte optionnel du badge circulaire en haut à droite |
| Couleur du nœud | Couleur de fond personnalisée |
| Position | Coordonnées X / Y du nœud dans le monde du canevas |

Lorsqu'une relation est sélectionnée, vous pouvez modifier son type (Parent-enfant / Conjoint) ou la supprimer.

### Tailles des nœuds

- Les nœuds sans avatar sont fixés à `180 × 100`.
- Les nœuds avec avatar sont fixés à `270 × 120`.
- L'ajout, l'import ou la modification d'un avatar normalise toujours le nœud vers l'une de ces deux tailles.

### Enregistrement et export

| Fonction | Description |
| --- | --- |
| Enregistrement automatique | Enregistre automatiquement dans le stockage local du navigateur (localStorage) pendant l'édition |
| Export JSON | Exporte le projet actuel en fichier `.json`, avec nœuds, relations, état de la vue et limites du canevas |
| Import JSON | Restaure un projet complet depuis un fichier `.json` |
| Export PNG | Exporte le canevas complet en image PNG |
| Export SVG | Exporte le canevas complet en image vectorielle SVG |
| Export WebP | Exporte le canevas complet au format WebP |

L'export d'image utilise un objet hors écran. `html-to-image` ne capture pas et ne réécrit pas temporairement le canevas interactif réel ; l'export ne doit donc pas provoquer de saut visuel.

### Mini-carte

- La mini-carte en bas à droite affiche une miniature globale du canevas.
- Le rectangle bleu indique la zone actuellement visible.
- Faites glisser le rectangle bleu pour naviguer rapidement vers une autre position.
- Cliquez sur le bouton `-` / `+` pour réduire ou développer la mini-carte.

### Panneau de zoom

- Cliquez sur le pourcentage dans la barre d'outils pour ouvrir le panneau de zoom.
- Ajustez le zoom avec les boutons `-` / `+`, le curseur ou la saisie directe du pourcentage (10% ~ 1000%).

### Redimensionnement du canevas

- Cliquez sur **Canevas** dans la barre d'outils supérieure pour ouvrir le panneau de redimensionnement.
- Étendez ou réduisez les limites du canevas vers le haut, le bas, la gauche ou la droite.
- Configurez la taille du pas pour chaque ajustement.

### Alignement magnétique

- Les nœuds peuvent s'accrocher aux intersections de la grille pendant le déplacement.
- Ils peuvent aussi s'aligner sur les bords ou les centres des nœuds voisins, avec des guides orange.
- Activez ou désactivez cette fonction dans les paramètres.

### Mode développeur

- Le mode développeur est contrôlé dans la fenêtre des paramètres et activé par défaut.
- Lorsqu'il est activé, le menu **Vue** affiche **Voir le canevas cloné** et **CPP Status**.
- Lorsqu'il est activé, l'inspecteur contextuel affiche les ID des blocs, des relations, les ID source/cible et les ID des relations connectées.
- **CPP Status** affiche les sorties des nœuds, relations et diagnostics du C++ GraphCore.
- **Voir le canevas cloné** affiche une miniature du canevas cloné en arrière-plan.

### Disposition de l'éditeur

- La barre d'outils supérieure regroupe les commandes dans **Fichier**, **Édition**, **Vue**, **Canevas**, Paramètres et Aide.
- La barre latérale compacte fournit les actions rapides : ajouter un nœud, ajouter un enfant, choisir un type de relation et ouvrir les statistiques.
- La barre contextuelle du nœud apparaît lorsqu'un seul nœud est sélectionné et propose ajouter enfant, ajouter conjoint, dupliquer et supprimer.
- L'inspecteur à droite apparaît seulement après la sélection d'un nœud ou d'une relation ; sa largeur peut être redimensionnée et est enregistrée automatiquement.

### Titre du projet

- Double-cliquez sur le titre au centre de la barre d'outils pour renommer le projet.
- Appuyez sur Entrée pour confirmer, Escape pour annuler.
- Le titre apparaît dans les noms des fichiers exportés.

## Types de nœuds

| Type | Description |
| --- | --- |
| **Nœud personne** | Nœud rectangulaire visible contenant titre, sous-titres, identité, temps, etc. ; prend en charge avatar, badge et couleur personnalisée |

## Conseils

- Toutes les relations utilisent des chemins orthogonaux à angle droit, avec une couleur héritée du nœud source.
- Cliquez sur une zone vide du canevas pour effacer rapidement la sélection.
- Maintenez `Ctrl` pour sélectionner plusieurs nœuds individuellement ; faites glisser sur une zone vide pour sélectionner par rectangle.
- Plage de zoom du canevas : 10% ~ 1000%, via molette, pavé tactile ou raccourcis `Ctrl+=` / `Ctrl+-`.
- Les menus supérieurs proposent import/export, annuler/rétablir, supprimer, dupliquer, adapter la vue, grille, thème et outils développeur.
- Tous les paramètres prennent effet immédiatement et sont enregistrés automatiquement.
