export interface CryptoPrice {
  symbol: string;
  price: number;
  volume_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface CryptoNews {
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
}

class CryptoDataService {
  private readonly COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

  async getCardanoPrice(): Promise<CryptoPrice | null> {
    try {
      const response = await fetch(
        `${this.COINGECKO_BASE_URL}/simple/price?ids=cardano&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const cardanoData = data.cardano;

      if (!cardanoData) {
        return null;
      }

      return {
        symbol: 'ADAUSD',
        price: cardanoData.usd,
        volume_24h: cardanoData.usd_24h_vol || 0,
        price_change_24h: cardanoData.usd_24h_change || 0,
        price_change_percentage_24h: cardanoData.usd_24h_change || 0,
        market_cap: cardanoData.usd_market_cap || 0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching Cardano price from CoinGecko:', error);
      return null;
    }
  }

  async getBinanceCardanoPrice(): Promise<CryptoPrice | null> {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ADAUSDT');
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        symbol: 'ADAUSD',
        price: parseFloat(data.lastPrice),
        volume_24h: parseFloat(data.volume),
        price_change_24h: parseFloat(data.priceChange),
        price_change_percentage_24h: parseFloat(data.priceChangePercent),
        market_cap: 0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching Cardano price from Binance:', error);
      return null;
    }
  }

  async getKrakenCardanoPrice(): Promise<CryptoPrice | null> {
    try {
      const response = await fetch('https://api.kraken.com/0/public/Ticker?pair=ADAUSD');
      
      if (!response.ok) {
        throw new Error(`Kraken API error: ${response.status}`);
      }

      const data = await response.json();
      const pair = data.result?.ADAUSD;

      if (!pair) {
        return null;
      }

      return {
        symbol: 'ADAUSD',
        price: parseFloat(pair.c[0]),
        volume_24h: parseFloat(pair.v[1]),
        price_change_24h: 0,
        price_change_percentage_24h: 0,
        market_cap: 0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching Cardano price from Kraken:', error);
      return null;
    }
  }

  async getCardanoNews(): Promise<CryptoNews[]> {
    // Return fallback news structure for now - authentic sources require API keys
    return [
      {
        title: "Cardano (ADA) Technical Analysis Update",
        description: "Latest technical indicators and market sentiment for ADA/USD trading pair",
        url: "https://www.tradingview.com/symbols/ADAUSD/news/",
        published_at: new Date().toISOString(),
        source: "TradingView"
      },
      {
        title: "Cardano Blockchain Development Updates",
        description: "Recent developments in Cardano's ecosystem and smart contract capabilities",
        url: "https://www.coingecko.com/en/coins/cardano/news",
        published_at: new Date(Date.now() - 3600000).toISOString(),
        source: "CoinGecko"
      }
    ];
  }

  async getMultiSourcePrice(): Promise<CryptoPrice | null> {
    const sources = [
      this.getCardanoPrice,
      this.getBinanceCardanoPrice,
      this.getKrakenCardanoPrice
    ];

    for (const source of sources) {
      try {
        const price = await source.call(this);
        if (price) {
          return price;
        }
      } catch (error) {
        console.error('Price source failed:', error);
        continue;
      }
    }

    return null;
  }
}

export const cryptoDataService = new CryptoDataService();