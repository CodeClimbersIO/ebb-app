import { AppDefinition, WebsiteDefinition, ApplicationDefinition, AppCategory } from './apps-types'

// Activity Rating Scale:
// 1 = Consuming
// 3 = Neutral
// 5 = Creating

export const apps: AppDefinition[] = [
  // Travel
  {
    type: 'website',
    websiteUrl: 'booking.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'booking.svg'
  },
  {
    type: 'website',
    websiteUrl: 'airbnb.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'airbnb.svg'
  },
  {
    type: 'website',
    websiteUrl: 'expedia.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'expedia.svg'
  },
  {
    type: 'website',
    websiteUrl: 'kayak.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'kayak.svg'
  },
  {
    type: 'website',
    websiteUrl: 'tripadvisor.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'tripadvisor.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hotels.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'hotels.svg'
  },
  {
    type: 'website',
    websiteUrl: 'skyscanner.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'skyscanner.svg'
  },
  {
    type: 'website',
    websiteUrl: 'priceline.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'priceline.svg'
  },
  {
    type: 'website',
    websiteUrl: 'vrbo.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'vrbo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hotwire.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'hotwire.svg'
  },
  {
    type: 'website',
    websiteUrl: 'agoda.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'agoda.svg'
  },
  {
    type: 'website',
    websiteUrl: 'britishairways.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'britishairways.svg'
  },
  {
    type: 'website',
    websiteUrl: 'easyjet.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'easyjet.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ryanair.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'ryanair.svg'
  },
  {
    type: 'website',
    websiteUrl: 'lufthansa.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'lufthansa.svg'
  },
  {
    type: 'website',
    websiteUrl: 'emirates.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'emirates.svg'
  },
  {
    type: 'website',
    websiteUrl: 'trainline.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'trainline.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nationalexpress.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'nationalexpress.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hostelworld.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'hostelworld.svg'
  },
  {
    type: 'website',
    websiteUrl: 'viator.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'viator.svg'
  },
  {
    type: 'website',
    websiteUrl: 'rentalcars.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'rentalcars.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hertz.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'hertz.svg'
  },
  {
    type: 'website',
    websiteUrl: 'avis.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'avis.svg'
  },
  {
    type: 'website',
    websiteUrl: 'enterprise.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'enterprise.svg'
  },
  {
    type: 'website',
    websiteUrl: 'marriott.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'marriott.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hilton.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'hilton.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ihg.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'ihg.svg'
  },
  {
    type: 'website',
    websiteUrl: 'accor.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'accor.svg'
  },
  {
    type: 'website',
    websiteUrl: 'travelocity.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'travelocity.svg'
  },
  {
    type: 'website',
    websiteUrl: 'orbitz.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'orbitz.svg'
  },
  {
    type: 'website',
    websiteUrl: 'lastminute.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'lastminute.svg'
  },
  {
    type: 'website',
    websiteUrl: 'holidaypirates.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'holidaypirates.svg'
  },
  {
    type: 'website',
    websiteUrl: 'secretflying.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'secretflying.svg'
  },
  {
    type: 'website',
    websiteUrl: 'thetrainline.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'thetrainline.svg'
  },
  {
    type: 'website',
    websiteUrl: 'eurostar.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'eurostar.svg'
  },
  {
    type: 'website',
    websiteUrl: 'norwegian.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'norwegian.svg'
  },
  {
    type: 'website',
    websiteUrl: 'klm.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'klm.svg'
  },
  {
    type: 'website',
    websiteUrl: 'airfrance.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'airfrance.svg'
  },
  {
    type: 'website',
    websiteUrl: 'cruisecritic.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'cruisecritic.svg'
  },
  {
    type: 'website',
    websiteUrl: 'royalcaribbean.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'royalcaribbean.svg'
  },
  {
    type: 'website',
    websiteUrl: 'carnival.com',
    category: 'Travel',
    defaultRating: 1,
    icon: 'carnival.svg'
  },

  // Entertainment (Streaming)
  {
    type: 'application',
    name: 'TV',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'appletv.svg'
  },
  {
    type: 'website',
    websiteUrl: 'canalplus.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'canalplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'crunchyroll.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'crunchyroll.svg'
  },
  {
    type: 'website',
    websiteUrl: 'dazn.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'dazn.svg'
  },
  {
    type: 'website',
    websiteUrl: 'discoveryplus.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'discoveryplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'disneyplus.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'disneyplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hulu.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'hulu.svg'
  },
  {
    type: 'website',
    websiteUrl: 'iflix.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'iflix.svg'
  },
  {
    type: 'website',
    websiteUrl: 'iqiyi.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'iqiyi.svg'
  },
  {
    type: 'website',
    websiteUrl: 'max.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'max.svg'
  },
  {
    type: 'website',
    websiteUrl: 'mgmplus.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'mgmplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'mubi.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'mubi.svg'
  },
  {
    type: 'website',
    websiteUrl: 'netflix.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'netflix.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ocs.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'ocs.svg'
  },
  {
    type: 'website',
    websiteUrl: 'paramountplus.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'paramountplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'peacocktv.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'peacocktv.svg'
  },
  {
    type: 'website',
    websiteUrl: 'plus.espn.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'espnplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'plus.rtl.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'rtlplus.svg'
  },
  {
    type: 'website',
    websiteUrl: 'primevideo.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'primevideo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'amazon.com/gp/video',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'primevideo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'rakuten.tv',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'rakutentv.svg'
  },
  {
    type: 'website',
    websiteUrl: 'skyshowtime.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'skyshowtime.svg'
  },
  {
    type: 'website',
    websiteUrl: 'sonyliv.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'sonyliv.svg'
  },
  {
    type: 'website',
    websiteUrl: 'starz.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'starz.svg'
  },
  {
    type: 'website',
    websiteUrl: 'tv.apple.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'appletv.svg'
  },
  {
    type: 'website',
    websiteUrl: 'v.qq.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'qq.svg'
  },
  {
    type: 'website',
    websiteUrl: 'viaplay.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'viaplay.svg'
  },
  {
    type: 'website',
    websiteUrl: 'wetv.vip',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'wetv.svg'
  },
  {
    type: 'website',
    websiteUrl: 'youku.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'youku.svg'
  },
  {
    type: 'website',
    websiteUrl: 'youtube.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'youtube.svg'
  },
  {
    type: 'website',
    websiteUrl: 'zee5.com',
    category: 'Entertainment',
    defaultRating: 1,
    icon: 'zee5.svg'
  },

  // Social Media
  {
    type: 'website',
    websiteUrl: 'facebook.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'facebook.svg'
  },
  {
    type: 'website',
    websiteUrl: 'instagram.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'instagram.svg'
  },
  {
    type: 'website',
    websiteUrl: 'linkedin.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'linkedin.svg'
  },
  {
    type: 'website',
    websiteUrl: 'mastodon.social',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'mastodon.svg'
  },
  {
    type: 'website',
    websiteUrl: 'messenger.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'messenger.svg'
  },
  {
    type: 'website',
    websiteUrl: 'myspace.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'myspace.svg'
  },
  {
    type: 'website',
    websiteUrl: 'pinterest.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'pinterest.svg'
  },
  {
    type: 'website',
    websiteUrl: 'quora.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'quora.svg'
  },
  {
    type: 'website',
    websiteUrl: 'reddit.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'reddit.svg'
  },
  {
    type: 'website',
    websiteUrl: 'threads.net',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'threads.svg'
  },
  {
    type: 'website',
    websiteUrl: 'tiktok.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'tiktok.svg'
  },
  {
    type: 'website',
    websiteUrl: 'tumblr.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'tumblr.svg'
  },
  {
    type: 'website',
    websiteUrl: 'twitter.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'x.svg'
  },
  {
    type: 'website',
    websiteUrl: 'vimeo.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'vimeo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'web.telegram.org',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'telegram.svg'
  },
  {
    type: 'website',
    websiteUrl: 'x.com',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'x.svg'
  },
  {
    type: 'website',
    websiteUrl: 'bsky.app',
    category: 'Social Media',
    defaultRating: 1,
    icon: 'bsky.svg'
  },

  // Communication
  {
    type: 'application',
    name: 'Discord',
    category: 'Communication',
    defaultRating: 3,
    icon: 'discord.svg'
  },
  {
    type: 'application',
    name: 'Messages',
    category: 'Communication',
    defaultRating: 1,
    icon: 'messages.svg'
  },
  {
    type: 'application',
    name: 'Slack',
    category: 'Communication',
    defaultRating: 3,
    icon: 'slack.svg'
  },
  {
    type: 'application',
    name: 'Mail',
    category: 'Communication',
    defaultRating: 1,
    icon: 'mail.svg'
  },
  {
    type: 'application',
    name: 'Outlook',
    category: 'Communication',
    defaultRating: 1,
    icon: 'outlook.svg'
  },
  {
    type: 'website',
    websiteUrl: 'web.whatsapp.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'whatsapp.svg'
  },
  {
    type: 'website',
    websiteUrl: 'web.telegram.org',
    category: 'Communication',
    defaultRating: 1,
    icon: 'telegram.svg'
  },
  {
    type: 'website',
    websiteUrl: 'messenger.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'messenger.svg'
  },
  {
    type: 'website',
    websiteUrl: 'discord.com',
    category: 'Communication',
    defaultRating: 3,
    icon: 'discord.svg'
  },
  {
    type: 'website',
    websiteUrl: 'slack.com',
    category: 'Communication',
    defaultRating: 3,
    icon: 'slack.svg'
  },
  {
    type: 'website',
    websiteUrl: 'signal.org',
    category: 'Communication',
    defaultRating: 1,
    icon: 'signal.svg'
  },
  {
    type: 'website',
    websiteUrl: 'wechat.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'wechat.svg'
  },
  {
    type: 'website',
    websiteUrl: 'skype.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'skype.svg'
  },
  {
    type: 'website',
    websiteUrl: 'viber.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'viber.svg'
  },
  {
    type: 'website',
    websiteUrl: 'line.me',
    category: 'Communication',
    defaultRating: 1,
    icon: 'line.svg'
  },
  {
    type: 'website',
    websiteUrl: 'chat.google.com',
    category: 'Communication',
    defaultRating: 3,
    icon: 'googlechat.svg'
  },
  {
    type: 'website',
    websiteUrl: 'teams.microsoft.com',
    category: 'Communication',
    defaultRating: 3,
    icon: 'teams.svg'
  },
  {
    type: 'application',
    name: 'Microsoft Teams',
    category: 'Communication',
    defaultRating: 3,
    icon: 'teams.svg'
  },
  {
    type: 'website',
    websiteUrl: 'zoom.us',
    category: 'Communication',
    defaultRating: 3,
    icon: 'zoom.svg'
  },
  {
    type: 'website',
    websiteUrl: 'icq.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'icq.svg'
  },
  {
    type: 'website',
    websiteUrl: 'wire.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'wire.svg'
  },
  {
    type: 'website',
    websiteUrl: 'element.io',
    category: 'Communication',
    defaultRating: 1,
    icon: 'element.svg'
  },
  {
    type: 'website',
    websiteUrl: 'threema.ch',
    category: 'Communication',
    defaultRating: 1,
    icon: 'threema.svg'
  },
  {
    type: 'website',
    websiteUrl: 'chatwork.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'chatwork.svg'
  },
  {
    type: 'website',
    websiteUrl: 'kik.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'kik.svg'
  },
  {
    type: 'website',
    websiteUrl: 'mail.google.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'gmail.svg'
  },
  {
    type: 'website',
    websiteUrl: 'gmail.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'gmail.svg'
  },
  {
    type: 'website',
    websiteUrl: 'outlook.live.com',
    category: 'Communication',
    defaultRating: 1,
    icon: 'outlook.svg'
  },
  {
    type: 'website',
    websiteUrl: 'proton.me',
    category: 'Communication',
    defaultRating: 1,
    icon: 'proton.svg'
  },

  // Shopping
  {
    type: 'website',
    websiteUrl: 'alibaba.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'alibaba.svg'
  },
  {
    type: 'website',
    websiteUrl: 'aliexpress.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'aliexpress.svg'
  },
  {
    type: 'website',
    websiteUrl: 'allegro.pl',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'allegro.svg'
  },
  {
    type: 'website',
    websiteUrl: 'amazon.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'amazon.svg'
  },
  {
    type: 'website',
    websiteUrl: 'asos.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'asos.svg'
  },
  {
    type: 'website',
    websiteUrl: 'bershka.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'bershka.svg'
  },
  {
    type: 'website',
    websiteUrl: 'craigslist.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'craigslist.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ebay.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'ebay.svg'
  },
  {
    type: 'website',
    websiteUrl: 'etsy.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'etsy.svg'
  },
  {
    type: 'website',
    websiteUrl: 'fr.boohoo.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'boohoo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'homedepot.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'homedepot.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ikea.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'ikea.svg'
  },
  {
    type: 'website',
    websiteUrl: 'mercadolivre.com.br',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'mercadolivre.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nordstromrack.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'nordstromrack.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ozon.ru',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'ozon.svg'
  },
  {
    type: 'website',
    websiteUrl: 'rakuten.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'rakuten.svg'
  },
  {
    type: 'website',
    websiteUrl: 'shein.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'shein.svg'
  },
  {
    type: 'website',
    websiteUrl: 'taobao.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'taobao.svg'
  },
  {
    type: 'website',
    websiteUrl: 'temu.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'temu.svg'
  },
  {
    type: 'website',
    websiteUrl: 'us.boohoo.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'boohoo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'walmart.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'walmart.svg'
  },
  {
    type: 'website',
    websiteUrl: 'wish.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'wish.svg'
  },
  {
    type: 'website',
    websiteUrl: 'zalando.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'zalando.svg'
  },
  {
    type: 'website',
    websiteUrl: 'target.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'target.svg'
  },
  {
    type: 'website',
    websiteUrl: 'bestbuy.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'bestbuy.svg'
  },
  {
    type: 'website',
    websiteUrl: 'wayfair.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'wayfair.svg'
  },
  {
    type: 'website',
    websiteUrl: 'boots.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'boots.svg'
  },
  {
    type: 'website',
    websiteUrl: 'argos.co.uk',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'argos.svg'
  },
  {
    type: 'website',
    websiteUrl: 'johnlewis.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'johnlewis.svg'
  },
  {
    type: 'website',
    websiteUrl: 'currys.co.uk',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'currys.svg'
  },
  {
    type: 'website',
    websiteUrl: 'next.co.uk',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'next.svg'
  },
  {
    type: 'website',
    websiteUrl: 'very.co.uk',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'very.svg'
  },
  {
    type: 'website',
    websiteUrl: 'zara.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'zara.svg'
  },
  {
    type: 'website',
    websiteUrl: 'hm.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'hm.svg'
  },
  {
    type: 'website',
    websiteUrl: 'uniqlo.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'uniqlo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'macys.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'macys.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nordstrom.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'nordstrom.svg'
  },
  {
    type: 'website',
    websiteUrl: 'shopify.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'shopify.svg'
  },
  {
    type: 'website',
    websiteUrl: 'overstock.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'overstock.svg'
  },
  {
    type: 'website',
    websiteUrl: 'newegg.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'newegg.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nike.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'nike.svg'
  },
  {
    type: 'website',
    websiteUrl: 'adidas.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'adidas.svg'
  },
  {
    type: 'website',
    websiteUrl: 'jd.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'jd.svg'
  },
  {
    type: 'website',
    websiteUrl: 'tesco.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'tesco.svg'
  },
  {
    type: 'website',
    websiteUrl: 'sainsburys.co.uk',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'sainsburys.svg'
  },
  {
    type: 'website',
    websiteUrl: 'asda.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'asda.svg'
  },
  {
    type: 'website',
    websiteUrl: 'marksandspencer.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'marksandspencer.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ao.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'ao.svg'
  },
  {
    type: 'website',
    websiteUrl: 'debenhams.com',
    category: 'Shopping',
    defaultRating: 1,
    icon: 'debenhams.svg'
  },

  // News
  {
    type: 'application',
    name: 'News',
    category: 'News',
    defaultRating: 1,
    icon: 'applenews.svg'
  },
  {
    type: 'website',
    websiteUrl: 'news.ycombinator.com',
    category: 'News',
    defaultRating: 1,
    icon: 'yc.svg'
  },
  {
    type: 'website',
    websiteUrl: 'reuters.com',
    category: 'News',
    defaultRating: 1,
    icon: 'reuters.svg'
  },
  {
    type: 'website',
    websiteUrl: 'bloomberg.com',
    category: 'News',
    defaultRating: 1,
    icon: 'bloomberg.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ap.org',
    category: 'News',
    defaultRating: 1,
    icon: 'ap.svg'
  },
  {
    type: 'website',
    websiteUrl: 'bbc.com',
    category: 'News',
    defaultRating: 1,
    icon: 'bbc.svg'
  },
  {
    type: 'website',
    websiteUrl: 'cnn.com',
    category: 'News',
    defaultRating: 1,
    icon: 'cnn.svg'
  },
  {
    type: 'website',
    websiteUrl: 'aljazeera.com',
    category: 'News',
    defaultRating: 1,
    icon: 'aljazeera.svg'
  },
  {
    type: 'website',
    websiteUrl: 'theguardian.com',
    category: 'News',
    defaultRating: 1,
    icon: 'theguardian.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nytimes.com',
    category: 'News',
    defaultRating: 1,
    icon: 'nytimes.svg'
  },
  {
    type: 'website',
    websiteUrl: 'wsj.com',
    category: 'News',
    defaultRating: 1,
    icon: 'wsj.svg'
  },
  {
    type: 'website',
    websiteUrl: 'telegraph.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'telegraph.svg'
  },
  {
    type: 'website',
    websiteUrl: 'independent.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'independent.svg'
  },
  {
    type: 'website',
    websiteUrl: 'dailymail.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'dailymail.svg'
  },
  {
    type: 'website',
    websiteUrl: 'mirror.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'mirror.svg'
  },
  {
    type: 'website',
    websiteUrl: 'thesun.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'thesun.svg'
  },
  {
    type: 'website',
    websiteUrl: 'metro.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'metro.svg'
  },
  {
    type: 'website',
    websiteUrl: 'standard.co.uk',
    category: 'News',
    defaultRating: 1,
    icon: 'standard.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ft.com',
    category: 'News',
    defaultRating: 1,
    icon: 'ft.svg'
  },
  {
    type: 'website',
    websiteUrl: 'dw.com',
    category: 'News',
    defaultRating: 1,
    icon: 'dw.svg'
  },
  {
    type: 'website',
    websiteUrl: 'france24.com',
    category: 'News',
    defaultRating: 1,
    icon: 'france24.svg'
  },
  {
    type: 'website',
    websiteUrl: 'euronews.com',
    category: 'News',
    defaultRating: 1,
    icon: 'euronews.svg'
  },
  {
    type: 'website',
    websiteUrl: 'thelocal.eu',
    category: 'News',
    defaultRating: 1,
    icon: 'thelocal.svg'
  },
  {
    type: 'website',
    websiteUrl: 'politico.eu',
    category: 'News',
    defaultRating: 1,
    icon: 'politico.svg'
  },
  {
    type: 'website',
    websiteUrl: 'washingtonpost.com',
    category: 'News',
    defaultRating: 1,
    icon: 'washingtonpost.svg'
  },
  {
    type: 'website',
    websiteUrl: 'usatoday.com',
    category: 'News',
    defaultRating: 1,
    icon: 'usatoday.svg'
  },
  {
    type: 'website',
    websiteUrl: 'foxnews.com',
    category: 'News',
    defaultRating: 1,
    icon: 'foxnews.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nbcnews.com',
    category: 'News',
    defaultRating: 1,
    icon: 'nbcnews.svg'
  },
  {
    type: 'website',
    websiteUrl: 'cbsnews.com',
    category: 'News',
    defaultRating: 1,
    icon: 'cbsnews.svg'
  },
  {
    type: 'website',
    websiteUrl: 'abcnews.go.com',
    category: 'News',
    defaultRating: 1,
    icon: 'abcnews.svg'
  },
  {
    type: 'website',
    websiteUrl: 'latimes.com',
    category: 'News',
    defaultRating: 1,
    icon: 'latimes.svg'
  },
  {
    type: 'website',
    websiteUrl: 'globe.com',
    category: 'News',
    defaultRating: 1,
    icon: 'globe.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nationalpost.com',
    category: 'News',
    defaultRating: 1,
    icon: 'nationalpost.svg'
  },
  {
    type: 'website',
    websiteUrl: 'cbc.ca',
    category: 'News',
    defaultRating: 1,
    icon: 'cbc.svg'
  },
  {
    type: 'website',
    websiteUrl: 'scmp.com',
    category: 'News',
    defaultRating: 1,
    icon: 'scmp.svg'
  },
  {
    type: 'website',
    websiteUrl: 'japantimes.co.jp',
    category: 'News',
    defaultRating: 1,
    icon: 'japantimes.svg'
  },
  {
    type: 'website',
    websiteUrl: 'straitstimes.com',
    category: 'News',
    defaultRating: 1,
    icon: 'straitstimes.svg'
  },
  {
    type: 'website',
    websiteUrl: 'abc.net.au',
    category: 'News',
    defaultRating: 1,
    icon: 'abc.svg'
  },
  {
    type: 'website',
    websiteUrl: 'news.com.au',
    category: 'News',
    defaultRating: 1,
    icon: 'newscomau.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nzherald.co.nz',
    category: 'News',
    defaultRating: 1,
    icon: 'nzherald.svg'
  },
  {
    type: 'website',
    websiteUrl: 'thehindu.com',
    category: 'News',
    defaultRating: 1,
    icon: 'thehindu.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ndtv.com',
    category: 'News',
    defaultRating: 1,
    icon: 'ndtv.svg'
  },

  // Gaming
  {
    type: 'website',
    websiteUrl: 'steampowered.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'steam.svg'
  },
  {
    type: 'website',
    websiteUrl: 'epicgames.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'epic.svg'
  },
  {
    type: 'website',
    websiteUrl: 'gog.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'gog.svg'
  },
  {
    type: 'website',
    websiteUrl: 'origin.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'origin.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ubisoft.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'ubisoft.svg'
  },
  {
    type: 'website',
    websiteUrl: 'battle.net',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'battlenet.svg'
  },
  {
    type: 'website',
    websiteUrl: 'riotgames.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'riot.svg'
  },
  {
    type: 'website',
    websiteUrl: 'itch.io',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'itch.svg'
  },
  {
    type: 'website',
    websiteUrl: 'humblebundle.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'humble.svg'
  },
  {
    type: 'website',
    websiteUrl: 'greenmangaming.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'greenmangaming.svg'
  },
  {
    type: 'website',
    websiteUrl: 'gamespot.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'gamespot.svg'
  },
  {
    type: 'website',
    websiteUrl: 'ign.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'ign.svg'
  },
  {
    type: 'website',
    websiteUrl: 'polygon.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'polygon.svg'
  },
  {
    type: 'website',
    websiteUrl: 'kotaku.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'kotaku.svg'
  },
  {
    type: 'website',
    websiteUrl: 'pcgamer.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'pcgamer.svg'
  },
  {
    type: 'website',
    websiteUrl: 'nintendo.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'nintendo.svg'
  },
  {
    type: 'website',
    websiteUrl: 'playstation.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'playstation.svg'
  },
  {
    type: 'website',
    websiteUrl: 'xbox.com',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'xbox.svg'
  },
  {
    type: 'website',
    websiteUrl: 'twitch.tv',
    category: 'Gaming',
    defaultRating: 1,
    icon: 'twitch.svg'
  },

  // Coding
  {
    type: 'application',
    name: 'Visual Studio Code',
    category: 'Coding',
    defaultRating: 5,
    icon: 'vscode.svg'
  },
  {
    type: 'website',
    websiteUrl: 'daily.dev',
    category: 'Coding',
    defaultRating: 3,
    icon: 'dailydev.svg'
  },
  {
    type: 'application',
    name: 'Terminal',
    category: 'Coding',
    defaultRating: 3,
    icon: 'terminal.svg'
  },
  {
    type: 'application',
    name: 'Intellij IDEA',
    category: 'Coding',
    defaultRating: 5,
    icon: 'intellij.svg'
  },  
  {
    type: 'application',
    name: 'WebStorm',
    category: 'Coding',
    defaultRating: 5,
    icon: 'webstorm.svg'
  },  
  {
    type: 'application',
    name: 'PyCharm',
    category: 'Coding',
    defaultRating: 5,
    icon: 'pycharm.svg'
  },  
  {
    type: 'application',
    name: 'Atom',
    category: 'Coding',
    defaultRating: 5,
    icon: 'atom.svg'
  },    
  {
    type: 'application',
    name: 'Sublime Text',
    category: 'Coding',
    defaultRating: 5,
    icon: 'sublime.svg'
  },  
  {
    type: 'application',
    name: 'Notepad++',
    category: 'Coding',
    defaultRating: 5,
    icon: 'notepad.svg'
  },  
  {
    type: 'application',
    name: 'Cursor',
    category: 'Coding',
    defaultRating: 5,
    icon: 'cursor.svg'
  },
  {
    type: 'application',
    name: 'Neovim',
    category: 'Coding',
    defaultRating: 5,
    icon: 'neovim.svg'
  },
  {
    type: 'website',
    websiteUrl: 'github.com',
    category: 'Coding',
    defaultRating: 5,
    icon: 'github.svg'
  },

  // Designing
  {
    type: 'website',
    websiteUrl: 'figma.com',
    category: 'Designing',
    defaultRating: 5,
    icon: 'figma.svg'
  },
  {
    type: 'website',
    websiteUrl: 'behance.net',
    category: 'Designing',
    defaultRating: 5,
    icon: 'behance.svg'
  },
  {
    type: 'website',
    websiteUrl: 'canva.com',
    category: 'Designing',
    defaultRating: 5,
    icon: 'canva.svg'
  },
  {
    type: 'application',
    name: 'Figma',
    category: 'Designing',
    defaultRating: 5,
    icon: 'figma.svg'
  },
  {
    type: 'application',
    name: 'Adobe Photoshop',
    category: 'Designing',
    defaultRating: 5,
    icon: 'photoshop.svg'
  },
  {
    type: 'application',
    name: 'Adobe Illustrator',
    category: 'Designing',
    defaultRating: 5,
    icon: 'illustrator.svg'
  },
  {
    type: 'application',
    name: 'Adobe InDesign',
    category: 'Designing',
    defaultRating: 5,
    icon: 'indesign.svg'
  },
  {
    type: 'application',
    name: 'Adobe XD',
    category: 'Designing',
    defaultRating: 5,
    icon: 'xd.svg'
  },
  {
    type: 'application',
    name: 'Adobe After Effects',
    category: 'Designing',
    defaultRating: 5,
    icon: 'aftereffects.svg'
  },
  {
    type: 'application',
    name: 'Adobe Premiere Pro',
    category: 'Designing',
    defaultRating: 5,
    icon: 'premiere.svg'
  },
  {
    type: 'application',
    name: 'Sketch',
    category: 'Designing',
    defaultRating: 5,
    icon: 'sketch.svg'
  },
  {
    type: 'application',
    name: 'Affinity Designer',
    category: 'Designing',
    defaultRating: 5,
    icon: 'affinitydesigner.svg'
  },
  {
    type: 'application',
    name: 'Affinity Photo',
    category: 'Designing',
    defaultRating: 5,
    icon: 'affinityphoto.svg'
  },
  {
    type: 'application',
    name: 'Affinity Publisher',
    category: 'Designing',
    defaultRating: 5,
    icon: 'affinitypublisher.svg'
  },
  {
    type: 'website',
    websiteUrl: 'sketch.com',
    category: 'Designing',
    defaultRating: 5,
    icon: 'sketch.svg'
  },
  {
    type: 'website',
    websiteUrl: 'adobe.com',
    category: 'Designing',
    defaultRating: 5,
    icon: 'adobe.svg'
  },

  // Creating
  {
    type: 'application',
    name: 'Notes',
    category: 'Creating',
    defaultRating: 5,
    icon: 'applenotes.svg'
  },
  {
    type: 'application',
    name: 'Microsoft Word',
    category: 'Creating',
    defaultRating: 5,
    icon: 'word.svg'
  },
  {
    type: 'application',
    name: 'Microsoft Excel',
    category: 'Creating',
    defaultRating: 5,
    icon: 'excel.svg'
  },
  {
    type: 'application',
    name: 'Microsoft PowerPoint',
    category: 'Creating',
    defaultRating: 5,
    icon: 'powerpoint.svg'
  },
  {
    type: 'application',
    name: 'Microsoft OneNote',
    category: 'Creating',
    defaultRating: 5,
    icon: 'onenote.svg'
  },
  {
    type: 'application',
    name: 'Pages',
    category: 'Creating',
    defaultRating: 5,
    icon: 'pages.svg'
  },
  {
    type: 'application',
    name: 'Numbers',
    category: 'Creating',
    defaultRating: 5,
    icon: 'numbers.svg'
  },
  {
    type: 'application',
    name: 'Keynote',
    category: 'Creating',
    defaultRating: 5,
    icon: 'keynote.svg'
  },
  {
    type: 'application',
    name: 'Google Docs',
    category: 'Creating',
    defaultRating: 5,
    icon: 'googledocs.svg'
  },
  {
    type: 'application',
    name: 'Google Sheets',
    category: 'Creating',
    defaultRating: 5,
    icon: 'googlesheets.svg'
  },
  {
    type: 'application',
    name: 'Google Slides',
    category: 'Creating',
    defaultRating: 5,
    icon: 'googleslides.svg'
  },
  {
    type: 'website',
    websiteUrl: 'docs.google.com',
    category: 'Creating',
    defaultRating: 5,
    icon: 'googledocs.svg'
  },
  {
    type: 'website',
    websiteUrl: 'sheets.google.com',
    category: 'Creating',
    defaultRating: 5,
    icon: 'googlesheets.svg'
  },
  {
    type: 'website',
    websiteUrl: 'slides.google.com',
    category: 'Creating',
    defaultRating: 5,
    icon: 'googleslides.svg'
  },
  {
    type: 'website',
    websiteUrl: 'notion.so',
    category: 'Creating',
    defaultRating: 5,
    icon: 'notion.svg'
  },
  {
    type: 'application',
    name: 'Notion',
    category: 'Creating',
    defaultRating: 5,
    icon: 'notion.svg'
  },
  {
    type: 'website',
    websiteUrl: 'evernote.com',
    category: 'Creating',
    defaultRating: 5,
    icon: 'evernote.svg'
  },
  {
    type: 'application',
    name: 'Evernote',
    category: 'Creating',
    defaultRating: 5,
    icon: 'evernote.svg'
  },

  // Utilities
  {
    type: 'application',
    name: 'Ebb',
    category: 'Utilities',
    defaultRating: 3,
    icon: 'ebb.svg'
  },
  {
    type: 'application',
    name: 'Music',
    category: 'Utilities',
    defaultRating: 3,
    icon: 'applemusic.svg'
  },
  {
    type: 'application',
    name: 'Spotify',
    category: 'Utilities',
    defaultRating: 3,
    icon: 'spotify.svg'
  },
  {
    type: 'website',
    websiteUrl: 'spotify.com',
    category: 'Utilities',
    defaultRating: 3,
    icon: 'spotify.svg'
  }
]
// Helper functions
export const getAppByName = (name: string): AppDefinition | undefined => {
  return apps.find(
    (app): app is ApplicationDefinition => 
      app.type === 'application' && app.name.toLowerCase() === name.toLowerCase()
  )
}

export const getAppByUrl = (url: string): AppDefinition | undefined => {
  return apps.find(
    (app): app is WebsiteDefinition => 
      app.type === 'website' && url.includes(app.websiteUrl)
  )
}

export const getAppsByCategory = (category: AppCategory): AppDefinition[] => {
  return apps.filter(app => app.category === category)
}

