process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Cheerio = require('cheerio')
const Telegraf = require('telegraf')
const Fetch = require('node-fetch')
const Url = require('url-parse');
const setCookie = require('set-cookie-parser');
var fs = require('fs');

const bot = new Telegraf('1360194566:AAFKJFtYWBioafyWUIqzeRa9Ds3NptnIF74')

const mikeId = 37446
const levels = [1, 2, 3, 4, 5]
const cookieParse = (result, skip) => {
    const cookies = result.headers.get('set-cookie')

    const splitCookieHeaders = setCookie.splitCookiesString(cookies)
    const toSave = setCookie.parse(splitCookieHeaders)

    const filtered = toSave.filter(t => t.name !== skip)

    return filtered.map(c => `${c.name}=${c.value}`)
        .join('; ')
}

const getLoginUrl = async() => {

    const land = await Fetch("https://grow.telescopeai.com/landing/you/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "ru-RU,ru;q=0.9,en-XA;q=0.8,en;q=0.7,en-US;q=0.6",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
        },
        "referrer": "https://grow.telescopeai.com",
        "referrerPolicy": "origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        redirect: 'manual'
    });

    const pdp = await Fetch("https://grow.telescopeai.com/pdp/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "ru-RU,ru;q=0.9,en-XA;q=0.8,en;q=0.7,en-US;q=0.6",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
        },
        "referrer": "https://grow.telescopeai.com/landing/you",
        "referrerPolicy": "origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        redirect: 'manual'
    });

    const csrf = cookieParse(land, 'Auth.Count').replace('CSRF-TOKEN=', '')
    const cookiesLand = cookieParse(land, 'Auth.Count')
    const cookiesPDP = cookieParse(pdp, 'Auth.Count')

    console.log(cookiesLand, cookiesPDP)

    const result = await Fetch(pdp.headers.get('location'), {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "ru-RU,ru;q=0.9,en-XA;q=0.8,en;q=0.7,en-US;q=0.6",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
        },
        "referrerPolicy": "no-referrer",
        "method": "GET",
        "mode": "cors"
    })

    const page = Cheerio.load(await result.text())

    const form = page('#kc-form-login')

    const cookie = cookieParse(result)

    return {
        csrf,
        url: form.hasOwnProperty('0') ? form['0'].attribs.action : false,
        cookie: cookie,
        cookiesLand,
        cookiesPDP
    }
}

const loginProcess = async (loginUrl) => {
    const result = await Fetch(loginUrl.url, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "ru-RU,ru;q=0.9,en-XA;q=0.8,en;q=0.7,en-US;q=0.6",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": ['BACK_IDX=1', loginUrl.cookie].join('; ')
        },
        "rejectUnauthorized": false,
        "referrerPolicy": "no-referrer",
        "body": "username=mihail.hegai%40gmail.com&password=E5ecurepam&login=Sign+In",
        "method": "POST",
        "mode": "cors",
        redirect: 'manual'
    });

    const cloak = await Fetch(result.headers.get('location'), {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "ru-RU,ru;q=0.9,en-XA;q=0.8,en;q=0.7,en-US;q=0.6",
            "cache-control": "max-age=0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "cross-site",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": [loginUrl.cookiesLand, loginUrl.cookiesPDP].join('; ')
        },
        "referrerPolicy": "no-referrer",
        "body": null,
        "method": "GET",
        "mode": "cors",
        redirect: 'manual'
    });

    return [loginUrl.cookiesLand, cookieParse(cloak, '.AspNet.Correlation.Keycloak')].join('; ')
}

const createDir = async (dir) =>
{
    if(!fs.existsSync(dir))
    {
        fs.mkdirSync(dir)                
    }else{
        console.log("Directory Exists : " + dir);
    }
}

const processSkills =  async (processCookies, loginUrl, competency, competencyId, level, skillId, dir) =>{
    
    try{
        console.log("ProcessSkills: skillId="+ skillId);
        const result = await Fetch("https://grow.telescopeai.com/api/SkillContentReader/Query", {
                "headers": {
                    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-csrf-token": loginUrl.csrf,
                    "x-requested-with": "XMLHttpRequest",
                    "origin": "https://grow.telescopeai.com",
                    "cookie": processCookies,
                },
                "referrer": `https://grow.telescopeai.com/skillMatrices/${mikeId}?competency=${competency}&level=${level}&skill=${skillId}`,
                "referrerPolicy": "origin-when-cross-origin",
                "body": `{\"skillId\":${skillId},\"competencyId\":${competencyId},\"userId\":${mikeId},\"isPreview\":false,\"jobFunctionLevel\":${level}`,
                "method": "POST",
                "mode": "cors"
            }).then(t => t.json());

            console.log("Process skills result: " + result);
            var dirName = dir + " /" +`${skillId}.json`;

            if (fs.existsSync(dirName) == false) {
                console.log("Saving file to dir: " + dirName)
                fs.writeFileSync(dirName, result);
            }
    } catch (e) {
        console.error(e)
    }
}

