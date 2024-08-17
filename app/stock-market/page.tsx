"use client";
import React, {useEffect, useState} from 'react';
import {Card, Col, Row, Table} from 'antd';
import {Gauge, GaugeConfig} from '@ant-design/charts';
import axios from 'axios';
import styles from './page.module.css';


interface Forecast {
    confidence: string;
    source: string;
    trend: 'bullish' | 'bearish';
}


interface ForecastResponse {
    forecasts: Forecast[];
}

const ForecastPage: React.FC = () => {
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [aggregatedConfidence, setAggregatedConfidence] = useState<number>(0);

    useEffect(() => {
        axios.get<ForecastResponse>('http://127.0.0.1:5000/stock-market-predictions')
            .then(response => {
                const data = response.data.forecasts;
                setForecasts(data);

                const bullishData = data.filter((item: Forecast) => item.trend === 'bullish');
                const avgConfidence = bullishData.length > 0
                    ? bullishData.reduce((acc, item) => acc + parseFloat(item.confidence), 0) / bullishData.length
                    : 0;

                setAggregatedConfidence(avgConfidence || 0);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, []);


    const columns = [
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (confidence: number) => (confidence * 100).toFixed(2) + '%',
        },
        {
            title: 'Trend',
            dataIndex: 'trend',
            key: 'trend',
            render: (trend: 'bullish' | 'bearish') => (
                <span className={trend === 'bullish' ? styles.bullish : styles.bearish}>
          {trend.charAt(0).toUpperCase() + trend.slice(1)}
        </span>
            ),
        },
    ];

    const getTextContent = (target: number, total: number) => {
        const percentage = (target / total) * 100;

        if (percentage <= 20) {
            return 'Bearish';
        } else if (percentage > 20 && percentage <= 40) {
            return 'Slightly Bearish';
        } else if (percentage > 40 && percentage <= 60) {
            return 'Neutral';
        } else if (percentage > 60 && percentage <= 80) {
            return 'Slightly Bullish';
        } else {
            return 'Bullish';
        }
    };

    const gaugeConfig: GaugeConfig = {
        width: 500,
        height: 500,
        autoFit: true,
        data: {
            target: aggregatedConfidence * 100,
            total: 100,
            name: 'confidence score',
            thresholds: [20, 40, 60, 80, 100],
        },
        legend: false,
        scale: {
            color: {
                range: ['#F4664A', '#FAAD14', '#FFD700', '#00A2FF', 'green'],
            },
        },
        style: {
            textContent: (target: any, total: any) => getTextContent(target, total),
        },
    };


    return (
        <div className={styles.container}>
            <Row gutter={[16, 16]}>
                <Col span={16}>
                    <Card title="Iran Stock Market Forecast" className={styles.card}>
                        <Table
                            columns={columns}
                            dataSource={forecasts}
                            rowKey="source"
                            pagination={false}
                            className={styles.table}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Aggregated Confidence" className={styles.card}>
                        <Gauge {...gaugeConfig} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ForecastPage;
