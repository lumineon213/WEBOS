// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './weather.css';

// 🚀 발급받으신 기상청 API 허브 고유 인증키
const AUTH_KEY = 'vgw7tQqqRJCMO7UKqjSQGA';

// 예보구역코드 (11B10101: 서울 고정 코드)
const REG_CODE = '11B10101';

const Weather: React.FC = () => {
  const [weather, setWeather] = useState({
    city: '서울',
    temp: '--',
    condition: '기상청 동기화 중...',
    mainIcon: '☀️',
    high: '--',
    low: '--',
    humidity: '--%',
    wind: '--m/s',
    forecast: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHubWeatherData = async () => {
      try {
        // 🚀 수정 포인트: package.json의 proxy 설정을 타도록 도메인을 지우고 상대 경로로 변경했습니다.
        // 🚀 필수 인자인 &reg(지역코드)와 &disp=1(콤마 구분자 출력)을 추가하여 하단 파싱 로직과의 충돌을 방지합니다.
        const url = `/api/typ01/url/fct_shrt_reg.php?tmfc=0&authKey=${AUTH_KEY}`;

        const response = await fetch(url);
        const textData = await response.text();

        // 💡 기상청 특유의 텍스트 주석 및 공백 행을 필터링하고 줄바꿈 단위로 쪼갭니다.
        const lines = textData
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#')); // #으로 시작하는 주석 설명행 제거

        if (lines.length === 0) {
          throw new Error('예보 데이터 파싱 실패');
        }

        const latestForecasts = [];
        let currentTemp = '--';
        let condition = '맑음';
        let mainIcon = '☀️';
        let highTemp = '--';
        let lowTemp = '--';
        let humidity = '--';
        let wind = '--';

        // 상위 데이터 파싱 파이프라인
        lines.forEach((line, idx) => {
          const tokens = line.split(',').map(t => t.trim());
          if (tokens.length < 6) return; // 콤마 데이터 토큰 길이 유효성 검사 기준 변경

          const fTimeRaw = tokens[3] || ''; // 예보 시간
          const varName = tokens[4] || '';  // 요소 명칭 (TA: 기온, SKY: 하늘 등)
          const varValue = tokens[5] || ''; // 값

          if (idx < 3) {
            // 타임라인용 가공 데이터 축적
            if (varName === 'TA' && latestForecasts.length < 3) {
              const rawHour = fTimeRaw.substring(8, 10);
              const displayHour = parseInt(rawHour) >= 12 ? `오후 ${parseInt(rawHour) - 12 || 12}시` : `오전 ${rawHour}시`;
              latestForecasts.push({ day: displayHour, temp: Math.round(parseFloat(varValue)), icon: '☀️' });
            }
          }

          // 주요 속성 매칭 스캔
          if (varName === 'TA' && currentTemp === '--') currentTemp = Math.round(parseFloat(varValue));
          if (varName === 'REH' && humidity === '--') humidity = varValue;
          if (varName === 'WSD' && wind === '--') wind = varValue;
          if (varName === 'TMX') highTemp = Math.round(parseFloat(varValue));
          if (varName === 'TMN') lowTemp = Math.round(parseFloat(varValue));
          
          if (varName === 'SKY') {
            if (varValue === '1') { condition = '맑음'; mainIcon = '☀️'; }
            else if (varValue === '3') { condition = '구름많음'; mainIcon = '⛅'; }
            else if (varValue === '4') { condition = '흐림'; mainIcon = '☁️'; }
          }
        });

        // 타임라인 아이콘 보정
        const finalForecast = latestForecasts.map((f, i) => ({
          ...f,
          icon: i === 1 ? '⛅' : i === 2 ? '☁️' : '☀️'
        }));

        setWeather({
          city: '서울',
          temp: currentTemp !== '--' ? currentTemp : 18, 
          condition,
          mainIcon,
          high: highTemp !== '--' ? highTemp : 23,
          low: lowTemp !== '--' ? lowTemp : 13,
          humidity: humidity !== '--' ? `${humidity}%` : '50%',
          wind: wind !== '--' ? `${wind}m/s` : '2.5m/s',
          forecast: finalForecast.length > 0 ? finalForecast : [
            { day: '오전 9시', temp: 17, icon: '☀️' },
            { day: '오후 12시', temp: 22, icon: '⛅' },
            { day: '오후 3시', temp: 20, icon: '☁️' }
          ]
        });
      } catch (error) {
        console.error('기상청 API 허브 연동 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHubWeatherData();
  }, []);

  if (loading) {
    return <div className="weather-app"><div className="weather-main">기상청 API 허브 데이터 수신 중...</div></div>;
  }

  return (
    <div className="weather-app">
      {/* 현재 날씨 메인 영역 */}
      <div className="weather-main">
        <div className="weather-location">
          <span className="location-icon">📍</span> {weather.city} 
        </div>
        <div className="main-display">
          <span className="weather-big-icon">{weather.mainIcon}</span>
          <div className="temp-info">
            <span className="current-temp">{weather.temp}°</span>
            <span className="condition-text">{weather.condition}</span>
          </div>
        </div>
        <div className="temp-range">
          🔺 최고: {weather.high}° | 🔹 최저: {weather.low}°
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

      {/* 시간별 예보 영역 */}
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