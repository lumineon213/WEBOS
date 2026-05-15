// @ts-nocheck
import React, { useState } from 'react';
import './weather.css';

const Weather: React.FC = () => {
  // 나중에 API 연동을 고려한 데이터 구조
  const [weather] = useState({
    city: 'Seoul',
    temp: 18,
    condition: 'Sunny',
    high: 22,
    low: 14,
    humidity: '45%',
    wind: '3.2m/s',
    forecast: [
      { day: 'Sat', temp: 20, icon: '⛅' },
      { day: 'Sun', temp: 21, icon: '☀️' },
      { day: 'Mon', temp: 19, icon: '☁️' },
    ]
  });

  return (
    <div className="weather-app">
      {/* 현재 날씨 메인 영역 */}
      <div className="weather-main">
        <div className="weather-location">
          <span className="location-icon">📍</span> {weather.city}
        </div>
        <div className="main-display">
          <span className="weather-big-icon">☀️</span>
          <div className="temp-info">
            <span className="current-temp">{weather.temp}°</span>
            <span className="condition-text">{weather.condition}</span>
          </div>
        </div>
        <div className="temp-range">
          H: {weather.high}° L: {weather.low}°
        </div>
      </div>

      {/* 세부 정보 영역 */}
      <div className="weather-details">
        <div className="detail-item">
          <span className="label">습도</span>
          <span className="value">{weather.humidity}</span>
        </div>
        <div className="detail-item">
          <span className="label">풍속</span>
          <span className="value">{weather.wind}</span>
        </div>
      </div>

      {/* 3일 예보 영역 */}
      <div className="weather-forecast">
        {weather.forecast.map((f, i) => (
          <div key={i} className="forecast-item">
            <span className="f-day">{f.day}</span>
            <span className="f-icon">{f.icon}</span>
            <span className="f-temp">{f.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;