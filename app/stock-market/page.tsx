"use client";
import React, {useEffect, useState} from 'react';
import {Card, Col, Row, Table, Typography} from 'antd';
import {Gauge, GaugeConfig} from '@ant-design/charts';
import axios from 'axios';
import styles from './page.module.css';

const { Title } = Typography;

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
            title: 'منبع',
            dataIndex: 'source',
            key: 'source',
        },
        {
            title: 'اطمینان',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (confidence: number) => (confidence * 100).toFixed(2) + '%',
        },
        {
            title: 'روند',
            dataIndex: 'trend',
            key: 'trend',
            render: (trend: 'bullish' | 'bearish') => (
                <span className={trend === 'bullish' ? styles.bullish : styles.bearish}>
                    {trend === 'bullish' ? 'صعودی' : 'نزولی'}
                </span>
            ),
        },
    ];

    const getTextContent = (target: number, total: number) => {
        const percentage = (target / total) * 100;

        if (percentage <= 20) {
            return 'نزولی';
        } else if (percentage > 20 && percentage <= 40) {
            return 'کمی نزولی';
        } else if (percentage > 40 && percentage <= 60) {
            return 'خنثی';
        } else if (percentage > 60 && percentage <= 80) {
            return 'کمی صعودی';
        } else {
            return 'صعودی';
        }
    };

    const gaugeConfig: GaugeConfig = {
        width: 400,
        height: 400,
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
                range: ['#F4664A', '#FAAD14', '#FFD700', '#00A2FF', '#30BF78'],
            },
        },
        style: {
            textContent: (target: any, total: any) => getTextContent(target, total),
        },
    };

    return (
        <div className={styles.container}>
            <Title level={2} className={styles.pageTitle}>پیش‌بینی بازار بورس ایران</Title>
            <Row gutter={[24, 24]}>
                <Col span={16}>
                    <Card title="پیش‌بینی‌ها" className={styles.card}>
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
                    <Card title="پیش‌بینی کلی" className={styles.card}>
                        <Gauge {...gaugeConfig} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ForecastPage;
