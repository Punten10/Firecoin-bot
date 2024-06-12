import axios from 'axios';
import readline from 'readline-sync';
import moment from 'moment-timezone';
import fs from 'fs';
import chalk from 'chalk';

const now = moment().tz("Asia/Singapore").format("HH:mm:ss");

const header = chalk.bgBlue.white.bold;
const boxTop = chalk.white('┌──────────────────────────┐');
const boxBottom = chalk.white('└──────────────────────────┘');
const boxSide = chalk.white('│');
const boxContent = chalk.white(' By ZUIRE AKA SurrealFlux ');

const asciiArt = chalk.white(`
███████╗██╗██████╗░███████╗░█████╗░░█████╗░██╗███╗░░██╗  ██████╗░░█████╗░████████╗
██╔════╝██║██╔══██╗██╔════╝██╔══██╗██╔══██╗██║████╗░██║  ██╔══██╗██╔══██╗╚══██╔══╝
█████╗░░██║██████╔╝█████╗░░██║░░╚═╝██║░░██║██║██╔██╗██║  ██████╦╝██║░░██║░░░██║░░░
██╔══╝░░██║██╔══██╗██╔══╝░░██║░░██╗██║░░██║██║██║╚████║  ██╔══██╗██║░░██║░░░██║░░░
██║░░░░░██║██║░░██║███████╗╚█████╔╝╚█████╔╝██║██║░╚███║  ██████╦╝╚█████╔╝░░░██║░░░
╚═╝░░░░░╚═╝╚═╝░░╚═╝╚══════╝░╚════╝░░╚════╝░╚═╝╚═╝░░╚══╝  ╚═════╝░░╚════╝░░░░╚═╝░░░
`);

console.log(asciiArt);
console.log(boxTop);
console.log(boxSide + boxContent + boxSide);
console.log(boxBottom);

function loadSession() {
  try {
    const sessionData = fs.readFileSync('session.json');
    return JSON.parse(sessionData);
  } catch (error) {
    saveSession({ sessions: {} });
    return { sessions: {} };
  }
}

function saveSession(session) {
  try {
    fs.writeFileSync('session.json', JSON.stringify(session, null, 2));
  } catch (error) {
    // Error handling, tidak ditampilkan
  }
}

function getNewSessionInput() {
  const name = readline.question(`[ ${header(now)} ] Nama Session: `);
  const token = readline.question(`[ ${header(now)} ] Token: `);
  const baggage = readline.question(`[ ${header(now)} ] Baggage: `);
  const sentryTrace = readline.question(`[ ${header(now)} ] Sentry-Trace: `);
  const tapLevel = readline.questionInt(`[ ${header(now)} ] Tap Level: `);
  const sleepTime = readline.questionInt(`[ ${header(now)} ] Sleep Time (ms): `);

  return { name, token, tapLevel, baggage, sentryTrace, sleepTime };
}

async function loadState(token, tapLevel, baggage, sentryTrace) {
  let attempts = 0;
  while (attempts < 5) {
    try {
      const response = await axios.post(
        'https://app2.firecoin.app/api/loadState',
        {},
        {
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Authorization': token,
            'Baggage': baggage,
            'Content-Type': 'text/plain;charset=UTF-8',
            'Origin': 'https://app2.firecoin.app',
            'Priority': 'u=1, i',
            'Referer': 'https://app2.firecoin.app',
            'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sentry-Trace': sentryTrace,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
          }
        }
      );

      const data = response.data;
      return {
        clicks: data.clicks + tapLevel,
        max_value: data.wood.max_value,
        user_id: data.user_id
      };
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Tunggu 2 detik sebelum mencoba lagi
    }
  }
  return null;
}

async function sendClick(clicks, token, tapLevel, baggage, sentryTrace) {
  let attempts = 0;
  while (attempts < 5) {
    try {
      const totalClicks = clicks + tapLevel;
      const response = await axios.post(
        'https://app2.firecoin.app/api/click',
        { clicks: totalClicks },
        {
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Authorization': token,
            'Baggage': baggage,
            'Content-Type': 'text/plain;charset=UTF-8',
            'Origin': 'https://app2.firecoin.app',
            'Priority': 'u=1, i',
            'Referer': 'https://app2.firecoin.app/',
            'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sentry-Trace': sentryTrace,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
          }
        }
      );

      if (response.data.error && response.data.error === 'Too fast') {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Tunggu 10 detik jika rate limit terlampaui
        attempts++;
        continue;
      }

      return response.data;
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Tunggu 2 detik sebelum mencoba lagi
    }
  }
  return null;
}

