# Jetpack Login Captcha Solver (CWE-804: Guessable CAPTCHA)

Ceci est un outil qui a pour but de prouver la vulnérabilité du captcha de Jetpack. Merci de ne pas utiliser cet outil à d'autres fins !

## Scenario

Le programme va demander le domaine, le slug de la page de connexion, et l'identifiant de l'utilisateur.

Ensuite, il va remplir le captcha à sa place et tester des combinaisons de mot de passe pour montrer qu'on peut brutaliser un site facilement.

## Utilisation

1) Installation des paquets
```
npm i
```
2) Remplir le dictionnaire de mot de passe `dictionary.txt` avec un mot de passe valide pour tester la connexion
3) Démarrage du programme
```
npm start
```


### Exemple de remplissage

- Domaine : mon-domaine.fr
- Page de connexion : wp-admin (par défaut)
- ID d'utilisateur : admin
