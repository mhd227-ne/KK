require('dotenv').config();

console.log("🚀 Bot Makima lancé avec succès !");
console.log("✅ SESSION_ID =", process.env.SESSION_ID);
console.log("✅ PREFIX =", process.env.PREFIX);
process.on('uncaughtException', (err) => {
  if (err.message.includes("Cannot read properties of null") && err.message.includes("replace")) {
    console.warn('⚠️ Ignoré : erreur replace sur message null (non bloquante)');
  } else {
    console.error('Erreur critique non catchée:', err);
    process.exit(1); // Ou garder en vie selon ta tolérance
  }
});
const { spawnSync, spawn } = require('child_process');
const { existsSync, writeFileSync, readFileSync } = require('fs');
const path = require('path');

const BOTS = [
  {
    name: 'levanter',
    repo: 'https://github.com/lyfe00011/levanter.git',
    sessionId: 'levanter_10261ae627754043a0a1022879561dd7e4',
    prefix: '.',
    mainFile: 'index.js',
    envFile: 'config.env',
    sessionKey: 'SESSION_ID',
  },
  {
    name: 'zokou',
    repo: 'https://github.com/luffy8979/Zokou-MD-english.git',
    sessionId: 'ZOKOU-MD-WHATSAPP-BOT=>2e3c2f5d11',
    prefix: '!',
    mainFile: 'index.js',
    envFile: 'set.env',
    sessionKey: 'SESSION_ID',
  }
];

function logPrefix(name, message) {
  console.log(`[${name.toUpperCase()}] ${message}`);
}

function cloneBot(bot) {
  if (existsSync(bot.name)) return;
  logPrefix(bot.name, '📥 Clonage du dépôt...');
  const result = spawnSync('git', ['clone', bot.repo, bot.name], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`❌ Échec du clonage de ${bot.name}`);
}

function writeEnv(bot) {
  const envPath = path.join(bot.name, bot.envFile);
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';

  const updateOrAdd = (key, value) => {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  };

  updateOrAdd(bot.sessionKey, bot.sessionId);
  if (bot.prefix) updateOrAdd('PREFIX', bot.prefix);

  if (bot.name === 'levanter') {
    updateOrAdd('VPS', 'true');
  }

  writeFileSync(envPath, content.trimStart());
  logPrefix(bot.name, `✅ ${bot.envFile} mis à jour`);
}

function installDependencies(bot) {
  logPrefix(bot.name, '📦 Installation des dépendances...');
  const res = spawnSync('npm', ['install', '--legacy-peer-deps'], {
    cwd: bot.name,
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
  });
  if (res.status !== 0) throw new Error(`❌ Erreur installation ${bot.name}`);
}

function startBot(bot) {
  return new Promise((resolve, reject) => {
    logPrefix(bot.name, '🚀 Lancement avec Node...');
    const child = spawn('node', ['--max-old-space-size=512', bot.mainFile], {
      cwd: bot.name,
      stdio: 'inherit'
    });

    child.on('error', (err) => {
      logPrefix(bot.name, `❌ Erreur process: ${err.message}`);
      reject(err);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        logPrefix(bot.name, `❌ Le bot ${bot.name} a crashé avec le code ${code}`);
        reject(new Error(`Bot ${bot.name} crashé avec code ${code}`));
      } else {
        logPrefix(bot.name, `ℹ️ Le bot ${bot.name} s'est terminé normalement.`);
        resolve();
      }
    });

    // On garde une référence pour éventuellement gérer les processus enfants si besoin
    bot.process = child;
  });
}

async function main() {
  try {
    for (const bot of BOTS) {
      cloneBot(bot);
      writeEnv(bot);
      installDependencies(bot);
      logPrefix('DEPLOIEMENT', `Préparation terminée pour ${bot.name.toUpperCase()}`);
    }

    // Démarrer tous les bots en parallèle
   function startZokouWithRestart(bot) {
  startBot(bot).catch(err => {
    logPrefix(bot.name, `❌ Crash détecté : ${err.message}, redémarrage dans 3 secondes...`);
    setTimeout(() => startZokouWithRestart(bot), 3000);
  });
}

BOTS.forEach(bot => {
  if(bot.name === 'ZOKOU'){
    startZokouWithRestart(bot);
  } else {
    startBot(bot)
      .then(() => logPrefix(bot.name, '⚠️ Le bot s’est terminé, ce qui est inattendu'))
      .catch(err => logPrefix(bot.name, `❌ Crash ou erreur : ${err.message}`));
  }
});

    logPrefix('DEPLOIEMENT', 'Tous les bots ont été lancés en parallèle.');

    // Garder le script vivant avec un intervalle infini
    setInterval(() => {}, 1 << 30);

    // Gestion de la fermeture propre avec CTRL+C
    process.on('SIGINT', () => {
      logPrefix('SYSTEM', 'Arrêt du script reçu (CTRL+C)...');

      BOTS.forEach(bot => {
        if (bot.process) {
          logPrefix(bot.name, 'Arrêt du processus enfant...');
          bot.process.kill('SIGINT'); // ou 'SIGTERM'
        }
      });

      setTimeout(() => {
        logPrefix('SYSTEM', 'Fin du script.');
        process.exit();
      }, 1000);
    });

  } catch (err) {
    logPrefix('DEPLOIEMENT', `❌ Erreur lors du déploiement : ${err.message}`);
  }
}

main();// Ici tu ajoutes ton vrai code bot WhatsApp...
