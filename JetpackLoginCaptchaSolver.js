const puppeteer = require('puppeteer');
const tough = require('tough-cookie');
const { CookieJar } = tough;

/**
 * Fonction utilitaire pour retarder l'exécution.
 * @param {number} delay - Délai en millisecondes.
 * @returns {Promise} - Une promesse qui se résout après le délai spécifié.
 */
function sleep(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Classe pour gérer l'extraction du CAPTCHA et la soumission du formulaire pour la connexion.
 */
module.exports = class JetpackLoginCaptchaSolver {
    /**
     * @param {string} domain - Le domaine avec lequel interagir.
     * @param {string} loginEndpoint - Le chemin URL de l'endpoint de connexion.
     * @param {string} adminEndpoint - Le chemin URL de l'endpoint admin.
     * @param {object} login - Un objet contenant `id` et `pwd` pour les identifiants de connexion.
     */
    constructor(domain, loginEndpoint, adminEndpoint, login) {
        this.domain = domain;
        this.loginEndpoint = loginEndpoint || 'wp-login.php';
        this.adminEndpoint = adminEndpoint || 'wp-admin';
        this.login = login;
        this.cookieJar = new CookieJar();
    }

    /**
     * Calcule le résultat d'une expression mathématique.
     * @param {string} expression - L'expression mathématique à évaluer.
     * @returns {number} - Le résultat de l'évaluation.
     * @throws Will throw an error if the expression cannot be evaluated.
     */
    calculate(expression) {
        try {
            return new Function('return ' + expression)(); // Alternative sécurisée à eval
        } catch (e) {
            throw new Error(`\x1b[31mErreur lors de l'évaluation de l'expression : ${e.message}\x1b[0m`);
        }
    }

    /**
     * Extrait la solution du CAPTCHA et soumet le formulaire.
     * @returns {string} - Une promesse qui se résout avec le bon mot de passe si le formulaire est soumis avec succès.
     */
    async submit() {
        const browser = await puppeteer.launch({ headless: false }); // ou false si vous souhaitez voir le navigateur
        const page = await browser.newPage();
        
        try {
            console.log(`Tentative pour le mot de passe : ${this.login.pwd}`);
            await sleep(1000);

            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

            await page.setUserAgent(userAgent);
            await page.setCookie(...this.cookieJar.getCookiesSync(`https://${this.domain}`)); // Définir les cookies si présents

            await page.goto(`https://${this.domain}/${this.loginEndpoint}?redirect_to=https%3A%2F%2F${this.domain}%2F${this.adminEndpoint}%2F&reauth=1`, {
                waitUntil: 'networkidle2'
            });

            const captchaFieldsExist = await page.evaluate(() => {
                return !!document.querySelector('label[for="jetpack_protect_answer"]');
            });

            const form = {
                log: this.login.id,
                pwd: this.login.pwd,
                'wp-submit': 'Se connecter',
                redirect_to: `https://${this.domain}/wp-admin/`,
                testcookie: '1'
            };

            if (captchaFieldsExist) {
                const calcLabel = await page.evaluate(() => {
                    return document.querySelector('label[for="jetpack_protect_answer"]').textContent.trim();
                });

                const cleanedCalc = calcLabel.replace(/\s*=\s*/, '');
                console.log(`Tentative de calcul : ${cleanedCalc}`);
                await sleep(1000);

                const result = this.calculate(cleanedCalc);
                console.log(`Résultat : ${result}`);

                const jpProtectAnswer = await page.evaluate((result) => {
                    document.querySelector('input[name="jetpack_protect_num"]').value = result;
                }, result);

                form.jetpack_protect_num = result;
                form.jetpack_protect_answer = jpProtectAnswer;
                form.jetpack_protect_process_math_form = 1;
            } else {
                console.log('Les champs du CAPTCHA Jetpack n\'ont pas été trouvés, procession en cours sans captcha.');
            }

            await page.evaluate((form) => {
                document.querySelector('input[name="log"]').value = form.log;
                document.querySelector('input[name="pwd"]').value = form.pwd;
                document.querySelector('input[name="wp-submit"]').click();
            }, form);

            await page.waitForNavigation({ waitUntil: 'networkidle2' });

            const pageContent = await page.content();

            if (pageContent.includes('login_error')) {
                throw new Error('\x1b[31mÉchec de la connexion en raison d\'un élément d\'erreur trouvé après la soumission.\x1b[0m');
            }

            /*
            // Pour naviguer vers la page admin
            await page.goto(`https://${this.domain}/${this.adminEndpoint}`, { waitUntil: 'networkidle2' });
            const adminPageContent = await page.content();
            */

            await browser.close();

            console.log('Connexion réussie.');
            return this.login.pwd;
        } catch (error) {
            await browser.close();
            throw new Error(`\x1b[31mErreur lors de la soumission du formulaire\x1b[0m\n${error}`);
        }
    }
};