const processSkillsByLevels = async (processCookies, loginUrl, competency, competencyId, nextDir, skillType, level) =>
{   

    try{
        const result = await Fetch("https://grow.telescopeai.com/api/SkillsMatrixReader/Query", {
            "headers": {
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-csrf-token": loginUrl.csrf,
                "x-requested-with": "XMLHttpRequest",
                "origin": "https://grow.telescopeai.com",
                "cookie": processCookies,
            },
            "referrer": `https://grow.telescopeai.com/skillMatrices/${mikeId}?competency=${competency}&level=${level}`,
            "referrerPolicy": "origin-when-cross-origin",
            "body": `{\"userProfileId\":${mikeId},\"jobFunctionBaseId\":null,\"jobFunctionLevel\":${level},\"competencyId\":${competencyId}`,
            "method": "POST",
            "mode": "cors"
        }).then(t => t.json());

        if(skillType === "Soft skills")
        {              
            const softSkillId = result.skills.find(({name}) => name === skillType).id;
            for(const skill in result.skills)
            {
                if(skill.rootId == softSkillId)
                {
                    console.log("In Soft skills root!")
                    await processSkills(processCookies, loginUrl, competency, competencyId, level, skill.id, nextDir);
                }
            }

        }
        else if (skillType === "Hard skills")
        {
            let hardSkillId = result.skills.find(({name}) => name === skillType).id;
            for (const skill in result.skills)
            {
                if(skill.rootId == hardSkillId)
                    await processSkills(processCookies, loginUrl, competency, competencyId, level, skill.id, nextDir)
            }
        }
        else{
            console.log("not hard and not soft skill");
        }
    }catch(e){
        console.error("Maint error" + e);
    }
    
}

const getAllSkillsByLevels = async (processCookies, loginUrl, competency, competencyId, dir, skillType) =>{
  
    levels.forEach(level => {
        let nextDir = dir + "/" + "L" + level; //not sure if works recusively
        createDir(nextDir);
        try{            
            processSkillsByLevels(processCookies, loginUrl, competency, competencyId, nextDir, skillType, level);            
        } catch (e) {
            console.error(e)
        }
    });  
    
}

const getCategoryByID = async (loginUrl, processCookies, id, rootDirName) => {
    console.log("in get category")
    const json = await Fetch("https://grow.telescopeai.com/api/PdpController/Load", {
        "headers": {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-csrf-token": loginUrl.csrf,
            "x-requested-with": "XMLHttpRequest",
            "origin": "https://grow.telescopeai.com",
            "cookie": processCookies,
        },
        "referrer": `https://grow.telescopeai.com/skillMatrices/${id}`,
        "referrerPolicy": "origin-when-cross-origin",
        "body": `\"${id}\"`,
        "method": "POST",
        "mode": "cors"
    }).then(t => t.json());

    
    let competents = json.headerVM.positions.competencies;
    competents.forEach(element => {
        if(element.parentId != null)
        {
            //create a folder with the name of element, pass Id and folder name
            let nextDir =  rootDirName + "/" + element.name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '_');
            console.log(nextDir)
            createDir(nextDir);
            //generate hard and soft skills folders
            let softDirName = nextDir + "/SoftSkills"; 
            createDir(softDirName);     
            getAllSkillsByLevels(processCookies, loginUrl, element.code, element.id, softDirName, "Soft skills");

            let hardDirName = nextDir + "/HardSkills";   
            createDir(hardDirName);    
            getAllSkillsByLevels(processCookies, loginUrl, element.code, element.id, hardDirName, "Hard skills");
        }
    });
            
}


const getData = async (rootDirName) => {
    try {
        const loginUrl = await getLoginUrl()
        const processCookies = await loginProcess(loginUrl)
        console.log("Get Data");
        
        //await processSkills(processCookies, loginUrl, competency, competencyId, level, skill.id, nextDir)
        await getCategoryByID(loginUrl, processCookies, mikeId, rootDirName);     

              
    } catch (e) {
        console.error(e)
    }
}
   
const http = require('http');

// Create server 
let app = http.createServer(async function (req, res) { 
  
    res.writeHead(200, {'Content-Type': 'text/html'}); 
      
    try {
        try {            
            let rootDirName = "./Matrix";
            createDir(rootDirName); 
          
            await getData(rootDirName);            
            console.log( `Закончил епта!`);
        } catch (e) {
            console.log(e, `Не получилось забрать страницу`)
        }
    } catch (e) {
        console.log(e)
    }
    // Send the response body as "Hello World!"   
    res.end('Hello World!'); 
  
});

app.listen(3000, '127.0.0.1');
console.log('Node server running on port 3000');
   