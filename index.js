process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Cheerio = require('cheerio')
const Telegraf = require('telegraf')
const Fetch = require('node-fetch')
const Url = require('url-parse');
const FS = require('fs');
const Path = require('path');
const setCookie = require('set-cookie-parser');

const bot = new Telegraf('1360194566:AAFKJFtYWBioafyWUIqzeRa9Ds3NptnIF74')

const path = `${Path.join(process.cwd(), 'tmp')}`

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

const getCategoryByID = async (query, loginUrl, processCookies, id) => {
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

    const c = json.headerVM.positions.competencies.find(({code}) => code === query.competency)

    return c.id
}

const getData = async (replyWithDocument, query, id) => {
    try {
        const loginUrl = await getLoginUrl()
        const processCookies = await loginProcess(loginUrl)

        const load = await getCategoryByID(query, loginUrl, processCookies, id)

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
            "referrer": `https://grow.telescopeai.com/skillMatrices/37446?competency=${query.competency}&level=${query.level}&skill=${query.skill}`,
            "referrerPolicy": "origin-when-cross-origin",
            "body": `{\"skillId\":${query.skill},\"competencyId\":${load},\"userId\":37446,\"isPreview\":false,\"jobFunctionLevel\":${query.level}`,
            "method": "POST",
            "mode": "cors"
        }).then(t => t.text());

        replyWithDocument({
            source: Buffer.from(result),
            filename: `${id}.json`
        })

        // const data = await Fetch(group.url)
        //     .then(d => d.text())
        //
        // const body = Cheerio.load(data)
        //
        // const a = body('.list-label a')
        //
        // const result = []
        //
        // for (const raw of Object.keys(a)) {
        //     try {
        //         const element = a[raw]
        //
        //         if (!element.attribs || !element.attribs.href) {
        //             continue
        //         }
        //
        //         const link = element.attribs.href
        //         const id = link.split('-').pop()
        //
        //         if (!id) {
        //             continue
        //         }
        //
        //         const post = await PostedModel.get({
        //             group: group.id,
        //             post_id: id
        //         })
        //
        //         if (post) {
        //             continue
        //         }
        //
        //         const row = Cheerio.load(element)
        //
        //         const title = row('.name').text().split('\n').map(n => n.trim()).filter(n => n).join(' ')
        //         const price = row('.price').text().split('\n').map(n => n.trim()).filter(n => n).join(' - ')
        //         const description = row('.item-info-wrapper').text().split('\n').map(n => n.trim()).filter(n => n).join(' - ')
        //
        //         await PostedModel.create({
        //             group: group.id,
        //             post_id: id
        //         })
        //
        //         result.push({
        //             title,
        //             link: `https://mashina.kg${link}`,
        //             price,
        //             description,
        //         })
        //     } catch (e) {
        //         console.error(e)
        //     }
        // }
        //
        // if (result.length === 0) {
        //     return
        // }
        //
        // const text = result
        //     .map(i => `<b>${i.title} - ${i.price}</b>\n${i.description} <a href="${i.link}">[посмореть]</a>`)
        //     .join('\n\n')
        //
        // await sendMessage(group.group, text, {
        //     parse_mode: 'html',
        //     disable_web_page_preview: result.length > 1,
        // })

    } catch (e) {
        console.error(e)
    }
}

bot.on('message', async ({ reply, replyWithDocument, update}) => {
    try {
        try {
            const text = update.message.text.trim()
            const parseUrl = new Url(text, true);

            const id = parseUrl.pathname.split('/').pop()


            if (parseUrl.host !== 'grow.telescopeai.com' || !parseUrl.query || !parseUrl.query.competency || !parseUrl.query.level || !parseUrl.query.skill) {
                return reply(`Ссылка не валидна`)
            }

            await reply(`Ща падажи`)

            await getData(replyWithDocument, parseUrl.query, id)
        } catch (e) {
            await reply(`Не получилось забрать страницу`)
        }
    } catch (e) {
        console.error(e)
    }
})

void bot.launch()
