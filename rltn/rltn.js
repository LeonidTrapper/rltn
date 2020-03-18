// design fix 13.03.20
/*
* Крч зря ты сюда полез...
* Но автор Gobka#6664 && Leonid#9085
* Discord : https://discord.gg/k7PruNp
* Пж не выдавай этот проект за свой
* ReVolution (. Y. ) ALL RIGHT RESERVED
*/
const host = "http://revolution.com/"; // сайт
// Подключаем модули
const protectid = require(`./system/protection.json`);
const cfg       = require(`./system/cfg.json`);
const Discord   = require("discord.js");
const RichEmbed = require('discord.js');
const color     = require('colors');
const fs        = require("fs");
const needle    = require("needle");

// клиент
const bot       = new Discord.Client();     // ботяра
bot.commands    = new Discord.Collection(); // набор комманд

let exceptions = require('./system/exceptions.json'); // аддоны, которые работать не должны
// ввод в консоль
var readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Точка входа:

// показ меню, act = сообщение
function showMenu(act) {
  // парсим статус
  var status = cfg.status;
  status=="online"    ? status = "●".green.bold:0;
  status=="dnd"       ? status = "●".red.bold:0;
  status=="idle"      ? status = "●".yellow.bold:0;
  status=="invisible" ? status = "●".bold:0;

  console.clear();
  console.log(`[RLTN]`.red.bold+` | ${bot.user.tag} ${status}`);
  console.log("1|".bold+" Выключить/Включить аддоны");
  console.log("2|".bold+" Добавить аддон");
  console.log("3|".bold+" Открыть настройки")
  console.log("4|".bold+" О проекте")
  if(act){
    console.log("——————————————");
    console.log(act);
    console.log("——————————————");
  }
  ask("=>").then(answer=>{
    switch (+answer) {
      case 1:
        openAddonsList();
      break;

      case 2:
        openDownloadAddons();
      break;

      case 4:
        openCredits();
      break;

      default:
        return showMenu();
    }
  })
}

////////////////////////////////////////////////////////////////
//    Визуальная менюшка
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// Открыть список аддонов
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
        exceptions = {};
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
      loadModules().then(()=>{
        save();
        showMenu();
      }).catch((e)=>{
        showMenu(`Не удалось загрузить аддоны:${e}`);
      });
    });
  })
}

////////////////////////////////////////////////////////////////
// Скачивание аддонов
function openDownloadAddons(){
  console.clear();
  console.log("Введите ключ");
  ask("=>").then((e)=>{
    console.log("Скачиваю...");
    e = `${host}raw.php?id=${e};`
    needle.get(e,(err,res)=>{

      if(err) return showMenu("Ошибка ключа!");
      var body = res.body;

      if(!body) return showMenu("Ошибка ключа!");
      var script;
      try {
        script = JSON.parse(body)
      } catch (e) {
        return showMenu("Ошибка синтаксиса скрипта!");
      }

      fs.writeFile(`./addons/${script.name}.js`,script.body,(err)=>{if(err) console.log(err);});

      return showMenu();
    });
  })
}

function openCredits(){
  console.clear();
  	console.log(`|`.green.bold,`Revolution Full Rewrite`);
  	console.log(`--------------------------`.rainbow);
  	console.log(`|`.red,`Разработчики:`);
  	console.log(` API Dev:`.yellow,`Goblka#6664`);
  	console.log(` Addons Dev:`.yellow,`Leonid#9085`);
  	console.log(`|`.magenta,`Website:`);
  	console.log(` http://revolution.rf.gd/`.cyan.italic)
  	ask("=>").then((e) => {
  		showMenu();
  	})
}
////////////////////////////////////////////////////////////////
//    ФУНКЦИИ
////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////
// прогрузить все модули
function loadModules() {
  return new Promise((resolve,reject)=>{
    bot.commands.clear();

    fs.readdir("./addons",(err,files)=>{

      let jsfiles = files.filter(f=> f.split(".").pop()==="js");

      async function check(){ // функция чикирования
        var errors =""; // переменная ошибок

        for (var i = 0; i < jsfiles.length; i++) { // цикл
          if(exceptions[jsfiles[i]]) continue; // если аддон исключен

          await findModule(jsfiles[i]).then((prop)=>{ // находим этот модуль
            bot.commands.set(prop.help.name, prop); // добавляем его
          }).catch(()=>{ // ошибочка
            exceptions[jsfiles[i]] = [];  // исключаем его
            errors += `\n|${jsfiles[i]}`; // логируем это
          });
        }
        save(); // сохраняем
        if(errors!="") reject(errors); // в случае ошибок кэтчим

        resolve(true); // всё ок
      }
      check(); // это функция выше
    })
  })
}
/////////////////////////////////////////////////////////
// Найти модуль

async function findModule(module) {
  // fs
  return new Promise((refuse,reject)=>{ // возвращаем промис
    fs.readdir("./addons", (err, files) => { // читаем директорию
      if(err) console.log(err); // логируем ошибку

      let jsfile = files.filter(f => f===module) // находим нужный аддон

      let prop; // файл
      try {     // пробуем добавить
        prop = require('./addons/' +jsfile[0]);
      } catch (e) {
        // режектим ошибочку
        reject(false);
      }
      // ошибок нет
      refuse(prop);
    });
  });
}
/////////////////////////////////////////////////////////
// Вопрос в консоль
function ask(ask) {
  return new Promise((refuse,reject)=>{ // обещаем обещать обещать дальше
    readline.question(ask,(action)=>{  // читаем линию
      refuse(action); // возвращаем ответ
    })
  })
}

/////////////////////////////////////////////////////////
// сохраняем так сказать
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

/////////////////////////////////////////////////////////
//  Точка входа
/////////////////////////////////////////////////////////
// иронично но точка входа внизу
// привет с++
console.clear(); // чистим консоль
console.log(`[RLTN]`.red.bold+' Loading...');
bot.login(cfg.token).then(()=>{ // логинимся
  bot.user.setPresence({ status: cfg.status }) // ставим статус
  console.log("[RLTN]".red.bold," Loading modules")
  loadModules().then(()=>{ // грузим аддоны
    showMenu(); // все гладко
  }).catch(e=>{ // все не гладко
    showMenu(`Не удалось загрузить некоторые аддоны:${e}`)
  })
}).catch((e)=>{ // вход не удался
  console.clear();
  console.log(`[Revolution]`.red.bold+' | Вход не удался');
  bot.destroy();
});
/////////////////////////////////////////////////////////
