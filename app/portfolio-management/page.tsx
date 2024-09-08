"use client";
import React, { useEffect, useState } from "react";
import { Button, Input, message, Select, Spin, Table } from "antd";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter } from "recharts";
import type { ColumnsType } from "antd/lib/table";

// TypeScript types for the data
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
}

export default function PortfolioManagement() {
    const [tickers, setTickers] = useState<{ value: string; label: string }[]>([]);
    const [investedAmounts, setInvestedAmounts] = useState<InvestedAmountType>({});
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const [investedAmount, setInvestedAmount] = useState<string>("");
    const [result, setResult] = useState<PortfolioResultType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch tickers when the component is loaded
    useEffect(() => {
        axios.get("http://127.0.0.1:5000/tickers").then((response) => {
            const tickerOptions = response.data["stock-tickers"].map((ticker: string) => ({
                value: ticker,
                label: ticker,
            }));
            setTickers(tickerOptions);
        });
    }, []);

    // Function to handle adding a new record
    const addNewRecord = () => {
        if (selectedTicker && investedAmount) {
            setInvestedAmounts((prev) => ({
                ...prev,
                [selectedTicker]: parseFloat(investedAmount),
            }));
            setSelectedTicker(null);
            setInvestedAmount("");
        } else {
            message.warning("لطفاً نماد را انتخاب کرده و مبلغ سرمایه‌گذاری را وارد کنید.");
        }
    };

    // Function to handle submitting the portfolio to get results
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

    // Table columns for displaying the portfolio data
    const columns: ColumnsType<{ ticker: string; amount: number }> = [
        {
            title: "نماد",
            dataIndex: "ticker",
            key: "ticker",
        },
        {
            title: "مبلغ سرمایه‌گذاری",
            dataIndex: "amount",
            key: "amount",
        },
    ];

    // Prepare table data
    const tableData = Object.entries(investedAmounts).map(([ticker, amount]) => ({
        key: ticker,
        ticker,
        amount,
    }));

    // Prepare data for the cumulative returns chart
    const cumulativeReturnsData =
        result?.cum_returns_data?.invested_cum_returns.map((_, index) => ({
            day: `روز ${index + 1}`,
            invested: result.cum_returns_data.invested_cum_returns[index],
            optimized: result.cum_returns_data.optimized_cum_returns[index],
            index: result.cum_returns_data.index_cum_returns[index],
        })) || [];

    // Prepare data for the risk vs return chart
    const riskVsReturnData =
        result?.risk_vs_return_data.tickers.map((ticker, index) => ({
            ticker,
            return: result.risk_vs_return_data.returns[index],
            risk: result.risk_vs_return_data.risks[index],
        })) || [];

    // Columns for risk and return comparison table
    const riskReturnColumns = [
        { title: "شاخص", dataIndex: "metric", key: "metric" },
        { title: "پرتفوی اولیه", dataIndex: "initial", key: "initial" },
        { title: "پرتفوی بهینه", dataIndex: "optimized", key: "optimized" },
    ];

    // Data for risk and return comparison table
    const riskReturnTableData = [
        {
            key: "1",
            metric: "بازدهی (%)",
            initial: result?.comparison_data.initial_return.toFixed(2),
            optimized: result?.comparison_data.optimized_return.toFixed(2),
        },
        {
            key: "2",
            metric: "ریسک (انحراف معیار) (%)",
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
            metric: "سود/زیان (اولیه)",
            initial: result?.comparison_data.initial_profit_or_loss.toFixed(2),
            optimized: result?.comparison_data.optimized_profit_or_loss.toFixed(2),
        },
    ];

    return (
        <div style={{ padding: "24px", fontFamily: "Tahoma", textAlign: "right" }}>
            <h1>مدیریت پرتفوی</h1>

            <div style={{ marginBottom: "16px" }}>
                {/* Select Ticker */}
                <Select
                    showSearch
                    style={{ width: 200, marginRight: 10 }}
                    placeholder="انتخاب نماد"
                    options={tickers}
                    value={selectedTicker}
                    onChange={(value) => setSelectedTicker(value)}
                />

                {/* Invested Amount Input */}
                <Input
                    placeholder="مبلغ سرمایه‌گذاری را وارد کنید"
                    style={{ width: 200, marginRight: 10 }}
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    type="number"
                />

                {/* Add Ticker Button */}
                <Button type="primary" onClick={addNewRecord}>
                    افزودن نماد
                </Button>
            </div>

            {/* Display the table of tickers and amounts */}
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                bordered
                style={{ marginBottom: "16px" }}
            />

            {/* Submit Button */}
            <Button type="primary" onClick={handleSubmit} loading={loading}>
                ثبت پرتفوی
            </Button>

            {/* Loading Indicator */}
            {loading && <Spin />}

            {/* Display results */}
            {result && (
                <div style={{ marginTop: "32px" }}>
                    <h2>نتایج پرتفوی</h2>

                    {/* Cumulative Returns Chart */}
                    <h3>بازده تجمعی:</h3>
                    <LineChart
                        width={600}
                        height={300}
                        data={cumulativeReturnsData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="invested" stroke="#8884d8" name="سرمایه‌گذاری‌شده" />
                        <Line type="monotone" dataKey="optimized" stroke="#82ca9d" name="بهینه‌شده" />
                        <Line type="monotone" dataKey="index" stroke="#ffc658" name="شاخص" />
                    </LineChart>

                    {/* Risk vs Return Scatter Plot */}
                    <h3>مقایسه ریسک و بازده:</h3>
                    <ScatterChart
                        width={600}
                        height={300}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid />
                        <XAxis type="number" dataKey="risk" name="ریسک" unit="%" />
                        <YAxis type="number" dataKey="return" name="بازده" unit="%" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter name="نمادها" data={riskVsReturnData} fill="#8884d8" />
                    </ScatterChart>

                    {/* Risk and Return Comparison Table */}
                    <h3>جدول مقایسه ریسک و بازده:</h3>
                    <Table
                        columns={riskReturnColumns}
                        dataSource={riskReturnTableData}
                        pagination={false}
                        bordered
                        style={{ marginBottom: "16px" }}
                    />
                </div>
            )}
        </div>
    );
}
