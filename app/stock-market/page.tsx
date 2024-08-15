"use client";
import { useEffect, useState } from 'react';
import { Card, Table, Typography, Spin } from 'antd';
import GaugeChart from 'react-gauge-chart';
import axios from 'axios';

const { Title, Text } = Typography;

const calculateGaugeValue = (forecasts: any[]) => {
    if (forecasts.length === 0) return 0.5;

    let bullishCount = 0;
    let bearishCount = 0;

    forecasts.forEach((forecast: any) => {
        if (forecast.market_trend === 'bullish') bullishCount++;
        if (forecast.market_trend === 'bearish') bearishCount++;
    });

    const total = forecasts.length;
    const bullishRatio = bullishCount / total;
    const bearishRatio = bearishCount / total;

    if (bullishRatio > bearishRatio) return 0.5 + bullishRatio / 2;
    if (bearishRatio > bullishRatio) return 0.5 - bearishRatio / 2;
    return 0.5;
};

const getGaugeLabel = (forecasts: any[]) => {
    if (forecasts.length === 0) return 'Neutral';

    let bullishCount = 0;
    let bearishCount = 0;

    forecasts.forEach((forecast: any) => {
        if (forecast.market_trend === 'bullish') bullishCount++;
        if (forecast.market_trend === 'bearish') bearishCount++;
    });

    const total = forecasts.length;
    const bullishRatio = bullishCount / total;
    const bearishRatio = bearishCount / total;

    if (bullishRatio > bearishRatio) return 'Bullish';
    if (bearishRatio > bullishRatio) return 'Bearish';
    return 'Neutral';
};

export default function StockMarketForecast() {
    const [gaugeValue, setGaugeValue] = useState(0.5);
    const [forecasts, setForecasts] = useState<any[]>([]);
    const [gaugeLabel, setGaugeLabel] = useState('Neutral');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecasts = async () => {
            try {
                const response = await axios.get('https://e6f5a747-5885-41f1-b6b2-cfceb4c7eafb.mock.pstmn.io/api/stock-market-forecast');
                const { forecasts } = response.data;
                setForecasts(forecasts);
                setGaugeValue(calculateGaugeValue(forecasts));
                setGaugeLabel(getGaugeLabel(forecasts));
            } catch (error) {
                console.error('Error fetching forecasts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchForecasts();
    }, []);

    const columns = [
        {
            title: 'Agency',
            dataIndex: 'source_agency',
            key: 'source_agency',
        },
        {
            title: 'Trend',
            dataIndex: 'market_trend',
            key: 'market_trend',
            render: (text: string) => (
                <Text style={{ color: text === 'bullish' ? '#4CAF50' : text === 'bearish' ? '#F44336' : '#FFC107' }}>
                    {text.charAt(0).toUpperCase() + text.slice(1)}
                </Text>
            ),
        },
        {
            title: 'Confidence Score',
            dataIndex: 'confidence_score',
            key: 'confidence_score',
            render: (text: number) => (
                <Text>{text.toFixed(2)}</Text> // Format the score to 2 decimal places
            ),
        },
        {
            title: 'News',
            dataIndex: 'news',
            key: 'news',
        },
    ];

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <Card
                style={{ width: '300px', margin: '0 auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                title={<Title level={4}>Stock Market Forecast</Title>}
            >
                <GaugeChart
                    id="stock-market-gauge"
                    nrOfLevels={20}
                    colors={['#FF0000', '#FFFF00', '#00FF00']}
                    arcWidth={0.3}
                    percent={gaugeValue}
                    textColor="#000000"
                />
                <div style={{ fontSize: '16px', marginTop: '10px', fontWeight: 'bold' }}>
                    {gaugeLabel}
                </div>
            </Card>
            <div style={{ marginTop: '20px', maxWidth: '1200px', margin: '20px auto' }}>
                {loading ? (
                    <Spin tip="Loading..." />
                ) : (
                    <Card title={<Title level={4}>Forecasts from Agencies</Title>}>
                        <Table
                            dataSource={forecasts}
                            columns={columns}
                            rowKey="id" // Ensure each forecast has a unique 'id'
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                )}
            </div>
        </div>
    );
}
