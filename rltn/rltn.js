// design fix 13.03.20
// Подключенные штучки
const protectid = require(`./system/protection.json`);
const cfg       = require(`./system/cfg.json`);
const Discord   = require("discord.js"); // обьявление клиента
const RichEmbed = require('discord.js');
const color     = require('colors');
const fs        = require("fs");

const bot       = new Discord.Client();
bot.commands    = new Discord.Collection();

let exceptions = require('./system/exceptions.json');
// ввод в консоль
var readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Точка входа:

function showMenu() {
  var status = "";
  switch(cfg.status){
    case "online":
      status = "●".green.bold;
    break;
    case "dnd":
      status = "●".red.bold;
    break;
    case "idle":
      status = "●".yellow.bold;
    break;
    case "invisible":
      status = "●".bold;
    break;

    default:
      status = "● пашол ты"
  }

  console.clear();
  console.log(`[RLTN]`.red.bold+` | ${bot.user.tag} ${status}`);
  console.log("1|".bold+" Выключить/Включить аддоны");
  console.log("2|".bold+" Открыть настройки")
  console.log("3|".bold+" О проекте")
  ask("=>").then(answer=>{
    switch (+answer) {
      case 1:
        openAddonsList();
      break;

      case 2:

      break;

      default:
        return showMenu();
    }
  })
}

function openAddonsList() {
  console.clear();
  fs.readdir("./addons",(err,files)=>{

    let jsfiles = files.filter(f=> f.split(".").pop()==="js");

    for (var i = 0; i < jsfiles.length; i++) {
      if(exceptions[jsfiles[i]]){
        console.log(`[Не активен]`.red.bold,`${i}| ${jsfiles[i]}`);
      }else{
        console.log(`[Активен]`.green.bold,`${i}| ${jsfiles[i]}`);
      }
    }

    console.log("——————————————");
    console.log("Введите через пробел номера для переключения");
    console.log("!enable для включения всех");
    console.log("!disable для выключения всех");
    ask("=>").then((e)=>{
      if(e == "!enable"){
        for (var i = 0; i < jsfiles.length; i++) {
          delete exceptions[jsfiles[i]]
        }
        save();
      }

      if(e == "!disable"){
        for (var i = 0; i < jsfiles.length; i++) {
          exceptions[jsfiles[i]] = [];
        }
        save();
      }

      e = e.split(" ");

      for (var i = 0; i < e.length; i++) {
        if(exceptions[jsfiles[+e[i]]]){
          delete exceptions[jsfiles[+e[i]]]
        }else{
          exceptions[jsfiles[+e[i]]] = [];
        }
      }
      save();
      showMenu();

    });
  })
}

function loadModules() {
  return new Promise((resolve,reject)=>{
    bot.commands.clear();
    fs.readdir("./addons",(err,files)=>{

      let jsfiles = files.filter(f=> f.split(".").pop()==="js");

      for (var i = 0; i < jsfiles.length; i++) {
        if(exceptions[jsfiles[i]]) continue;

        findModule(jsfiles[i]).then((prop)=>{
          bot.commands.set(prop.help.name, prop);
        });
      }
    })

    resolve(true);
  })
}

async function findModule(module) {
  // fs
  return new Promise((refuse,reject)=>{
    fs.readdir("./addons", (err, files) => {
      if(err) console.log(err);

      let jsfile = files.filter(f => f===module)

      const prop = require('./addons/' +jsfile[0]);
      refuse(prop);
    });
  });
}

function ask(ask) {
  return new Promise((refuse,reject)=>{
    readline.question(ask,(action)=>{
      refuse(action);
    })
  })
}

function save(){
  fs.writeFile('./system/exceptions.json', JSON.stringify(exceptions), (err)=>{if(err) console.log(err);});
}

bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;
  let prefix = cfg.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

if(message.guild.id === '453549842355191810') {
console.log(`[Revolution]`.yellow.bold,`Вы используете скрипт на сервере "${message.guild.name}". Некоторые команды недоступны`)
}

let commandfile = bot.commands.get(cmd.slice(prefix.length));
if(commandfile) commandfile.run(bot,message,args);
});

console.clear();
console.log(`[RLTN]`.red.bold+' Loading...');
bot.login(cfg.token).then(()=>{
  bot.user.setPresence({ status: cfg.status })
  console.log("[RLTN]".red.bold," Loading modules")
  loadModules().then(()=>{
    showMenu();
  })
}).catch((e)=>{
  console.clear();
  console.log(`[Revolution]`.red.bold+' | Вход не удался');
  bot.destroy();
});