async function runSession(session) {
  const { token, tapLevel, baggage, sentryTrace, sleepTime } = session;

  const state = await loadState(token, tapLevel, baggage, sentryTrace);
  if (!state) return;

  let { clicks, max_value, user_id } = state;

  while (true) {
    const responseData = await sendClick(clicks, token, tapLevel, baggage, sentryTrace);
    if (!responseData) return;

    const { nextUser } = responseData;
    console.log(`[ ${chalk.green('Session')} ${session.name} ] [ ${chalk.green('SUKSES')} ] Next User: | ID: ${nextUser.id} | Nama: ${nextUser.name} [ Kliks: ${nextUser.clicks} ]`);

    clicks += tapLevel;
    const delay = max_value === 0 ? 60000 : sleepTime;
    await new Promise(resolve => setTimeout(resolve, delay));

    const newState = await loadState(token, tapLevel, baggage, sentryTrace);
    if (newState) {
      ({ clicks, max_value, user_id } = newState);
    }
  }
}

(async () => {
  let session = loadSession();
  let shouldExit = false;

  while (!shouldExit) {
    console.log(chalk.whiteBright("Apakah ingin menggunakan session yang ada, menambah session baru, menghapus session, atau keluar?"));
    const options = [
      chalk.whiteBright("Tambah session baru"), 
      chalk.whiteBright("Tambah beberapa session baru"), 
      chalk.whiteBright("Gunakan 1 session"), 
      chalk.whiteBright("Gunakan Banyak session"), 
      chalk.redBright("Hapus session"), 
      chalk.redBright("Keluar")
    ];
    const choiceIndex = readline.keyInSelect(options, chalk.yellow("Pilih opsi:"), { cancel: false });

    switch (choiceIndex) {
      case 0:
        const newSession = getNewSessionInput();
        session.sessions[newSession.name] = newSession;
        saveSession(session);
        console.log(chalk.green("Session baru berhasil ditambahkan."));
        break;

      case 1:
        const numberOfSessions = readline.questionInt(`[ ${header(now)} ] Berapa sesi yang ingin ditambahkan?: `);
        for (let i = 0; i < numberOfSessions; i++) {
          console.log(chalk.yellow(`Input untuk sesi ${i + 1}`));
          const multiSession = getNewSessionInput();
          session.sessions[multiSession.name] = multiSession;
        }
        saveSession(session);
        console.log(chalk.green("Sesi-sesi baru berhasil ditambahkan."));
        break;

      case 2:
        const sessionNames = Object.keys(session.sessions);
        if (sessionNames.length === 0) {
          console.log(chalk.red("Tidak ada session yang tersedia."));
          break;
        }
        const sessionIndex = readline.keyInSelect(sessionNames, chalk.yellow("Pilih session yang akan digunakan:"), { cancel: false });
        if (sessionIndex !== -1) {
          const selectedSession = session.sessions[sessionNames[sessionIndex]];
          await runSession(selectedSession);
        }
        break;

      case 3:
        const allSessions = Object.values(session.sessions);
        if (allSessions.length === 0) {
          console.log(chalk.red("Tidak ada session yang tersedia."));
          break;
        }
        await Promise.all(allSessions.map(session => runSession(session).catch(error => { /* Error handling, tidak ditampilkan */ })));
        break;

      case 4:
        const sessionNamesToDelete = Object.keys(session.sessions);
        if (sessionNamesToDelete.length === 0) {
          console.log(chalk.red("Tidak ada session yang tersedia."));
          break;
        }
        const deleteSessionIndex = readline.keyInSelect([...sessionNamesToDelete], chalk.yellow("Pilih session yang akan dihapus:"));
        if (deleteSessionIndex !== -1) {
          const selectedSessionName = sessionNamesToDelete[deleteSessionIndex];
          delete session.sessions[selectedSessionName];
          saveSession(session);
          console.log(chalk.green(`Session '${selectedSessionName}' telah dihapus.`));
        }
        break;

      case 5:
        shouldExit = true;
        break;

      default:
        console.log(chalk.red("Pilihan tidak valid."));
        break;
    }
  }
})();
