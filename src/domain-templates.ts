/**
 * Domain-specific header templates for anti-hotlinking bypass
 */

export interface DomainTemplate {
  pattern: RegExp;
  origin: string;
  referer: string;
  userAgent?: string;
  additionalHeaders?: Record<string, string>;
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0';

/**
 * Domain templates for anti-hotlinking protection
 * Add new domains here with their specific headers
 */
export const domainTemplates: DomainTemplate[] = [
  // Padorupado.ru
  {
    pattern: /\.padorupado\.ru$/i,
    origin: 'https://kwik.si',
    referer: 'https://kwik.si/',
  },

  // Krussdomi.com
  {
    pattern: /krussdomi\.com$/i,
    origin: 'https://krussdomi.com',
    referer: 'https://hls.krussdomi.com/',
  },

  {
    pattern: /\.narutokun\.xyz$/i,
    origin: 'https://krussdomi.com',
    referer: 'https://krussdomi.com/',
  },

  {
    pattern: /\.babybayw\.xyz$/i,
    origin: 'https://krussdomi.com',
    referer: 'https://krussdomi.com/',
  },

  {
    pattern: /\.advancedairesearchlab\.xyz$/i,
    origin: 'https://krussdomi.com',
    referer: 'https://krussdomi.com/',
  },

  {
    pattern: /\.habibikun\.xyz$/i,
    origin: 'https://bl.krussdomi.com',
    referer: 'https://bl.krussdomi.com/',
  },

  {
    pattern: /\.akamaized\.net$/i,
    origin: 'https://bl.krussdomi.com',
    referer: 'https://bl.krussdomi.com/',
  },

  {
    pattern: /\.anih1\.top$/i,
    origin: 'https://ee.anih1.top',
    referer: 'https://ee.anih1.top/',
  },

  {
    pattern: /\.xyk3\.top$/i,
    origin: 'https://ee.anih1.top',
    referer: 'https://ee.anih1.top/',
  },

  {
    pattern: /\.premilkyway\.com$/i,
    origin: 'https://uqloads.xyz',
    referer: 'https://uqloads.xyz/',
  },

  // kwikie.ru
  {
    pattern: /\.kwikie\.ru$/i,
    origin: 'https://kwik.si',
    referer: 'https://kwik.si/',
  },

  // Various xyz domains (krussdomi.com related)
  {
    pattern: /(revolutionizingtheweb|nextgentechnologytrends|smartinvestmentstrategies|creativedesignstudioxyz|breakingdigitalboundaries|ultimatetechinnovation)\.xyz$/i,
    origin: 'https://hls.krussdomi.com',
    referer: 'https://hls.krussdomi.com/',
  },

  // raffaellocdn.net
  {
    pattern: /\.raffaellocdn\.net$/i,
    origin: 'https://streameeeeee.site',
    referer: 'https://streameeeeee.site/',
  },

  // Megacloud related domains
  {
    pattern: /(dewbreeze84|mistyvalley31)\.(online|live)$/i,
    origin: 'https://megacloud.blog',
    referer: 'https://megacloud.blog/',
  },

  {
    pattern: /douvid\.xyz$/i,
    origin: 'https://megacloud.blog',
    referer: 'https://megacloud.blog/',
    additionalHeaders: {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.5',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
    },
  },

  {
    pattern: /(lightningspark77|thunderwave48|stormwatch95|windyrays29|thunderstrike77|fogtwist21|rainfallpath36|lightningflash39|stormwhirl73|cloudburst82|drizzleshower19)\.((pro|site|xyz|online|live))$/i,
    origin: 'https://megacloud.club',
    referer: 'https://megacloud.club/',
  },

  {
    pattern: /clearskydrift45\.site$/i,
    origin: 'https://kerolaunochan.online',
    referer: 'https://kerolaunochan.online/',
  },

  // Cloudnestra related
  {
    pattern: /\.shadowlandschronicles\.com$/i,
    origin: 'https://cloudnestra.com',
    referer: 'https://cloudnestra.com/',
  },

  {
    pattern: /(sparkrisestudios|dreamwavecollective|urbansagecollective|novaquestdynamics|boldsageventures)\.xyz$/i,
    origin: 'https://cloudnestra.com',
    referer: 'https://cloudnestra.com/',
  },

  {
    pattern: /putgate\.org$/i,
    origin: 'https://cloudnestra.com',
    referer: 'https://cloudnestra.com/',
  },

  // southboat.site
  {
    pattern: /\.southboat\.site$/i,
    origin: 'https://player.videasy.net',
    referer: 'https://player.videasy.net/',
  },

  // cdnup.cc
  {
    pattern: /\.cdnup\.cc$/i,
    origin: 'https://bestwish.lol',
    referer: 'https://bestwish.lol/',
  },

  // streamupcdn.com
  {
    pattern: /\.streamupcdn\.com$/i,
    origin: 'https://bestwish.lol',
    referer: 'https://bestwish.lol/',
  },

  // eb.netmagcdn.com
  {
    pattern: /\.netmagcdn\.com$/i,
    origin: 'https://megacloud.club',
    referer: 'https://megacloud.club/',
  },

  // vmeas.cloud
  {
    pattern: /vmeas\.cloud$/i,
    origin: 'https://vidmoly.to',
    referer: 'https://vidmoly.to/',
  },

  // nextwaveinitiative
  {
    pattern: /nextwaveinitiative\.xyz$/i,
    origin: 'https://edgedeliverynetwork.org',
    referer: 'https://edgedeliverynetwork.org/',
  },

  // shadowlandschronicles
  {
    pattern: /shadowlandschronicles\.com$/i,
    origin: 'https://edgedeliverynetwork.org',
    referer: 'https://edgedeliverynetwork.org/',
  },

  // lightningbolts.ru
  {
    pattern: /lightningbolts\.ru$/i,
    origin: 'https://vidsrc.cc',
    referer: 'https://vidsrc.cc/',
  },

  // .xelvonwave64.xyz
  {
    pattern: /\.xelvonwave64\.xyz$/i,
    origin: 'https://vidsrc.su',
    referer: 'https://vidsrc.su/',
  },

  // lightningbolt.site
  {
    pattern: /lightningbolt\.site$/i,
    origin: 'https://vidsrc.cc',
    referer: 'https://vidsrc.cc/',
  },

  // vidlvod.store
  {
    pattern: /vidlvod\.store$/i,
    origin: 'https://vidlink.pro',
    referer: 'https://vidlink.pro/',
  },

  // vyebzzqlojvrl.top
  {
    pattern: /vyebzzqlojvrl\.top$/i,
    origin: 'https://vidsrc.cc',
    referer: 'https://vidsrc.cc/',
  },

  // Megacloud Store domains
  {
    pattern: /(sunnybreeze16|mgstatics|cloudydrift38|stormwhirl73|odyssey|rainveil36|sunshinerays93|sunburst66|sunburst93|windytrail24|stormshade84|clearskyline88|clearbluesky72|breezygale56|haildrop77|frostshine12|frostbite27|frostywinds57|icyhailstorm64|icyhailstorm29|windflash93|stormdrift27|tempestcloud61|rainfallpath36)\.((live|site|xyz|online|pro|biz|wiki))$/i,
    origin: 'https://megacloud.blog',
    referer: 'https://megacloud.blog/',
  },

  // Odyssey domains (megacloud related)
  {
    pattern: /odyssey-\d+\.biz$/i,
    origin: 'https://megaup.live',
    referer: 'https://megaup.live/',
  },

  // 1stkmgv1.com
  {
    pattern: /1stkmgv1\.com$/i,
    origin: 'https://vidmoly.to',
    referer: 'https://vidmoly.to/',
  },

  // rainstorm92.xyz
  {
    pattern: /rainstorm92\.xyz$/i,
    origin: 'https://megacloud.club',
    referer: 'https://megacloud.club/',
  },

  // feetcdn.com
  {
    pattern: /\.feetcdn\.com$/i,
    origin: 'https://kerolaunochan.online',
    referer: 'https://kerolaunochan.online/',
  },

  // Kerolaunochan.live domains
  {
    pattern: /(heatwave90|humidmist27|frozenbreeze65|drizzlerain73|sunrays81)\.((pro|wiki|live|online|xyz))$/i,
    origin: 'https://kerolaunochan.live',
    referer: 'https://kerolaunochan.live/',
  },

  // embed.su
  {
    pattern: /embed\.su$/i,
    origin: 'https://embed.su',
    referer: 'https://embed.su/',
  },

  {
    pattern: /usbigcdn\.cc$/i,
    origin: 'https://embed.su',
    referer: 'https://embed.su/',
  },

  {
    pattern: /\.congacdn\.cc$/i,
    origin: 'https://embed.su',
    referer: 'https://embed.su/',
  },

  // vkcdn5.com
  {
    pattern: /\.vkcdn5\.com$/i,
    origin: 'https://vkspeed.com',
    referer: 'https://vkspeed.com/',
  },

  // Cloudfront CDN
  {
    pattern: /\.cloudfront\.net$/i,
    origin: 'https://d2zihajmogu5jn.cloudfront.net',
    referer: 'https://d2zihajmogu5jn.cloudfront.net/',
  },

  // Twitch CDN
  {
    pattern: /\.ttvnw\.net$/i,
    origin: 'https://www.twitch.tv',
    referer: 'https://www.twitch.tv/',
  },
];

/**
 * Find matching domain template for a given hostname
 */
export function findDomainTemplate(hostname: string): DomainTemplate | null {
  for (const template of domainTemplates) {
    if (template.pattern.test(hostname)) {
      return template;
    }
  }
  return null;
}

/**
 * Generate headers for a URL using domain templates
 */
export function generateHeaders(url: URL): Record<string, string> {
  const template = findDomainTemplate(url.hostname);

  const headers: Record<string, string> = {
    'user-agent': DEFAULT_USER_AGENT,
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.5',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
  };

  if (template) {
    headers['origin'] = template.origin;
    headers['referer'] = template.referer;

    if (template.userAgent) {
      headers['user-agent'] = template.userAgent;
    }

    if (template.additionalHeaders) {
      Object.assign(headers, template.additionalHeaders);
    }
  }

  headers['host'] = url.host;

  return headers;
}
