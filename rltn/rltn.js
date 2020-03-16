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
// ввод в консоль
var readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Точка входа:

function showMenu() {
  console.clear();
  console.log("rltn | 2.0");
  console.log("1| Выбрать аддоны");
  console.log("2| Открыть настройки")
  console.log("3| О проекте")
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
  fs.readdir("./addons",(err,files)=>{

    let jsfiles = files.filter(f=> f.split(".").pop()==="js");

    console.clear();
    for (var i = 0; i < jsfiles.length; i++) {
      console.log(`${i}|`+jsfiles[i]);
    }

    ask("=>").then(e=>{
      if(e!="all"){
        e = e.split(" ");

        for (var i = 0; i < e.length; i++) {
          findModule(jsfiles[e[i]]).then((prop)=>{
            bot.commands.set(prop.help.name, prop);
          });
          //bot.commands.set(props.help.name, props);
        }
      }else{
        for (var i = 0; i < jsfiles.length; i++) {
          findModule(jsfiles[i]).then((prop)=>{
            bot.commands.set(prop.help.name, prop);
          });

          //bot.commands.set(props.help.name, props);
        }
      }
    });
    console.log("Напишите через пробел номера модулей");
    console.log("Или all для подключение всех");

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


bot.login(cfg.token).then(()=>{
  bot.user.setStatus(cfg.status);
  showMenu();
}).catch(()=>{
  console.clear();
  console.log(`[Revolution]`.red.bold+' | Вход не удался');
  bot.destroy();
});
