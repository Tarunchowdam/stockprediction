// src/BinanceChart.js
import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import './App.css';

const BinanceChart = () => {
  const [symbol, setSymbol] = useState("ethusdt"); // default symbol
  const [interval, setInterval] = useState("1m"); // default interval
  const [chartData, setChartData] = useState({}); // store candlestick data
  const ws = useRef(null); // WebSocket reference to manage connection

  // Define available cryptocurrencies
  const coinOptions = [
    { label: "ETH/USDT", value: "ethusdt" },
    { label: "BNB/USDT", value: "bnbusdt" },
    { label: "DOT/USDT", value: "dotusdt" },
  ];

  // Define available time intervals
  const intervalOptions = [
    { label: "1 Minute", value: "1m" },
    { label: "3 Minutes", value: "3m" },
    { label: "5 Minutes", value: "5m" },
  ];

  // Function to handle WebSocket connection
  const connectWebSocket = () => {
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const { t, o, h, l, c } = data.k; // t: timestamp, o: open, h: high, l: low, c: close
        const newCandle = {
          time: new Date(t).toLocaleTimeString(),
          open: parseFloat(o),
          high: parseFloat(h),
          low: parseFloat(l),
          close: parseFloat(c),
        };

        setChartData((prevData) => ({
          ...prevData,
          [symbol]: [...(prevData[symbol] || []), newCandle],
        }));

        localStorage.setItem(symbol, JSON.stringify(chartData[symbol]));
      }
    };
  };

  // Function to handle coin selection
  const handleSymbolChange = (e) => {
    const selectedSymbol = e.target.value;
    setSymbol(selectedSymbol);
    const storedData = localStorage.getItem(selectedSymbol);
    if (storedData) {
      setChartData((prevData) => ({
        ...prevData,
        [selectedSymbol]: JSON.parse(storedData),
      }));
    }
  };

  // Function to handle interval change
  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
    if (ws.current) {
      ws.current.close(); // Close existing WebSocket when interval changes
      connectWebSocket(); // Reconnect WebSocket
    }
  };

  useEffect(() => {
    connectWebSocket(); // Establish WebSocket connection
    return () => ws.current && ws.current.close(); // Clean up on unmount
  }, [symbol, interval]); // Re-run on symbol/interval change

  // Chart configuration
  const chartConfig = {
    labels: (chartData[symbol] || []).map((data) => data.time),
    datasets: [
      {
        label: `Candlestick Data (${symbol.toUpperCase()})`,
        data: (chartData[symbol] || []).map((data) => data.close),
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container">
      <h1>Binance Market Data</h1>

      {/* Coin Selection */}
      <label>Select Cryptocurrency: </label>
      <select onChange={handleSymbolChange} value={symbol}>
        {coinOptions.map((coin) => (
          <option key={coin.value} value={coin.value}>
            {coin.label}
          </option>
        ))}
      </select>

      {/* Interval Selection */}
      <label>Select Interval: </label>
      <select onChange={handleIntervalChange} value={interval}>
        {intervalOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Chart Display */}
      <div style={{ height: "400px", width: "800px", margin: "20px 0" }}>
        <Line data={chartConfig} />
      </div>
    </div>
  );
};

export default BinanceChart;