// /*
//  * @Author: Eduardo Policarpo
//  * @contact: +55 43996611437
//  * @Date: 2021-05-10 18:09:49
//  * @LastEditTime: 2022-08-21 21:36
//  * Ajustes do logger por Thiago28x
//  */
const Sessions = require('../controllers/sessions')
const config = require('../config');
const Cache = require('../util/cache');
const fs = require("fs");
let motivo = "motivo: "


function dataAgora() {
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  return dateTime
}




async function loggerRequests(motivo) {
  console.info(`\n${dataAgora()} Request deu erro: \n ${motivo}\n`)
  fs.appendFile('log-requests.csv', motivo + "\n,", function (err, teste) {}); //fecha a função que escreve arquivo
}


async function checkNumber(req, res, next) {
  const c = '@c.us';
  let number = req?.body?.number;
  let session = req?.body?.session;
  let data = Sessions?.getSession(session);
  let onlyNumbers = /^\d+\-\d+$/.test(number);

  if (config?.engine === '1') {
    if (!number) {
      return res?.status(401)?.send({ message: "Telefone não informado?." });
    }
    else if ((number.length < 10 )) {
      return res?.status(401)?.send({ message: "O número de celular recebido é curto demais. Verifique os parâmetros de envio" });
    }
    else if ((number.length === 23 || number.length === 24) && (number.includes('-')) && (onlyNumbers === false)) {
      return res?.status(401)?.send({ message: "Numero invalido." });
    }
    else if ((number.length === 23 || number.length === 24) && (number.includes('-')) && (onlyNumbers === true)) {
      await Cache.set(number, number + '@g.us')
      next();
    }
    else if (isNaN(number)) {
      return res?.status(401)?.send({ message: "Informe apenas os numeros do Telefone." });
    }
    else if (number.includes('@broadcast')) {
      await Cache.set(number, number)
      next();
    }
    else if (!number?.includes('-') && (number.length == 18)) {
      await Cache.set(number, number + '@g.us')
      next();
    }
    else if (!number?.includes('-')) {
      const value = await Cache?.get(number);
      if (value) {
        next()
      } else {
        let profile = number?.indexOf('-') > -1 ? number + '@g.us' : await data?.client?.getNumberId(req?.body?.number);
        if (!profile) {
          return res?.status(400)?.json({
            response: false,
            status: "error",
            message: 'O telefone informado nao esta registrado no whatsapp?.'
          });
        } else {
          await Cache.set(number, profile.id._serialized);
          next();
        }
      }
    }
  }
  else {
    if (!number) {
      return res?.status(401)?.send({ message: "Telefone não informado?." });
    }
    else if ((number.length === 23 || number.length === 24) && (number.includes('-')) && (onlyNumbers === false)) {
      motivo = `Sessão: ${session}. Motivo: Recebeu 23 ou 24 caractéres no número. ,`;
      await loggerRequests(motivo)
      return res?.status(401)?.send({ message: motivo });
    }
    else if ((number.length < 10 )) {
      motivo = `Sessão: ${session}. Motivo: Numero recebido é curto demais. ,`
      await loggerRequests(motivo)
      return res?.status(401)?.send({ message: motivo });
    }
    else if ((number.length === 23 || number.length === 24) && (number.includes('-')) && (onlyNumbers === true)) {
      await Cache.set(number, number + '@g.us')
      next();
    }
    else if (isNaN(number)) {
      return res?.status(401)?.send({ message: "Informe apenas os numeros do Telefone." });
    }
    else if (number.includes('@broadcast')) {
      await Cache.set(number, number)
      next();
    }
    else if (!number?.includes('-') && (number.length == 18)) {
      await Cache.set(number, number + '@g.us')
      next();
    }
    else if (!number?.includes('-')) {
      const value = await Cache?.get(number);
      if (value != null) {
        next()
      } else {
        let profile = number?.indexOf('-') > -1 ? number + '@g.us' : await data?.client?.checkNumberStatus(req?.body?.number + c);
        console.log(profile)
        if (!profile?.numberExists) {
          return res?.status(400)?.json({
            response: false,
            status: "error",
            message: 'O telefone informado nao esta registrado no whatsapp?.'
          });
        } else {
          await Cache.set(number, profile.id._serialized);
          next();
        }
      }
    }
  }
}

exports.checkNumber = checkNumber
