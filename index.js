process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Cheerio = require('cheerio')
const Telegraf = require('telegraf')
const Fetch = require('node-fetch')
const Url = require('url-parse');
const setCookie = require('set-cookie-parser');

const bot = new Telegraf('1360194566:AAFKJFtYWBioafyWUIqzeRa9Ds3NptnIF74')

const sendMessage = bot.telegram.sendMessage.bind(bot.telegram)

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

    const cookiesLand = cookieParse(land, 'Auth.Count')
    const cookiesPDP = cookieParse(pdp, 'Auth.Count')

    console.log(cookiesLand, cookiesPDP)

    const result = await Fetch("https://access.epam.com/auth/realms/plusx/protocol/openid-connect/auth?response_type=code&client_id=EPM-GROW-WITH&redirect_uri=https%3A%2F%2Fgrow.telescopeai.com%2Fauth%2Fsignin-keycloak&state=QS0rPmlDqyGbOvBdJ6g-BJie32YXaeWYnmgfUj28l5M7-w_GvzstaM5Wogroz4Xn15ow8-Ej-oYbcOyO_rvsa5C1VPUTppV5R6VsLF-bbQ8yxqVn2E_0EqJ6qsmgudIia-AE2UO-B20Kcb-sYHFi6zkn_RSZuTd03ct8bp2BHG_uDJfjMnBzoNGdhGjDZ6_Gs6Gj91IGL4kKx1eMaHsiFtw6UzvpZAUOQbetEMj2s2hOLprvJ618ue3kRBB7EjwX&scope=openid%20profile%20email%20offline_access", {
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
            "cookie": loginUrl.cookie
        },
        "rejectUnauthorized": false,
        "referrerPolicy": "no-referrer",
        "body": "username=mihail.hegai%40gmail.com&password=E5ecurepam&login=Sign+In",
        "method": "POST",
        "mode": "cors",
        redirect: 'manual'
    });
    //
    // fetch("https://grow.telescopeai.com/auth/signin-keycloak?state=EWtOgVTbvV-zxJTYmoB1gpYzNG250t-XcTGMOcoLGHXArW9tGp4oXxlBwfVBuIbvV1LMDNLlLXTYgCbroc5hXk981jrOKTmwGzEyPVSGKUJBK8wMv8e0TUs1VAPkpRDDXn-MkyuUX_DZOmv_8xi4Ox1otNXSdOYoYLNJinV9QOz78edZus3soYeDLIg72INq6eZT5-CDK3Sx0JTeb25vfXaL7hZwGoZgotwMQcM2wr5P86AaVj66NA1bmzkt-MOmMo1CyJOlJvzrHSQXY4jbLARcjOMbAsPBlpo9slpjiekabtTDtCuxn_rJcsRmdkW4kq4tH4pvcSd7h3CwsB6sNw&session_state=9f61288d-6cae-41a2-854c-1afb59ef9b2a&code=422ec917-7f62-4620-876b-07b28f713c80.9f61288d-6cae-41a2-854c-1afb59ef9b2a.b9a36e73-bf1b-455b-94f2-9ab951d1d469", {
    //     "headers": {
    //         "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    //         "accept-language": "ru-RU,ru;q=0.9,en-XA;q=0.8,en;q=0.7,en-US;q=0.6",
    //         "cache-control": "max-age=0",
    //         "sec-fetch-dest": "document",
    //         "sec-fetch-mode": "navigate",
    //         "sec-fetch-site": "cross-site",
    //         "sec-fetch-user": "?1",
    //         "upgrade-insecure-requests": "1",
    //         "cookie": "_ga=GA1.2.1951908759.1601282084; CSRF-TOKEN=d7c0728ca859476cb1e0544799b4ae93; _gid=GA1.2.180262178.1601387569; .AspNet.Correlation.Keycloak=OIJMEaHy57EXjyWeAq0DEtFzFrkiWQS-nQUjfM7HwH4"
    //     },
    //     "referrerPolicy": "no-referrer",
    //     "body": null,
    //     "method": "GET",
    //     "mode": "cors"
    // });

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

    console.log(cloak)
}

const getData = async (query) => {
    try {
        const loginUrl = await getLoginUrl()
        const process = await loginProcess(loginUrl)
        //7d6177fc11be4d05a74b27f71804cac4
        //7d6177fc11be4d05a74b27f71804cac4
        console.log(process)

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

bot.command('load', async ({reply, update}) => {
    try {
        const text = update.message.text.replace('/load', '').trim()
        const parseUrl = new Url(text, true);

        if (!parseUrl.host === 'grow.telescopeai.com' || !parseUrl.query || !parseUrl.query.competency || !parseUrl.query.level || !parseUrl.query.skill) {
            return reply(`Ссылка не валидна`)
        }

        await getData(parseUrl.query)
    } catch (e) {
        console.error(e)
    }
})

void bot.launch()
