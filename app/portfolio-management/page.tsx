"use client";
import React, {useEffect, useState} from "react";
import {Button, Input, message, Select, Spin, Table} from "antd";
import axios from "axios";
import {CartesianGrid, Line, LineChart, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from "recharts";
import type {ColumnsType} from "antd/lib/table";
import styles from './page.module.css';

interface InvestedAmountType {
    [key: string]: number;
}

interface PortfolioResultType {
    comparison_data: {
        initial_return: number;
        optimized_return: number;
        initial_stddev: number;
        optimized_stddev: number;
        initial_sharpe: number;
        optimized_sharpe: number;
        initial_profit_or_loss: number;
        optimized_profit_or_loss: number;
    };
    cum_returns_data: {
        invested_cum_returns: number[];
        optimized_cum_returns: number[];
        index_cum_returns: number[];
    };
    risk_vs_return_data: {
        tickers: string[];
        returns: number[];
        risks: number[];
    };
    optimized_portfolio: {
        [key: string]: number;
    };
}

export default function PortfolioManagement() {
    const [tickers, setTickers] = useState<{ value: string; label: string }[]>([]);
    const [investedAmounts, setInvestedAmounts] = useState<InvestedAmountType>({});
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const [investedAmount, setInvestedAmount] = useState<string>("");
    const [result, setResult] = useState<PortfolioResultType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        axios.get("http://127.0.0.1:5000/tickers").then((response) => {
            const tickerOptions = response.data["stock-tickers"].map((ticker: string) => ({
                value: ticker,
                label: ticker,
            }));
            setTickers(tickerOptions);
        });
    }, []);

    const addNewRecord = () => {
        if (selectedTicker && investedAmount) {
            setInvestedAmounts((prev) => ({
                ...prev,
                [selectedTicker]: parseFloat(investedAmount),
            }));
            setSelectedTicker(null);
            setInvestedAmount("");
        } else {
            message.warning("لطفا نماد را انتخاب کرده و مبلغ سرمایه‌گذاری را وارد کنید.");
        }
    };

    const removeRecord = (ticker: string) => {
        setInvestedAmounts((prev) => {
            const updated = {...prev};
            delete updated[ticker];
            return updated;
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://127.0.0.1:5000/manage-stock-portfolio", {
                invested_amounts_dict: investedAmounts,
            });
            setResult(response.data);
        } catch (error) {
            message.error("خطا در دریافت اطلاعات پرتفوی.");
        }
        setLoading(false);
    };

    const columns: ColumnsType<{ ticker: string; amount: number }> = [
        {
            title: "نماد",
            dataIndex: "ticker",
            key: "ticker",
        },
        {
            title: "مبلغ سرمایه‌گذاری (تومان)",
            dataIndex: "amount",
            key: "amount",
        },
        {
            title: "عملیات",
            key: "remove",
            render: (record) => (
                <Button danger onClick={() => removeRecord(record.ticker)}>
                    حذف
                </Button>
            ),
        },
    ];

    const tableData = Object.entries(investedAmounts).map(([ticker, amount]) => ({
        key: ticker,
        ticker,
        amount,
    }));

    const optimizationTableData = result?.risk_vs_return_data.tickers.map((ticker, index) => ({
        key: ticker,
        ticker,
        oldAmount: investedAmounts[ticker],
        optimizedAmount: Number(result.optimized_portfolio[ticker].toFixed(0)),
        risk: Number(result.risk_vs_return_data.risks[index].toFixed(2)),
        return: Number(result.risk_vs_return_data.returns[index].toFixed(2)),
    })) || [];

    const optimizationColumns: ColumnsType<{
        ticker: string;
        oldAmount: number;
        optimizedAmount: number;
        risk: number;
        return: number
    }> = [
        {
            title: "نماد",
            dataIndex: "ticker",
            key: "ticker",
        },
        {
            title: "مبلغ اولیه (تومان)",
            dataIndex: "oldAmount",
            key: "oldAmount",
        },
        {
            title: "مبلغ بهینه‌شده (تومان)",
            dataIndex: "optimizedAmount",
            key: "optimizedAmount",
        },
        {
            title: "ریسک (%)",
            dataIndex: "risk",
            key: "risk",
        },
        {
            title: "بازده (%)",
            dataIndex: "return",
            key: "return",
        },
    ];

    const cumulativeReturnsData =
        result?.cum_returns_data?.invested_cum_returns.map((_, index) => ({
            day: `روز ${index + 1}`,
            invested: result.cum_returns_data.invested_cum_returns[index],
            optimized: result.cum_returns_data.optimized_cum_returns[index],
            index: result.cum_returns_data.index_cum_returns[index],
        })) || [];

    const riskVsReturnData =
        result?.risk_vs_return_data.tickers.map((ticker, index) => ({
            ticker,
            return: result.risk_vs_return_data.returns[index],
            risk: result.risk_vs_return_data.risks[index],
        })) || [];

    const riskReturnColumns = [
        {title: "شاخص", dataIndex: "metric", key: "metric"},
        {title: "پرتفوی اولیه", dataIndex: "initial", key: "initial"},
        {title: "پرتفوی بهینه", dataIndex: "optimized", key: "optimized"},
    ];

    const riskReturnTableData = [
        {
            key: "1",
            metric: "بازدهی (%)",
            initial: result?.comparison_data.initial_return.toFixed(2),
            optimized: result?.comparison_data.optimized_return.toFixed(2),
        },
        {
            key: "2",
            metric: "ریسک (%)",
            initial: result?.comparison_data.initial_stddev.toFixed(2),
            optimized: result?.comparison_data.optimized_stddev.toFixed(2),
        },
        {
            key: "3",
            metric: "نسبت شارپ",
            initial: result?.comparison_data.initial_sharpe.toFixed(2),
            optimized: result?.comparison_data.optimized_sharpe.toFixed(2),
        },
        {
            key: "4",
            metric: "سود/زیان (تومان)",
            initial: result?.comparison_data.initial_profit_or_loss.toFixed(2),
            optimized: result?.comparison_data.optimized_profit_or_loss.toFixed(2),
        },
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>مدیریت پرتفوی</h1>

            <div className={styles.inputSection}>
                <Select
                    showSearch
                    style={{width: 200, marginRight: 10}}
                    placeholder="انتخاب نماد"
                    options={tickers}
                    value={selectedTicker}
                    onChange={(value) => setSelectedTicker(value)}
                />
                <Input
                    placeholder="مبلغ سرمایه‌گذاری (تومان)"
                    style={{width: 200, marginRight: 10, marginLeft: 15}}
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    type="number"
                />
                <Button type="primary" onClick={addNewRecord}>
                    افزودن نماد
                </Button>
            </div>

            <h3>پرتفوی سرمایه‌گذاری</h3>
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                bordered
                className={styles.table}
            />

            <div className={styles.centeredButton}>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    ثبت پرتفوی
                </Button>
            </div>

            {loading && <Spin/>}

            {result && (
                <div className={styles.resultSection}>

                    <h3 className={styles.pageTitle}>پرتفوی پیشنهادی</h3>
                    <Table
                        columns={optimizationColumns}
                        dataSource={optimizationTableData}
                        pagination={false}
                        bordered
                        className={styles.table}
                    />

                    <h3 className={styles.pageTitle}>بازده تجمعی پرتفوی و شاخص کل</h3>
                    <div className={styles.chartWrapper}>
                        <LineChart
                            width={700}
                            height={400}
                            data={cumulativeReturnsData}
                            margin={{top: 10, right: 30, bottom: 40, left: 40}}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="day"/>
                            <YAxis label={{value: 'بازده تجمعی (%)', angle: -90, position: 'insideLeft', offset: -5}}/>
                            <Tooltip/>
                            <Line type="monotone" dataKey="invested" stroke="#8884d8" name="سرمایه‌گذاری‌شده"/>
                            <Line type="monotone" dataKey="optimized" stroke="#82ca9d" name="بهینه‌شده"/>
                            <Line type="monotone" dataKey="index" stroke="#ffc658" name="شاخص"/>
                        </LineChart>
                    </div>

                    <h3 className={styles.pageTitle}>مقایسه ریسک و بازده نمادها</h3>
                    <div className={styles.chartWrapper}>
                        <ScatterChart
                            width={700}
                            height={400}
                            margin={{top: 10, right: 30, bottom: 40, left: 40}}
                        >
                            <CartesianGrid/>
                            <XAxis
                                type="number"
                                dataKey="risk"
                                name="ریسک"
                                unit="%"
                                label={{value: 'ریسک', position: 'insideBottom', offset: -20}}
                            />
                            <YAxis
                                type="number"
                                dataKey="return"
                                name="بازده"
                                unit="%"
                                label={{value: 'بازده', angle: -90, position: 'insideLeft', offset: -20}}
                            />
                            <Tooltip
                                cursor={{strokeDasharray: "3 3"}}
                                content={({active, payload}) => {
                                    if (active && payload && payload.length) {
                                        const {ticker, risk, return: ret} = payload[0].payload;
                                        return (
                                            <div className={styles.customTooltip}>
                                                <p className={styles.tooltipTitle}>{`نماد: ${ticker}`}</p>
                                                <p className={styles.tooltipText}>{`ریسک: ${risk?.toFixed(2)}%`}</p>
                                                <p className={styles.tooltipText}>{`بازده: ${ret?.toFixed(2)}%`}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="نمادها" data={riskVsReturnData} fill="#8884d8"/>
                        </ScatterChart>
                    </div>

                    <h3 className={styles.pageTitle}>مقایسه ریسک و بازده پرتفوی</h3>
                    <Table
                        columns={riskReturnColumns}
                        dataSource={riskReturnTableData}
                        pagination={false}
                        bordered
                        className={styles.table}
                    />
                </div>
            )}
        </div>
    );
}
