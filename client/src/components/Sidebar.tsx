import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Trading Dashboard", icon: "fas fa-chart-candlestick" },
    { path: "/indicators", label: "Indicators", icon: "fas fa-cog" },
    { path: "/performance", label: "Performance", icon: "fas fa-tachometer-alt" },
    { path: "/signals", label: "Signal History", icon: "fas fa-history" },
    { path: "/export", label: "Export Data", icon: "fas fa-download" },
  ];

  return (
    <aside className="w-64 bg-neutral text-white flex flex-col shadow-xl">
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">BrainIXMagT</h1>
            <p className="text-xs text-gray-300">Advanced Trading Indicators</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
              location === item.path
                ? "bg-primary/20 text-white"
                : "hover:bg-gray-700 text-gray-300 hover:text-white"
            }`}>
              <i className={`${item.icon} w-5`}></i>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-gray-300 text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Trader Pro</p>
            <p className="text-xs text-gray-400">Premium Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
