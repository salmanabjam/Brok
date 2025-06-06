import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, Clock, TrendingUp, News } from "lucide-react";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
}

export default function CryptoNewsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: news, isLoading, error } = useQuery({
    queryKey: ['/api/crypto-news/cardano'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'coingecko': return 'bg-green-100 text-green-800';
      case 'cryptocompare': return 'bg-blue-100 text-blue-800';
      case 'tradingview': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <News className="h-5 w-5" />
            Cardano News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <News className="h-5 w-5" />
            Cardano News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Unable to load news. Please check your API credentials.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Available news sources:</p>
              <div className="space-y-1">
                <a 
                  href="https://www.tradingview.com/symbols/ADAUSD/news/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  TradingView Cardano News
                </a>
                <a 
                  href="https://www.coingecko.com/en/coins/cardano/news" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  CoinGecko Cardano News
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const newsItems = news || [];
  const displayNews = isExpanded ? newsItems : newsItems.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <News className="h-5 w-5" />
            Cardano News
            <Badge variant="secondary" className="ml-2">
              {newsItems.length} articles
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show All"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={isExpanded ? "h-96" : "h-auto"}>
          <div className="space-y-4">
            {displayNews.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent news available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for the latest Cardano updates
                </p>
              </div>
            ) : (
              displayNews.map((item: NewsItem, index: number) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSourceColor(item.source)}`}
                    >
                      {item.source}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(item.published_at)}
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-2 leading-tight">
                    {item.title}
                  </h4>
                  
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Read more
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {newsItems.length > 3 && !isExpanded && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              View {newsItems.length - 3} more articles
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}